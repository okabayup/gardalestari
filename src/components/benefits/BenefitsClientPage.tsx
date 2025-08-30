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
  age: z.coerce.number().min(13, 'You must be at least 13 years old.'),
  interests: z.string().min(3, 'Please list at least one interest.'),
  location: z.string().min(2, 'Please enter a location.'),
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
      age: 30,
      interests: 'Nature, Hiking, Community',
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
        <h1 className="font-headline text-3xl font-bold">Personalized Benefits</h1>
        <p className="text-muted-foreground">Let our AI find the best benefits for you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get personalized recommendations.
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
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 28" {...field} />
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
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hiking, Conservation, Photography" {...field} />
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jakarta" {...field} />
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
                Get Recommendations
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Our AI is thinking...</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {recommendations && (
        <div className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold text-center">Your Recommended Benefits</h2>
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
                            <span className="font-semibold">Reason:</span> {rec.reason}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

    </div>
  );
}
