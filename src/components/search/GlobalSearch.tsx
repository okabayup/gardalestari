
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, User, Sprout, Lightbulb, Calendar, BookOpen, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { globalSearch, GlobalSearchResults } from '@/app/actions/search';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Separator } from '../ui/separator';

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

const ResultSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const ResultItem = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} className="block p-2 rounded-md hover:bg-accent -mx-2">
        {children}
    </Link>
);


export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      handleSearch();
    } else {
      setResults(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleSearch = async () => {
    if (!debouncedQuery.trim()) return;
    setLoading(true);
    try {
      const searchResults = await globalSearch(debouncedQuery);
      setResults(searchResults);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal mencari', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results && (
    results.members.length > 0 ||
    results.programs.length > 0 ||
    results.ideas.length > 0 ||
    results.events.length > 0 ||
    results.dataBank.length > 0
  );

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <Search className="h-5 w-5" />
        <span className="sr-only">Cari</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pencarian Global</DialogTitle>
            <DialogDescription>
              Cari anggota, program, ide, dan lainnya di seluruh aplikasi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik untuk mencari..."
            />
          </div>
          <ScrollArea className="mt-4 flex-1">
            {loading && (
                 <div className="flex items-center justify-center pt-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                 </div>
            )}
            {!loading && results && !hasResults && (
                 <p className="text-center text-sm text-muted-foreground pt-8">
                    Tidak ada hasil yang ditemukan untuk "{debouncedQuery}".
                </p>
            )}
            {!loading && hasResults && (
                <div className="space-y-4">
                    {results.members.length > 0 && (
                        <ResultSection title="Anggota" icon={User}>
                            {results.members.map(member => (
                                <ResultItem key={member.id} href={`/profile/${member.username}`}>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback>{getInitials(member.fullName || '')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{member.fullName}</p>
                                            <p className="text-xs text-muted-foreground">@{member.username}</p>
                                        </div>
                                    </div>
                                </ResultItem>
                            ))}
                        </ResultSection>
                    )}
                     {results.programs.length > 0 && <Separator />}
                     {results.programs.length > 0 && (
                        <ResultSection title="Program" icon={Sprout}>
                            {results.programs.map(item => (
                                <ResultItem key={item.id} href={`/programs/${item.id}`}>
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </ResultItem>
                            ))}
                        </ResultSection>
                    )}
                    {results.ideas.length > 0 && <Separator />}
                    {results.ideas.length > 0 && (
                        <ResultSection title="Bank Ide" icon={Lightbulb}>
                            {results.ideas.map(item => (
                                <ResultItem key={item.id} href={`/ideas/${item.id}`}>
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </ResultItem>
                            ))}
                        </ResultSection>
                    )}
                     {results.events.length > 0 && <Separator />}
                    {results.events.length > 0 && (
                        <ResultSection title="Acara" icon={Calendar}>
                             {results.events.map(item => (
                                <ResultItem key={item.id} href={`/events/${item.id}`}>
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </ResultItem>
                            ))}
                        </ResultSection>
                    )}
                     {results.dataBank.length > 0 && <Separator />}
                     {results.dataBank.length > 0 && (
                        <ResultSection title="Bank Data" icon={BookOpen}>
                           {results.dataBank.map(item => (
                                <ResultItem key={item.id} href={`/panel/data-bank`}>
                                     <p className="font-semibold text-sm flex items-center">{item.title} <ExternalLink className="h-3 w-3 ml-2 text-muted-foreground"/></p>
                                </ResultItem>
                            ))}
                        </ResultSection>
                    )}
                </div>
            )}

            {!loading && !results && (
                 <p className="text-center text-sm text-muted-foreground pt-8">
                    Hasil pencarian akan muncul di sini.
                </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
