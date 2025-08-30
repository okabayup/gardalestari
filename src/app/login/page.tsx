'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.373-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.57,36.636,48,30.836,48,24C48,22.659,47.862,21.34,47.611,20.083z"/>
    </svg>
);


export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 font-bold">
                <Logo className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl">Garda Lestari</span>
            </Link>
        </div>
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Log in to continue to your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={signInWithGoogle}>
                    <GoogleIcon className="mr-2" />
                    Sign in with Google
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Register
                    </Link>
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
