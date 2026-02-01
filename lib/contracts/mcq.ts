import { z } from "zod";

/**
 * MCQ (read-only) - represents a question fetched from the database
 * Full schema including answerIndex (for internal use)
 */
export const MCQSchema = z.object({
  id: z.string().cuid(),
  stem: z.string().min(1, "Question stem cannot be empty"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .length(4, "Must have exactly 4 options"),
  answerIndex: z.number().int().min(0).max(3, "Answer index must be 0-3"),
  explanation: z.string().optional().nullable(),
  createdAt: z.date().optional(),
});

/**
 * MCQ (safe) - question without answerIndex for client consumption
 */
export const MCQSafeSchema = z.object({
  id: z.string().cuid(),
  stem: z.string().min(1, "Question stem cannot be empty"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .length(4, "Must have exactly 4 options"),
  // answerIndex is intentionally excluded
});

/**
 * MCQResponse (submit answer) - payload for submitting a response
 */
export const MCQResponseSubmitSchema = z.object({
  sessionId: z.string().cuid(),
  mcqId: z.string().cuid(),
  choice: z.number().int().min(0).max(3, "Choice must be 0-3"),
  timeMs: z.number().int().min(0, "Time must be non-negative"),
});

/**
 * MCQResult (correct + explanation) - result after evaluation
 */
export const MCQResultSchema = z.object({
  correct: z.boolean(),
  explanation: z.string().optional().nullable(),
  correctAnswerIndex: z.number().int().min(0).max(3),
});

/**
 * MCQPlayRequest - request to start/fetch MCQs for a session
 */
export const MCQPlayRequestSchema = z.object({
  userId: z.string().cuid(),
  mode: z.string().min(1, "Mode cannot be empty").default("practice"),
  topicIds: z.array(z.string().cuid()).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// Type exports for TypeScript
export type MCQ = z.infer<typeof MCQSchema>;
export type MCQSafe = z.infer<typeof MCQSafeSchema>;
export type MCQResponseSubmit = z.infer<typeof MCQResponseSubmitSchema>;
export type MCQResult = z.infer<typeof MCQResultSchema>;
export type MCQPlayRequest = z.infer<typeof MCQPlayRequestSchema>;
