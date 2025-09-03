
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';
import { checkUsernameExists } from '@/app/actions/user';
import type { PermissionId, Position } from '@/lib/definitions';
import { ALL_PERMISSIONS } from '@/lib/definitions';


type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';

type ExtendedUser = User & {
  points?: number;
  level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  verificationStatus?: VerificationStatus;
  fullName?: string;
  username?: string;
  nik?: string;
  positionId?: string;
  position?: string;
  permissions?: PermissionId[];
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  hasPermission: (permission: PermissionId) => boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { photoFile?: File, username?: string }) => Promise<void>;
  submitForVerification: (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File; photoFile?: File }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Declare recaptchaVerifier in a broader scope
let recaptchaVerifier: RecaptchaVerifier | null = null;
const ADMIN_PHONE_NUMBER = '+6285176752610';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let permissions: PermissionId[] = [];
          let positionName = 'Anggota';

          if (userData.positionId) {
              const positionDocRef = doc(db, 'positions', userData.positionId);
              const positionDoc = await getDoc(positionDocRef);
              if (positionDoc.exists()) {
                  const positionData = positionDoc.data() as Position;
                  permissions = positionData.permissions || [];
                  positionName = positionData.name;
              }
          }
          
          // Grant all permissions if phone number matches admin
          if (user.phoneNumber === ADMIN_PHONE_NUMBER) {
              permissions = ALL_PERMISSIONS.map(p => p.id);
              positionName = 'Super Admin';
          }

          const extendedUser: ExtendedUser = {
              ...user, 
              points: userData.points || 0,
              level: userData.level || 'Bronze',
              verificationStatus: userData.verificationStatus,
              displayName: userData.fullName || user.displayName,
              photoURL: userData.avatarUrl || user.photoURL,
              fullName: userData.fullName,
              username: userData.username,
              nik: userData.nik,
              positionId: userData.positionId,
              position: positionName,
              permissions: permissions,
          };
          setUser(extendedUser);
        } else {
          setUser({ ...user, points: 0, level: 'Bronze', verificationStatus: 'unverified' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const hasPermission = (permission: PermissionId): boolean => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
  }

  const setupRecaptcha = (containerId: string) => {
    if (recaptchaVerifier) {
        const oldContainer = document.getElementById(containerId);
        if(oldContainer) oldContainer.innerHTML = '';
    }
    
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': () => {},
      'expired-callback': () => {
        toast({
            variant: 'destructive',
            title: 'reCAPTCHA Kedaluwarsa',
            description: 'Silakan selesaikan reCAPTCHA lagi.',
        });
      }
    });
  }

  const generateUniqueUsername = async (fullName: string): Promise<string> => {
    const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
    let username = baseUsername;
    let attempts = 0;
    
    while (true) {
        const q = query(collection(db, 'users'), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return username;
        }
        attempts++;
        username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
    }
  }


  const signInWithPhone = async (phoneNumber: string, appVerifierContainerId: string) => {
    if (typeof window !== 'undefined' && (pathname === '/login' || pathname === '/register')) {
        if (!document.getElementById(appVerifierContainerId)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        setupRecaptcha(appVerifierContainerId);
        if(recaptchaVerifier) {
            const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            setConfirmationResult(result);
        } else {
            throw new Error("Recaptcha verifier not initialized");
        }
    }
  };

  const verifyOtp = async (otp: string) => {
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
            points: 0,
            level: 'Bronze',
            verificationStatus: 'unverified',
        });
    }

    setConfirmationResult(null);
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const updateUserProfile = async (updates: { photoFile?: File, username?: string }) => {
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
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, updateData, { merge: true });

    setUser(prevUser => prevUser ? { ...prevUser, ...updateData } : null);
};

const submitForVerification = async (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File; photoFile?: File; }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");

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
    const selfieRef = ref(storage, `kyc/${uid}/selfie.jpg`);
    const profilePicRef = ref(storage, `profile-pictures/${uid}`);

    const [ktpUploadResult, selfieUploadResult] = await Promise.all([
      uploadBytes(ktpRef, data.ktpFile),
      uploadBytes(selfieRef, data.selfieFile)
    ]);
    const ktpImageUrl = await getDownloadURL(ktpUploadResult.ref);
    const selfieImageUrl = await getDownloadURL(selfieUploadResult.ref);
    
    let newPhotoURL = user?.photoURL ?? null;
    if (data.photoFile) {
      const photoUploadResult = await uploadBytes(profilePicRef, data.photoFile);
      newPhotoURL = await getDownloadURL(photoUploadResult.ref);
    }

    const username = await generateUniqueUsername(data.fullName);

    const verificationData = {
        fullName: data.fullName,
        displayName: data.fullName,
        username: username,
        nik: data.nik,
        verificationStatus: 'permanent' as VerificationStatus,
        ktpImageUrl,
        selfieImageUrl,
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

    setUser(prevUser => {
        if (!prevUser) return null;
        return {
            ...prevUser,
            ...verificationData
        };
    });
  };


  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, signInWithPhone, verifyOtp, signOut, updateUserProfile, submitForVerification }}>
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
    if (!loading && !user) {
      redirect(redirectTo);
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
};
