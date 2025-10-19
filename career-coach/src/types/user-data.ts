import { z } from 'zod';

// Placeholder for user data TypeScript interfaces
// Updated schema: workExperience replaces experienceSummary (array of objects)
export const UserCVParsedSchema = z.object({
  skills: z.array(z.string()),
  workExperience: z.array(
    z.object({
      companyName: z.string().min(1).max(120),
      startDate: z.string().min(4).max(10), // YYYY or YYYY-MM
      endDate: z.string().min(4).max(10).nullable().optional(), // null if current
      summary: z.string()
    })
  ).max(60),
  education: z.array(z.string()), // each item one degree/institution summary
});

export type UserCVParsed = z.infer<typeof UserCVParsedSchema>;


export type PreferenceProfile = {
  workArrangements: string[];
  locations: string[];
  companyStages: string[];
  interests: string
  valid: boolean;
}
