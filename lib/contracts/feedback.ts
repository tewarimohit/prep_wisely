import { z } from "zod";

/**
 * Mood options for feedback
 */
export const MoodSchema = z.enum([
  "great",
  "good",
  "okay",
  "tough",
  "struggling",
]);

/**
 * Feedback submission payload
 */
export const FeedbackSubmitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  mood: MoodSchema,
  blockers: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

/**
 * Feedback read response
 */
export const FeedbackReadSchema = z.object({
  id: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: MoodSchema,
  blockers: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional(),
}).nullable();

// Type exports for TypeScript
export type Mood = z.infer<typeof MoodSchema>;
export type FeedbackSubmit = z.infer<typeof FeedbackSubmitSchema>;
export type FeedbackRead = z.infer<typeof FeedbackReadSchema>;
