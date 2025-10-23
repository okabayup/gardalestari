

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a temporary redirect page.
// The user will be redirected to the accounts page by default.
export default function FinanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/panel/finance/accounts');
  }, [router]);

  return null;
}
