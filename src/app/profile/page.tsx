
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now only serves to redirect to the user's "me" page.
// The actual profile content is in /profile/me/page.tsx
export default function ProfileRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/profile/me');
    }, [router]);

    return null; // Return null or a loader while redirecting
}
