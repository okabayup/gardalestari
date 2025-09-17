
'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProgramCard from '@/components/programs/ProgramCard';
import { getPrograms, getProgramTags, Program } from '@/app/actions/programs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ProgramsPage() {
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedPrograms, fetchedTags] = await Promise.all([
          getPrograms(),
          getProgramTags(),
        ]);
        setAllPrograms(fetchedPrograms);
        setTags(['Semua', ...fetchedTags.map(t => t.name)]);
      } catch (error) {
        console.error("Failed to fetch programs or tags", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPrograms = useMemo(() => {
    if (!selectedTag || selectedTag === 'Semua') {
      return allPrograms;
    }
    return allPrograms.filter(p => p.tags.includes(selectedTag));
  }, [allPrograms, selectedTag]);

  const { ongoingPrograms, pastPrograms } = useMemo(() => {
    const now = new Date();
    const ongoing = filteredPrograms.filter(p => !p.endDate || new Date(p.endDate) >= now);
    const past = filteredPrograms.filter(p => p.endDate && new Date(p.endDate) < now);
    return { ongoingPrograms: ongoing, pastPrograms: past };
  }, [filteredPrograms]);


  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-center sm:text-left">
            <h1 className="font-headline text-3xl font-bold">Program Kami</h1>
            <p className="text-muted-foreground">Inisiatif untuk masa depan yang berkelanjutan.</p>
          </div>
           <Button onClick={() => router.push('/panel/programs/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Program
          </Button>
        </div>

        <div className="sticky top-14 z-10 bg-background/95 py-2 backdrop-blur-sm -mx-6 px-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={(selectedTag === tag || (!selectedTag && tag === 'Semua')) ? 'default' : 'outline'}
                  onClick={() => setSelectedTag(tag)}
                  className="shrink-0"
                >
                  {tag}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {ongoingPrograms.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Sedang Berlangsung</h2>
                <div className="grid gap-6">
                  {ongoingPrograms.map((program) => (
                    <ProgramCard key={program.id} {...program} />
                  ))}
                </div>
              </div>
            )}

            {pastPrograms.length > 0 && (
               <>
                <Separator className="my-8" />
                <div className="space-y-4">
                    <h2 className="font-headline text-2xl font-semibold">Telah Berakhir</h2>
                    <div className="grid gap-6">
                        {pastPrograms.map((program) => (
                           <ProgramCard key={program.id} {...program} isPast />
                        ))}
                    </div>
                </div>
               </>
            )}

            {filteredPrograms.length === 0 && (
              <p className="text-center text-muted-foreground py-10">
                Tidak ada program untuk kategori "{selectedTag}".
              </p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

    
