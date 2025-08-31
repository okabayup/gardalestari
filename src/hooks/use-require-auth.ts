
'use client';

import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { redirect, usePathname } from 'next/navigation';

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
    
    // Redirect unverified users away from the main app, but allow access to profile and verification flow
    if (user.verificationStatus === 'unverified' && !pathname.startsWith('/profile') && pathname !== '/register') {
      return redirect('/profile');
    }

  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};

    