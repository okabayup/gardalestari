'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { PersonalizedBenefitRecommendationsOutput } from '@/ai/flows/personalized-benefit-recommendations';

const formSchema = z.object({
  age: z.coerce.number().min(18, 'Umur minimal 18 tahun.').max(35, 'Umur maksimal 35 tahun.'),
  interests: z.string().min(3, 'Sebutkan minimal satu minat.'),
  location: z.string().min(2, 'Silakan masukkan lokasi Anda.'),
});

type BenefitsFormValues = z.infer<typeof formSchema>;

interface BenefitsClientPageProps {
  getRecommendedBenefits: (values: BenefitsFormValues) => Promise<PersonalizedBenefitRecommendationsOutput | { error: string }>;
}

export default function BenefitsClientPage({ getRecommendedBenefits }: BenefitsClientPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedBenefitRecommendationsOutput['recommendedBenefits'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BenefitsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 25,
      interests: 'Pertanian, Konservasi, Komunitas',
      location: 'Jakarta',
    },
  });

  async function onSubmit(values: BenefitsFormValues) {
    setLoading(true);
    setError(null);
    setRecommendations(null);

    const result = await getRecommendedBenefits(values);
    
    if ('error' in result) {
      setError(result.error);
    } else {
      setRecommendations(result.recommendedBenefits);
    }

    setLoading(false);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold">Benefit Terpersonalisasi</h1>
        <p className="text-muted-foreground">Biarkan AI kami menemukan benefit terbaik untuk Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Anda</CardTitle>
          <CardDescription>
            Ceritakan sedikit tentang diri Anda untuk mendapatkan rekomendasi. Sesuai syarat, usia pendaftar adalah 18-35 tahun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usia</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Contoh: 28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minat (pisahkan dengan koma)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Pertanian, Konservasi, Fotografi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Jakarta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Dapatkan Rekomendasi
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">AI kami sedang berpikir...</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Terjadi Kesalahan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {recommendations && (
        <div className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold text-center">Rekomendasi Benefit Untuk Anda</h2>
            {recommendations.map((rec) => (
                <Card key={rec.name} className="bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                           <Sparkles className="h-5 w-5 text-primary" />
                           <CardTitle>{rec.name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <p className="text-sm text-foreground border-l-2 border-primary pl-3">
                            <span className="font-semibold">Alasan:</span> {rec.reason}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

    </div>
  );
}
