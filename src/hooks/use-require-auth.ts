
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
    
  }, [user, loading, redirectTo, pathname]);

  return { user, loading };
};
