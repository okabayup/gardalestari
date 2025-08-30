'use server';

import { personalizedBenefitRecommendations, PersonalizedBenefitRecommendationsInput } from '@/ai/flows/personalized-benefit-recommendations';
import { availableBenefits } from '@/lib/placeholder-data';
import * as z from 'zod';

const formSchema = z.object({
  age: z.coerce.number().min(18, 'Umur minimal 18 tahun.').max(35, 'Umur maksimal 35 tahun.'),
  interests: z.string().min(3, 'Sebutkan minimal satu minat.'),
  location: z.string().min(2, 'Silakan masukkan lokasi Anda.'),
});

type FormValues = z.infer<typeof formSchema>;

export async function getRecommendedBenefits(values: FormValues) {
  try {
    const validatedValues = formSchema.parse(values);

    const input: PersonalizedBenefitRecommendationsInput = {
      userProfile: {
        age: validatedValues.age,
        interests: validatedValues.interests.split(',').map(s => s.trim()),
        location: validatedValues.location,
      },
      // Mock usage patterns for demonstration
      usagePatterns: {
        benefitsUsed: ['Buletin Digital "Lestari"'],
        timeSpent: { 'feed': 3600, 'events': 1200 },
      },
      availableBenefits: availableBenefits,
    };
    
    const recommendations = await personalizedBenefitRecommendations(input);
    
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    return recommendations;

  } catch (error) {
    console.error('Error getting recommendations:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Data input tidak valid. Silakan periksa kembali isian Anda.' };
    }
    return { error: 'Gagal mendapatkan rekomendasi dari AI. Silakan coba lagi nanti.' };
  }
}
