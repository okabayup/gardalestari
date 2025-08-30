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
    age: z.number().describe('The age of the user.'),
    interests: z.array(z.string()).describe('The interests of the user.'),
    location: z.string().describe('The location of the user.'),
  }).describe('The profile information of the user.'),
  usagePatterns: z.object({
    benefitsUsed: z.array(z.string()).describe('The benefits the user has used in the past.'),
    timeSpent: z.record(z.number()).describe('A map of the time spent on each part of the application'),
  }).describe('The usage patterns of the user.'),
  availableBenefits: z.array(z.object({
    name: z.string().describe('The name of the benefit.'),
    description: z.string().describe('A detailed description of the benefit.'),
    category: z.string().describe('The category of the benefit.'),
    eligibilityCriteria: z.string().describe('The criteria that a user must meet to be eligible for the benefit.'),
  })).describe('A list of all available benefits.'),
});

export type PersonalizedBenefitRecommendationsInput = z.infer<typeof PersonalizedBenefitRecommendationsInputSchema>;

// Output schema for the personalized benefit recommendations flow
const PersonalizedBenefitRecommendationsOutputSchema = z.object({
  recommendedBenefits: z.array(z.object({
    name: z.string().describe('The name of the recommended benefit.'),
    description: z.string().describe('A detailed description of the recommended benefit.'),
    reason: z.string().describe('The reason why this benefit is recommended for the user.'),
  })).describe('A list of benefits recommended for the user, along with a reason for each recommendation.'),
});

export type PersonalizedBenefitRecommendationsOutput = z.infer<typeof PersonalizedBenefitRecommendationsOutputSchema>;

// Tool to filter benefits based on user preferences
const filterBenefitsTool = ai.defineTool({
  name: 'filterBenefits',
  description: 'Filters a list of benefits based on user preferences and eligibility criteria.',
  inputSchema: z.object({
    benefits: z.array(z.object({
      name: z.string().describe('The name of the benefit.'),
      description: z.string().describe('A detailed description of the benefit.'),
      category: z.string().describe('The category of the benefit.'),
      eligibilityCriteria: z.string().describe('The criteria that a user must meet to be eligible for the benefit.'),
    })).describe('A list of benefits to filter.'),
    userProfile: z.object({
      age: z.number().describe('The age of the user.'),
      interests: z.array(z.string()).describe('The interests of the user.'),
      location: z.string().describe('The location of the user.'),
    }).describe('The profile information of the user.'),
    usagePatterns: z.object({
      benefitsUsed: z.array(z.string()).describe('The benefits the user has used in the past.'),
      timeSpent: z.record(z.number()).describe('A map of the time spent on each part of the application'),
    }).describe('The usage patterns of the user.'),
  }),
  outputSchema: z.array(z.string()).describe('A list of benefit names that are relevant to the user.'),
}, async (input) => {
  // Implement the benefit filtering logic here based on user profile, usage patterns, and eligibility criteria.
  // This is a placeholder implementation.
  const relevantBenefits = input.benefits.filter(benefit => {
    // Example criteria: Benefit category matches user interests.
    return input.userProfile.interests.includes(benefit.category);
  }).map(benefit => benefit.name);

  return relevantBenefits;
});

// Prompt to generate personalized benefit recommendations
const personalizedBenefitRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedBenefitRecommendationsPrompt',
  input: {schema: PersonalizedBenefitRecommendationsInputSchema},
  output: {schema: PersonalizedBenefitRecommendationsOutputSchema},
  tools: [filterBenefitsTool],
  prompt: `You are a personalized benefit recommendation expert.
Given the following user profile, usage patterns, and available benefits, recommend the most relevant benefits to the user.

User Profile:
Age: {{{userProfile.age}}}
Interests: {{#each userProfile.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Location: {{{userProfile.location}}}

Usage Patterns:
Benefits Used: {{#each usagePatterns.benefitsUsed}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Time Spent: {{#each usagePatterns.timeSpent}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Available Benefits:
{{#each availableBenefits}}
- Name: {{{name}}}
  Description: {{{description}}}
  Category: {{{category}}}
  Eligibility Criteria: {{{eligibilityCriteria}}}
{{/each}}

First, use the 'filterBenefits' tool to filter the available benefits based on the user's profile and usage patterns.
Then, for each filtered benefit, provide a reason why it is recommended for the user.

Format your output as a JSON object with a 'recommendedBenefits' field. Each recommended benefit should include the 'name', 'description', and 'reason'.`,
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
