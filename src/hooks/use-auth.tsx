
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, appVerifierContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Declare recaptchaVerifier in a broader scope
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
    await confirmationResult.confirm(otp);
    // User signed in successfully. `onAuthStateChanged` will handle the user state.
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithPhone, verifyOtp, signOut }}>
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
