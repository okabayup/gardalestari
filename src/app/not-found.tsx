
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <FileQuestion className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold font-headline text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">Halaman Tidak Ditemukan</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Kembali ke Halaman Utama</Link>
      </Button>
    </div>
  );
}
