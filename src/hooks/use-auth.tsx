
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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';

type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected';

type ExtendedUser = User & {
  level?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  verificationStatus?: VerificationStatus;
  fullName?: string;
  username?: string;
  nik?: string;
};

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { photoFile?: File }) => Promise<void>;
  submitForVerification: (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File; photoFile?: File }) => Promise<void>;
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
          const extendedUser: ExtendedUser = {
              ...user, 
              level: userData.level || 'Bronze',
              verificationStatus: userData.verificationStatus || 'unverified',
              // Use Firestore data as the source of truth
              displayName: userData.fullName || user.displayName,
              photoURL: userData.avatarUrl || user.photoURL,
              fullName: userData.fullName,
              username: userData.username,
              nik: userData.nik,
          };
          setUser(extendedUser);
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
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUser = userCredential.user;
        const tempName = `Anggota ${String(newUser.phoneNumber).slice(-4)}`;
        const username = await generateUniqueUsername(tempName);

        // Create user document in Firestore
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

    let newPhotoURL = auth.currentUser.photoURL;

    // Handle photo upload
    if (updates.photoFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}`);
        
        await uploadBytes(storageRef, updates.photoFile);
        newPhotoURL = await getDownloadURL(storageRef);
    }
    
    // Update profile in Firebase Auth
    await updateProfile(auth.currentUser, {
        photoURL: newPhotoURL,
    });
    
    // Update user document in Firestore for consistency
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
        avatarUrl: newPhotoURL,
        photoURL: newPhotoURL,
    }, { merge: true });

    // Manually update the user state to reflect changes immediately
    setUser(prevUser => prevUser ? { ...prevUser, photoURL: newPhotoURL } : null);
};

const submitForVerification = async (data: { fullName: string; nik: string; ktpFile: File; selfieFile: File; photoFile?: File; }) => {
    if (!auth.currentUser) throw new Error("Pengguna tidak ditemukan.");

    const { uid } = auth.currentUser;
    const storage = getStorage();
    
    // Define storage refs
    const ktpRef = ref(storage, `kyc/${uid}/ktp.jpg`);
    const selfieRef = ref(storage, `kyc/${uid}/selfie.jpg`);
    const profilePicRef = ref(storage, `profile-pictures/${uid}`);

    // Upload files and get URLs
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
        verificationStatus: 'temporary' as VerificationStatus, // Set status to temporary for immediate access
        ktpImageUrl,
        selfieImageUrl,
        avatarUrl: newPhotoURL,
        photoURL: newPhotoURL,
        submittedAt: serverTimestamp()
    };

    // Update user document in Firestore
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, verificationData, { merge: true });
    
    // Update Firebase Auth profile as well for consistency
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { 
            displayName: data.fullName, 
            photoURL: newPhotoURL 
        });
    }

    // Update local state to reflect all changes immediately
    setUser(prevUser => {
        if (!prevUser) return null;
        // Merge existing user data with new verification data
        return {
            ...prevUser,
            fullName: verificationData.fullName,
            displayName: verificationData.displayName,
            username: verificationData.username,
            nik: verificationData.nik,
            verificationStatus: verificationData.verificationStatus,
            photoURL: verificationData.photoURL,
        };
    });
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
    // Redirect unverified users to verification, but allow access to profile pages
    if (!loading && user && user.verificationStatus === 'unverified' && !pathname.startsWith('/profile') && pathname !== '/register') {
        redirect('/profile');
    }
  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};

    