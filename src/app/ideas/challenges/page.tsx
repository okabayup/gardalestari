
'use server';

import MainLayout from '@/components/layout/MainLayout';
import { getActiveChallenges } from '@/app/actions/ideas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, Award, Calendar, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default async function ChallengesPage() {
    const challenges = await getActiveChallenges();

    return (
        <MainLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/ideas">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Tantangan Aktif</h1>
                        <p className="text-muted-foreground">Jawab tantangan dari kami dan jadilah bagian dari solusi.</p>
                    </div>
                </div>

                {challenges.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {challenges.map(challenge => (
                            <Card key={challenge.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            <Target className="h-6 w-6" />
                                        </div>
                                        <CardTitle>{challenge.title}</CardTitle>
                                    </div>
                                    <CardDescription className="pt-2">{challenge.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex items-start gap-3 text-sm">
                                        <FileText className="h-4 w-4 mt-1 text-muted-foreground shrink-0"/>
                                        <div>
                                            <h4 className="font-semibold">Kriteria Solusi</h4>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{challenge.criteria}</p>
                                        </div>
                                    </div>
                                     {challenge.reward && (
                                         <div className="flex items-start gap-3 text-sm">
                                            <Award className="h-4 w-4 mt-1 text-muted-foreground shrink-0"/>
                                            <div>
                                                <h4 className="font-semibold">Hadiah/Insentif</h4>
                                                <p className="text-muted-foreground">{challenge.reward}</p>
                                            </div>
                                        </div>
                                     )}
                                </CardContent>
                                <CardFooter className="flex flex-col sm:flex-row justify-between items-center bg-muted/50 p-4">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Batas Waktu: {format(challenge.deadline.toDate(), "dd MMMM yyyy", { locale: id })}</span>
                                    </div>
                                    <Button asChild className="mt-4 sm:mt-0 w-full sm:w-auto">
                                        <Link href={`/ideas/new?challengeId=${challenge.id}&title=${encodeURIComponent(`Solusi untuk: ${challenge.title}`)}`}>
                                            Ajukan Solusi <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Target className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">Tidak Ada Tantangan Aktif</h3>
                        <p>Saat ini belum ada tantangan baru. Kembali lagi nanti!</p>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
