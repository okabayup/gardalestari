
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // This is where you would call a server action to search across multiple collections
      // For now, it's just a placeholder.
      toast({ title: "Fitur Pencarian", description: "Fitur pencarian global sedang dalam pengembangan." });
      setResults([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mencari', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <Search className="h-5 w-5" />
        <span className="sr-only">Cari</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Pencarian Global</DialogTitle>
            <DialogDescription>
              Cari anggota, postingan, program, acara, dan lainnya di seluruh aplikasi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ketik untuk mencari..."
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-4 min-h-[200px]">
            {/* Results will be displayed here */}
            {results.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground pt-8">
                Hasil pencarian akan muncul di sini.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
