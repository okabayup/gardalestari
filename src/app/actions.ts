'use server';

import { personalizedBenefitRecommendations, PersonalizedBenefitRecommendationsInput } from '@/ai/flows/personalized-benefit-recommendations';
import { availableBenefits } from '@/lib/placeholder-data';
import * as z from 'zod';

const formSchema = z.object({
  age: z.number(),
  interests: z.string(),
  location: z.string(),
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
        benefitsUsed: ['Free Digital Magazine Subscription'],
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
      return { error: 'Invalid input data. Please check your entries.' };
    }
    return { error: 'Failed to get recommendations from AI. Please try again later.' };
  }
}
