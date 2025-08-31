
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
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

type ExtendedUser = User & {
  level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  verificationStatus?: VerificationStatus;
  fullName?: string;
  nik?: string;
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { photoFile?: File }) => Promise<void>;
  submitForVerification: (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File }) => Promise<void>;
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
          setUser({ 
              ...user, 
              level: userData.level || 'Bronze',
              verificationStatus: userData.verificationStatus || 'unverified',
              fullName: userData.fullName,
              nik: userData.nik,
              // IMPORTANT: Sync `displayName` from Firestore to Auth state, as it's the verified name.
              displayName: userData.fullName || user.displayName
          });
        } else {
          // Fallback if doc doesn't exist for some reason
          setUser({ ...user, level: 'Bronze', verificationStatus: 'unverified' });
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
            name: `Anggota ${String(newUser.phoneNumber).slice(-4)}`, // Placeholder name
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            avatarUrl: newUser.photoURL || `https://picsum.photos/seed/${newUser.uid}/100/100`,
            createdAt: serverTimestamp(),
            level: 'Bronze', // Default level for new users
            verificationStatus: 'unverified'
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

  const updateUserProfile = async (updates: { photoFile?: File }) => {
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
        // displayName is now locked, so we only update the photoURL
        photoURL: photoURL,
    });
    
    // Update user document in Firestore for consistency
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
        avatarUrl: photoURL
    }, { merge: true });

    // Manually update the user state to reflect changes immediately
    setUser(prevUser => prevUser ? { ...prevUser, photoURL } : null);
};

const submitForVerification = async (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");

    const storage = getStorage();
    const ktpRef = ref(storage, `kyc/${auth.currentUser.uid}/ktp.jpg`);
    const selfieRef = ref(storage, `kyc/${auth.currentUser.uid}/selfie.jpg`);

    // Upload files
    await uploadBytes(ktpRef, data.ktpFile);
    const ktpImageUrl = await getDownloadURL(ktpRef);
    
    await uploadBytes(selfieRef, data.selfieFile);
    const selfieImageUrl = await getDownloadURL(selfieRef);

    // Update user document in Firestore
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userDocRef, {
        fullName: data.fullName, // This is the verified name
        name: data.fullName, // Keep 'name' field for backward compatibility or display
        displayName: data.fullName,
        nik: data.nik,
        verificationStatus: 'pending',
        ktpImageUrl,
        selfieImageUrl,
        submittedAt: serverTimestamp()
    });
    
    // Update Firebase Auth profile displayName as well
    await updateProfile(auth.currentUser, { displayName: data.fullName });

    // Update local state
    setUser(prevUser => prevUser ? { ...prevUser, verificationStatus: 'pending', fullName: data.fullName, nik: data.nik, displayName: data.fullName } : null);
  };


  return (
    <AuthContext.Provider value={{ user, loading, signInWithPhone, verifyOtp, signOut, updateUserProfile, submitForVerification }}>
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
    // Redirect unverified users to verification, but allow access to profile
    if (!loading && user && user.verificationStatus === 'unverified' && pathname !== '/profile/verify' && pathname !== '/profile') {
        redirect('/profile');
    }
  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};
