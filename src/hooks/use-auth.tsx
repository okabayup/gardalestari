
"use client";

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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';

type ExtendedUser = User & {
  level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoFile?: File }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Declare recaptchaVerifier in a broader scope
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, now fetch additional data from Firestore.
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...user, level: userData.level || 'Bronze' });
        } else {
          // Fallback if doc doesn't exist for some reason
          setUser({ ...user, level: 'Bronze' });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setupRecaptcha = (containerId: string) => {
    if (recaptchaVerifier) {
        // In some cases, you might want to clear previous instance
        const oldContainer = document.getElementById(containerId);
        if(oldContainer) oldContainer.innerHTML = '';
    }
    
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': () => {
        // reCAPTCHA solved, allow sign-in button.
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        toast({
            variant: 'destructive',
            title: 'reCAPTCHA Kedaluwarsa',
            description: 'Silakan selesaikan reCAPTCHA lagi.',
        });
      }
    });
  }

  const signInWithPhone = async (phoneNumber: string, appVerifierContainerId: string) => {
    // Ensure reCAPTCHA is only set up on the client and in the correct path
    if (typeof window !== 'undefined' && (pathname === '/login' || pathname === '/register')) {
        if (!document.getElementById(appVerifierContainerId)) {
            // Wait for the container to be in the DOM
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
    
    // Check if it's a new user
    const { _tokenResponse } = userCredential as any;
    if (_tokenResponse.isNewUser) {
        const newUser = userCredential.user;
        // Create user document in Firestore
        await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            name: newUser.displayName || `Anggota Baru ${String(newUser.phoneNumber).slice(-4)}`,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            avatarUrl: newUser.photoURL || `https://picsum.photos/seed/${newUser.uid}/100/100`,
            createdAt: new Date(),
            level: 'Bronze', // Default level for new users
        });
    }

    setConfirmationResult(null); // Clear confirmation result
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear recaptcha
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoFile?: File }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");

    let photoURL = auth.currentUser.photoURL;

    // Handle photo upload
    if (updates.photoFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}`);
        
        await uploadBytes(storageRef, updates.photoFile);
        photoURL = await getDownloadURL(storageRef);
    }
    
    // Update profile in Firebase Auth
    await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: photoURL,
    });
    
    // Update user document in Firestore for consistency
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
        name: updates.displayName,
        avatarUrl: photoURL
    }, { merge: true });

    // Manually update the user state to reflect changes immediately
    setUser(auth.currentUser as ExtendedUser);
};


  return (
    <AuthContext.Provider value={{ user, loading, signInWithPhone, verifyOtp, signOut, updateUserProfile }}>
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

  useEffect(() => {
    if (!loading && !user) {
      redirect(redirectTo);
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
};
