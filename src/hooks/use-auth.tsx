
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { redirect, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  processVerificationSubmission,
  generateUniqueUsername,
  updateUserProfile as updateUserProfileServer,
} from '@/app/actions/user';
import type { PermissionId, MemberType, VerificationStatus } from '@/lib/definitions';
import { ALL_PERMISSIONS } from '@/lib/definitions';
import { logAnalyticsEvent } from '@/lib/analytics';
import { getOne, getFirst, create, update, now } from '@/lib/db';

const COL_USERS = 'users';
const COL_POSITIONS = 'positions';
const COL_POINT_LOGS = 'pointLogs'; // was subcollection users/{id}/pointLogs

const ADMIN_PHONE_NUMBER = '+6285176752610';
const OFFICIAL_ACCOUNT_PHONE = '+6285144904161';

export type ExtendedUser = {
  id: string;
  uid: string; // alias for id — backward compat
  phoneNumber: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string, referrerUsername?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: {
    photoFile?: File;
    username?: string;
    instagram?: string;
    linkedin?: string;
    skills?: string[];
    interests?: string[];
  }) => Promise<void>;
  submitForVerification: (data: {
    fullName: string;
    nik: string;
    ktpDataUrl: string;
    photoDataUrl?: string;
    waNumber: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingPhoneRef = useRef<string | null>(null);
  const { toast } = useToast();

  const fetchUserDetails = useCallback(async (supabaseUser: SupabaseUser) => {
    const uid = supabaseUser.id;
    const phone = supabaseUser.phone || null;

    const userData = await getOne<any>(COL_USERS, uid);

    let permissions: PermissionId[] = [];
    let positionName = 'Anggota';
    let userType = userData?.type;

    if (userData?.positionId) {
      const positionData = await getOne<any>(COL_POSITIONS, userData.positionId);
      if (positionData) {
        permissions = positionData.permissions || [];
        positionName = positionData.name;
      }
    }

    if (phone === ADMIN_PHONE_NUMBER) {
      permissions = ALL_PERMISSIONS.map((p: any) => p.id);
    }

    if (phone === OFFICIAL_ACCOUNT_PHONE) {
      userType = 'official';
      positionName = 'Akun Resmi';
    }

    if (userData) {
      setUser({
        id: uid,
        uid,
        phoneNumber: phone,
        email: supabaseUser.email || null,
        displayName: userData.fullName || supabaseUser.user_metadata?.displayName || null,
        photoURL: userData.avatarUrl || supabaseUser.user_metadata?.photoURL || null,
        referralCount: userData.referralCount || 0,
        referralCode: userData.referralCode,
        greenPoints: userData.greenPoints || 0,
        verificationStatus: userData.verificationStatus,
        fullName: userData.fullName,
        username: userData.username,
        nik: userData.nik,
        positionId: userData.positionId,
        position: positionName,
        permissions,
        waNumber: userData.waNumber,
        waVerified: userData.waVerified,
        type: userType,
        instagram: userData.instagram,
        linkedin: userData.linkedin,
        skills: userData.skills || [],
        interests: userData.interests || [],
        assignedBadges: userData.assignedBadges || [],
      });
    } else {
      setUser({
        id: uid,
        uid,
        phoneNumber: phone,
        email: supabaseUser.email || null,
        displayName: null,
        photoURL: null,
        referralCount: 0,
        greenPoints: 0,
        verificationStatus: 'unverified',
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      await fetchUserDetails(supabaseUser);
    }
  }, [fetchUserDetails]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserDetails(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserDetails(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserDetails]);

  const hasPermission = (permission: PermissionId): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const signInWithPhone = async (phoneNumber: string) => {
    pendingPhoneRef.current = phoneNumber;
    const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
    if (error) throw error;
  };

  const verifyOtp = async (otp: string, referrerUsername?: string) => {
    const phone = pendingPhoneRef.current;
    if (!phone) throw new Error('No pending phone number. Please request an OTP first.');

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      throw new Error('Kode OTP yang Anda masukkan tidak valid atau telah kedaluwarsa. Silakan coba lagi.');
    }

    const supabaseUser = data.user;
    if (!supabaseUser) throw new Error('Gagal mendapatkan data pengguna.');

    // Check if this is a new user
    const existingUser = await getOne<any>(COL_USERS, supabaseUser.id);

    if (!existingUser) {
      const tempName = `Anggota ${phone.slice(-4)}`;
      const username = await generateUniqueUsername(tempName);
      const ownReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      let referredBy: string | undefined;
      let upline: string[] = [];

      if (referrerUsername) {
        const referrerData = await getFirst<any>(COL_USERS, {
          where: { field: 'username', op: '==', value: referrerUsername },
        });
        if (referrerData) {
          referredBy = referrerData.id;
          upline = [referredBy!, ...(referrerData.upline || [])];
        }
      }

      const welcomePoints = 5;
      const userData: Record<string, any> = {
        uid: supabaseUser.id,
        displayName: tempName,
        fullName: tempName,
        username,
        email: supabaseUser.email || null,
        phoneNumber: phone,
        photoURL: `https://picsum.photos/seed/${supabaseUser.id}/100/100`,
        avatarUrl: `https://picsum.photos/seed/${supabaseUser.id}/100/100`,
        createdAt: now(),
        referralCode: ownReferralCode,
        referralCount: 0,
        greenPoints: welcomePoints,
        upline: upline.slice(0, 10),
        verificationStatus: 'unverified',
      };
      if (referredBy) userData.referredBy = referredBy;

      // Sequential creates (replaces Firebase runTransaction)
      await create(COL_USERS, userData, supabaseUser.id);
      await create(COL_POINT_LOGS, {
        userId: supabaseUser.id,
        points: welcomePoints,
        description: 'Poin selamat datang!',
        createdAt: now(),
      });

      if (referredBy) {
        const referrerRecord = await getOne<any>(COL_USERS, referredBy);
        if (referrerRecord) {
          await update(COL_USERS, referredBy, {
            referralCount: (referrerRecord.referralCount || 0) + 1,
          });
        }
      }

      logAnalyticsEvent('sign_up', { method: 'phone', referral: !!referredBy });
    } else {
      logAnalyticsEvent('login', { method: 'phone' });
    }

    pendingPhoneRef.current = null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUserProfile = async (updates: {
    photoFile?: File;
    username?: string;
    instagram?: string;
    linkedin?: string;
    skills?: string[];
    interests?: string[];
  }) => {
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    await updateUserProfileServer(user.uid, updates);
    await refreshUser();
  };

  const submitForVerification = async (data: {
    fullName: string;
    nik: string;
    ktpDataUrl: string;
    photoDataUrl?: string;
    waNumber: string;
  }) => {
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    logAnalyticsEvent('begin_verification');
    await processVerificationSubmission(user.uid, data);
    logAnalyticsEvent('submit_verification', { status: 'success' });
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasPermission,
        signInWithPhone,
        verifyOtp,
        signOut,
        updateUserProfile,
        submitForVerification,
        refreshUser,
      }}
    >
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
    if (loading) return;
    if (!user) redirect(redirectTo);
  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};
