

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, collection, query, where, getDocs, Timestamp, runTransaction, increment, limit, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { processVerificationSubmission, generateUniqueUsername, updateUserProfile as updateUserProfileServer, getUserByUid } from '@/app/actions/user';
import type { PermissionId, Position, MemberType, VerificationStatus } from '@/lib/definitions';
import { ALL_PERMISSIONS } from '@/lib/definitions';
import { logAnalyticsEvent } from '@/lib/analytics';
import { seedInitialData } from '@/lib/seed-data';


type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected' | 'manual';

type ExtendedUser = User & {
  referralCount?: number;
  referralCode?: string;
  greenPoints?: number;
  verificationStatus?: VerificationStatus;
  fullName?: string;
  username?: string;
  nik?: string;
  positionId?: string;
  position?: string;
  permissions?: PermissionId[];
  waNumber?: string;
  waVerified?: boolean;
  type?: MemberType;
  instagram?: string;
  linkedin?: string;
  skills?: string[];
  interests?: string[];
  assignedBadges?: string[];
  uplineStructure?: Record<string, number>;
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  hasPermission: (permission: PermissionId) => boolean;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<void>;
  verifyOtp: (otp: string, referrerUsername?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { photoFile?: File, username?: string, instagram?: string, linkedin?: string, skills?: string[], interests?: string[] }) => Promise<void>;
  submitForVerification: (data: { fullName: string; nik: string; ktpDataUrl: string; photoDataUrl?: string; waNumber: string; }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Declare recaptchaVerifier in a broader scope on the window object
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

const ADMIN_PHONE_NUMBER = '+6285176752610';
const OFFICIAL_ACCOUNT_PHONE = '+6285144904161';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserDetails = useCallback(async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      let permissions: PermissionId[] = [];
      let positionName = 'Anggota';
      let userType = userData.type;

      if (userData.positionId) {
          const positionDocRef = doc(db, 'positions', userData.positionId);
          const positionDoc = await getDoc(positionDocRef);
          if (positionDoc.exists()) {
              const positionData = positionDoc.data() as Position;
              permissions = positionData.permissions || [];
              positionName = positionData.name;
          }
      }
      
      if (user.phoneNumber === ADMIN_PHONE_NUMBER) {
          permissions = ALL_PERMISSIONS.map(p => p.id);
      }

      if (user.phoneNumber === OFFICIAL_ACCOUNT_PHONE) {
          userType = 'official';
          positionName = 'Akun Resmi';
      }

      const extendedUser: ExtendedUser = {
          ...user, 
          referralCount: userData.referralCount || 0,
          referralCode: userData.referralCode,
          greenPoints: userData.greenPoints || 0,
          verificationStatus: userData.verificationStatus,
          displayName: userData.fullName || user.displayName,
          photoURL: userData.avatarUrl || user.photoURL,
          fullName: userData.fullName,
          username: userData.username,
          nik: userData.nik,
          positionId: userData.positionId,
          position: positionName,
          permissions: permissions,
          waNumber: userData.waNumber,
          waVerified: userData.waVerified,
          type: userType,
          instagram: userData.instagram,
          linkedin: userData.linkedin,
          skills: userData.skills || [],
          interests: userData.interests || [],
          assignedBadges: userData.assignedBadges || [],
      };
      setUser(extendedUser);
    } else {
      setUser({ ...user, referralCount: 0, greenPoints: 0, verificationStatus: 'unverified' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        await currentUser.reload();
        await fetchUserDetails(currentUser);
    }
  }, [fetchUserDetails]);

  useEffect(() => {
    seedInitialData();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserDetails(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserDetails]);

  const hasPermission = (permission: PermissionId): boolean => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
  }

 const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
        window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error) {
        console.error("signInWithPhoneNumber error:", error);
        throw error;
    }
  };
  

  const verifyOtp = async (otp: string, referrerUsername?: string) => {
    if (!window.confirmationResult) {
      throw new Error("No confirmation result available. Please request an OTP first.");
    }
    
    try {
      const userCredential = await window.confirmationResult.confirm(otp);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
          const newUser = userCredential.user;
          const tempName = `Anggota ${String(newUser.phoneNumber).slice(-4)}`;
          const username = await generateUniqueUsername(tempName);
          const ownReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          let referredBy: string | undefined = undefined;
          let upline: string[] = [];

          if (referrerUsername) {
              const referrerUserDoc = await getDocs(query(collection(db, 'users'), where('username', '==', referrerUsername), limit(1)));
              if(!referrerUserDoc.empty) {
                  const referrerData = referrerUserDoc.docs[0].data();
                  referredBy = referrerUserDoc.docs[0].id;
                  upline = [referredBy, ...(referrerData.upline || [])];
              }
          }
          
          const pointLogsCollection = collection(userDocRef, 'pointLogs');
          const welcomePoints = 5;

          await runTransaction(db, async (transaction) => {
              const userData: { [key: string]: any } = {
                  uid: newUser.uid,
                  displayName: tempName,
                  fullName: tempName,
                  username: username,
                  email: newUser.email,
                  phoneNumber: newUser.phoneNumber,
                  photoURL: newUser.photoURL || `https://picsum.photos/seed/${newUser.uid}/100/100`,
                  avatarUrl: newUser.photoURL || `https://picsum.photos/seed/${newUser.uid}/100/100`,
                  createdAt: serverTimestamp(),
                  referralCode: ownReferralCode,
                  referralCount: 0,
                  greenPoints: welcomePoints,
                  upline: upline.slice(0, 10), // Limit upline to 10 levels
                  verificationStatus: 'unverified',
              };

              if (referredBy) {
                userData.referredBy = referredBy;
              }

              transaction.set(userDocRef, userData);
              
              const welcomeLogRef = doc(pointLogsCollection);
              transaction.set(welcomeLogRef, {
                  points: welcomePoints,
                  description: 'Poin selamat datang!',
                  createdAt: Timestamp.now()
              });

              if (referredBy) {
                  const referrerRef = doc(db, 'users', referredBy);
                  transaction.update(referrerRef, { referralCount: increment(1) });
              }
          });
          
          logAnalyticsEvent('sign_up', { method: 'phone', referral: !!referredBy });
      } else {
          logAnalyticsEvent('login', { method: 'phone' });
      }
    } catch (error) {
      console.error("Error verifying OTP or creating user:", error);
      // Re-throw a more user-friendly error
      throw new Error("Kode OTP yang Anda masukkan tidak valid atau telah kedaluwarsa. Silakan coba lagi.");
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
       if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = undefined;
        }
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const updateUserProfile = async (updates: { photoFile?: File, username?: string, instagram?: string, linkedin?: string, skills?: string[], interests?: string[] }) => {
      if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");
      await updateUserProfileServer(auth.currentUser.uid, updates);
  };

const submitForVerification = async (data: { fullName: string; nik: string; ktpDataUrl: string; photoDataUrl?: string; waNumber: string; }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");
    logAnalyticsEvent('begin_verification');
    await processVerificationSubmission(auth.currentUser.uid, data);
    logAnalyticsEvent('submit_verification', { status: 'success' });
    await refreshUser();
  };


  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, signInWithPhone, verifyOtp, signOut, updateUserProfile, submitForVerification, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      return redirect(redirectTo);
    }
    
  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};
