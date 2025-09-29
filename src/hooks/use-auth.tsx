

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, Timestamp, runTransaction, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';
import { checkUsernameExists } from '@/app/actions/user';
import type { PermissionId, Position, MemberType } from '@/lib/definitions';
import { ALL_PERMISSIONS } from '@/lib/definitions';
import { logAnalyticsEvent } from '@/lib/analytics';
import { seedInitialData } from '@/lib/seed-data';


type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected' | 'manual';

type ExtendedUser = User & {
  referralCount?: number;
  referralCode?: string;
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
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  hasPermission: (permission: PermissionId) => boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { photoFile?: File, username?: string, instagram?: string, linkedin?: string, skills?: string[], interests?: string[] }) => Promise<void>;
  submitForVerification: (data: { fullName: string; nik: string; ktpFile: File; photoFile?: File; waNumber: string }) => Promise<void>;
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
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
      
      // Grant all permissions if phone number matches admin, but don't override display data
      if (user.phoneNumber === ADMIN_PHONE_NUMBER) {
          permissions = ALL_PERMISSIONS.map(p => p.id);
          // We don't override positionName here so the real position is shown
      }

      if (user.phoneNumber === OFFICIAL_ACCOUNT_PHONE) {
          userType = 'official';
          positionName = 'Akun Resmi';
      }

      const extendedUser: ExtendedUser = {
          ...user, 
          referralCount: userData.referralCount || 0,
          referralCode: userData.referralCode,
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
      };
      setUser(extendedUser);
    } else {
      setUser({ ...user, referralCount: 0, verificationStatus: 'unverified' });
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
    // This will run once when the app loads.
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

 const signInWithPhone = async (phoneNumber: string, appVerifierContainerId: string) => {
    if (typeof window !== 'undefined') {
        if (!window.recaptchaVerifier) {
            const verifier = new RecaptchaVerifier(auth, appVerifierContainerId, {
                'size': 'invisible',
                'callback': () => {},
                'expired-callback': () => {
                    if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                        window.recaptchaVerifier = undefined;
                    }
                    toast({
                        variant: 'destructive',
                        title: 'reCAPTCHA Kedaluwarsa',
                        description: 'Silakan coba lagi.',
                    });
                },
                customParameters: {
                    sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
                }
            });
            window.recaptchaVerifier = verifier;
            await verifier.render();
        }

        const appVerifier = window.recaptchaVerifier;
        
        try {
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
        } catch (error) {
            console.error("signInWithPhoneNumber error:", error);
            // Don't clear verifier here so user can retry without new recaptcha
            throw error;
        }
    }
  };
  
  const generateUniqueUsername = async (fullName: string): Promise<string> => {
    const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
    let username = baseUsername;
    
    while (true) {
        const q = query(collection(db, 'users'), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return username;
        }
        username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
    }
  }


  const verifyOtp = async (otp: string, referralCode?: string) => {
    if (!confirmationResult) {
      throw new Error("No confirmation result available. Please request an OTP first.");
    }
    const userCredential = await confirmationResult.confirm(otp);
    
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUser = userCredential.user;
        const tempName = `Anggota ${String(newUser.phoneNumber).slice(-4)}`;
        const username = await generateUniqueUsername(tempName);
        const ownReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        let referredBy: string | undefined = undefined;
        if (referralCode) {
            const q = query(collection(db, 'users'), where("referralCode", "==", referralCode), limit(1));
            const referrerSnapshot = await getDocs(q);
            if (!referrerSnapshot.empty) {
                referredBy = referrerSnapshot.docs[0].id;
            }
        }

        await setDoc(userDocRef, {
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
            referredBy: referredBy,
            verificationStatus: 'unverified',
        });
        logAnalyticsEvent('sign_up', { method: 'phone', referral: !!referredBy });
    } else {
        logAnalyticsEvent('login', { method: 'phone' });
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

    const updateData: { [key: string]: any } = {};

    if (updates.photoFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}`);
        
        await uploadBytes(storageRef, updates.photoFile);
        const newPhotoURL = await getDownloadURL(storageRef);
        updateData.avatarUrl = newPhotoURL;
        updateData.photoURL = newPhotoURL;
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
    }

    if (updates.username) {
      const isAvailable = !(await checkUsernameExists(updates.username));
      if (!isAvailable) {
        throw new Error('Nama pengguna tersebut sudah digunakan.');
      }
      updateData.username = updates.username;
    }

    if (updates.instagram) {
        updateData.instagram = updates.instagram;
    }
     if (updates.linkedin) {
        updateData.linkedin = updates.linkedin;
    }
     if (updates.skills) {
        updateData.skills = updates.skills;
    }
     if (updates.interests) {
        updateData.interests = updates.interests;
    }
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, updateData, { merge: true });

    setUser(prevUser => prevUser ? { ...prevUser, ...updateData } : null);
};

const submitForVerification = async (data: { fullName: string; nik: string; ktpFile: File; photoFile?: File; waNumber: string; }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");

    logAnalyticsEvent('begin_verification');

    const nikQuery = query(collection(db, 'users'), where("nik", "==", data.nik));
    const nikSnapshot = await getDocs(nikQuery);
    if (!nikSnapshot.empty) {
        const existingDoc = nikSnapshot.docs[0];
        if (existingDoc.id !== auth.currentUser.uid) {
            throw new Error("NIK ini sudah terdaftar pada akun lain.");
        }
    }

    const { uid } = auth.currentUser;
    const storage = getStorage();
    
    const ktpRef = ref(storage, `kyc/${uid}/ktp.jpg`);

    const ktpUploadResult = await uploadBytes(ktpRef, data.ktpFile);
    const ktpImageUrl = await getDownloadURL(ktpUploadResult.ref);
    
    let newPhotoURL = user?.photoURL ?? null;
    if (data.photoFile) {
      const profilePicRef = ref(storage, `profile-pictures/${uid}`);
      const photoUploadResult = await uploadBytes(profilePicRef, data.photoFile);
      newPhotoURL = await getDownloadURL(photoUploadResult.ref);
    }

    const username = await generateUniqueUsername(data.fullName);

    const verificationData = {
        fullName: data.fullName,
        displayName: data.fullName,
        username: username,
        nik: data.nik,
        waNumber: data.waNumber,
        waVerified: true, // Mark as verified since it's part of the flow
        verificationStatus: 'temporary' as VerificationStatus,
        ktpImageUrl,
        avatarUrl: newPhotoURL,
        photoURL: newPhotoURL,
        submittedAt: serverTimestamp()
    };

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, verificationData, { merge: true });
    
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { 
            displayName: data.fullName, 
            photoURL: newPhotoURL 
        });
    }

    logAnalyticsEvent('submit_verification', { status: 'success' });

    setUser(prevUser => {
        if (!prevUser) return null;
        return {
            ...prevUser,
            ...verificationData
        };
    });
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
