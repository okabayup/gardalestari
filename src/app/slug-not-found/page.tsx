
'use client';

import { Button } from '@/components/ui/button';
import { Link2Off } from 'lucide-react';
import Link from 'next/link';

export default function SlugNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <Link2Off className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold font-headline text-destructive">Tautan Tidak Ditemukan</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Maaf, tautan pendek yang Anda tuju tidak ada atau mungkin telah dihapus. Mohon periksa kembali URL Anda.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Kembali ke Halaman Utama</Link>
      </Button>
    </div>
  );
}
