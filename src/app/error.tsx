
'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <AlertTriangle className="h-24 w-24 text-destructive mb-6" />
      <h2 className="text-2xl font-semibold tracking-tight">Terjadi Kesalahan</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Maaf, terjadi kesalahan yang tidak terduga di pihak kami. Anda dapat mencoba lagi atau kembali nanti.
      </p>
      <pre className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded-md max-w-md overflow-x-auto">
        {error.message || 'Error details not available.'}
      </pre>
      <Button onClick={() => reset()} className="mt-8">
        Coba Lagi
      </Button>
    </div>
  );
}
