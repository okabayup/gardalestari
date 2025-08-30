'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing personalized benefit recommendations to users.
 *
 * The flow takes user profile information and usage patterns as input, and recommends benefits that align with their interests and needs.
 * It includes a tool for reasoning and filtering benefits based on user preferences.
 *
 * @exports {
 *   personalizedBenefitRecommendations,
 *   PersonalizedBenefitRecommendationsInput,
 *   PersonalizedBenefitRecommendationsOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the personalized benefit recommendations flow
const PersonalizedBenefitRecommendationsInputSchema = z.object({
  userProfile: z.object({
    age: z.number().describe('Usia pengguna.'),
    interests: z.array(z.string()).describe('Minat pengguna.'),
    location: z.string().describe('Lokasi pengguna.'),
  }).describe('Informasi profil pengguna.'),
  usagePatterns: z.object({
    benefitsUsed: z.array(z.string()).describe('Benefit yang pernah digunakan pengguna.'),
    timeSpent: z.record(z.number()).describe('Peta waktu yang dihabiskan pada setiap bagian aplikasi'),
  }).describe('Pola penggunaan pengguna.'),
  availableBenefits: z.array(z.object({
    name: z.string().describe('Nama benefit.'),
    description: z.string().describe('Deskripsi rinci dari benefit.'),
    category: z.string().describe('Kategori benefit.'),
    eligibilityCriteria: z.string().describe('Kriteria yang harus dipenuhi pengguna untuk memenuhi syarat mendapatkan benefit.'),
  })).describe('Daftar semua benefit yang tersedia.'),
});

export type PersonalizedBenefitRecommendationsInput = z.infer<typeof PersonalizedBenefitRecommendationsInputSchema>;

// Output schema for the personalized benefit recommendations flow
const PersonalizedBenefitRecommendationsOutputSchema = z.object({
  recommendedBenefits: z.array(z.object({
    name: z.string().describe('Nama benefit yang direkomendasikan.'),
    description: z.string().describe('Deskripsi rinci dari benefit yang direkomendasikan.'),
    reason: z.string().describe('Alasan mengapa benefit ini direkomendasikan untuk pengguna.'),
  })).describe('Daftar benefit yang direkomendasikan untuk pengguna, beserta alasan untuk setiap rekomendasi.'),
});

export type PersonalizedBenefitRecommendationsOutput = z.infer<typeof PersonalizedBenefitRecommendationsOutputSchema>;

// Tool to filter benefits based on user preferences
const filterBenefitsTool = ai.defineTool({
  name: 'filterBenefits',
  description: 'Saring daftar benefit berdasarkan preferensi pengguna dan kriteria kelayakan.',
  inputSchema: z.object({
    benefits: z.array(z.object({
      name: z.string().describe('Nama benefit.'),
      description: z.string().describe('Deskripsi rinci dari benefit.'),
      category: z.string().describe('Kategori benefit.'),
      eligibilityCriteria: z.string().describe('Kriteria yang harus dipenuhi pengguna untuk memenuhi syarat mendapatkan benefit.'),
    })).describe('Daftar benefit untuk disaring.'),
    userProfile: z.object({
      age: z.number().describe('Usia pengguna.'),
      interests: z.array(z.string()).describe('Minat pengguna.'),
      location: z.string().describe('Lokasi pengguna.'),
    }).describe('Informasi profil pengguna.'),
    usagePatterns: z.object({
      benefitsUsed: z.array(z.string()).describe('Benefit yang pernah digunakan pengguna.'),
      timeSpent: z.record(z.number()).describe('Peta waktu yang dihabiskan pada setiap bagian aplikasi'),
    }).describe('Pola penggunaan pengguna.'),
  }),
  outputSchema: z.array(z.string()).describe('Daftar nama benefit yang relevan bagi pengguna.'),
}, async (input) => {
  // Implement benefit filtering logic here based on user profile, usage patterns, and eligibility criteria.
  // This is a placeholder implementation.
  const relevantBenefits = input.benefits.filter(benefit => {
    // Example criteria: Benefit category matches user interests.
    const interestMatch = input.userProfile.interests.some(interest => 
      benefit.category.toLowerCase().includes(interest.toLowerCase()) || 
      interest.toLowerCase().includes(benefit.category.toLowerCase())
    );
    // You can add more complex logic here, e.g., checking age for eligibility
    return interestMatch;
  }).map(benefit => benefit.name);

  return relevantBenefits;
});

// Prompt to generate personalized benefit recommendations
const personalizedBenefitRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedBenefitRecommendationsPrompt',
  input: {schema: PersonalizedBenefitRecommendationsInputSchema},
  output: {schema: PersonalizedBenefitRecommendationsOutputSchema},
  tools: [filterBenefitsTool],
  prompt: `Anda adalah seorang ahli pemberi rekomendasi benefit yang dipersonalisasi untuk anggota organisasi pemberdayaan pemuda.
Berdasarkan profil pengguna, pola penggunaan, dan benefit yang tersedia, rekomendasikan benefit yang paling relevan bagi pengguna.

Profil Pengguna:
Usia: {{{userProfile.age}}}
Minat: {{#each userProfile.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Lokasi: {{{userProfile.location}}}

Pola Penggunaan:
Benefit yang Telah Digunakan: {{#each usagePatterns.benefitsUsed}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Waktu yang Dihabiskan: {{#each usagePatterns.timeSpent}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Benefit Tersedia:
{{#each availableBenefits}}
- Nama: {{{name}}}
  Deskripsi: {{{description}}}
  Kategori: {{{category}}}
  Kriteria Kelayakan: {{{eligibilityCriteria}}}
{{/each}}

Langkah-langkah:
1. Gunakan tool 'filterBenefits' untuk menyaring benefit yang tersedia berdasarkan profil dan pola penggunaan pengguna.
2. Dari hasil yang telah disaring, pilih 3 benefit teratas yang paling sesuai.
3. Untuk setiap benefit yang direkomendasikan, berikan alasan yang kuat dan dipersonalisasi mengapa benefit tersebut cocok untuk pengguna, hubungkan dengan minat dan profil mereka.

Format output Anda sebagai objek JSON dengan field 'recommendedBenefits'. Setiap benefit yang direkomendasikan harus mencakup 'name', 'description', dan 'reason'.`,
});

// Genkit flow for personalized benefit recommendations
const personalizedBenefitRecommendationsFlow = ai.defineFlow({
  name: 'personalizedBenefitRecommendationsFlow',
  inputSchema: PersonalizedBenefitRecommendationsInputSchema,
  outputSchema: PersonalizedBenefitRecommendationsOutputSchema,
}, async (input) => {
  const {output} = await personalizedBenefitRecommendationsPrompt(input);
  return output!;
});

/**
 * Provides personalized benefit recommendations based on user profile and usage patterns.
 * @param input - The input containing user profile, usage patterns, and available benefits.
 * @returns A promise that resolves to the personalized benefit recommendations.
 */
export async function personalizedBenefitRecommendations(input: PersonalizedBenefitRecommendationsInput): Promise<PersonalizedBenefitRecommendationsOutput> {
  return personalizedBenefitRecommendationsFlow(input);
}
