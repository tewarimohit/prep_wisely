import { z } from "zod";

/**
 * WeakAreaItem - single weak area snapshot
 */
export const WeakAreaItemSchema = z.object({
  topicId: z.string().cuid(),
  topicName: z.string().min(1, "Topic name cannot be empty"),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  attempts: z.number().int().min(0, "Attempts must be non-negative"),
  lastSeenAt: z.string().datetime(),
});

/**
 * WeakAreaReadResponse - response from GET /api/weak-areas
 */
export const WeakAreaReadSchema = z.object({
  weakAreas: z.array(WeakAreaItemSchema),
});

// Type exports for TypeScript
export type WeakAreaItem = z.infer<typeof WeakAreaItemSchema>;
export type WeakAreaReadResponse = z.infer<typeof WeakAreaReadSchema>;
