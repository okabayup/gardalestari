
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a temporary redirect page.
// The user will be redirected to the accounts page to select a ledger.
export default function LedgerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/panel/finance/accounts');
  }, [router]);

  return null;
}

    