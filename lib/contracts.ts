import { z } from "zod";

const TaskTitleSchema = z.string().trim().min(1, "Task title cannot be empty");

// PlanStatus enum matching Prisma schema
export const PlanStatusSchema = z.enum(["TODO", "DOING", "DONE"]);

// PlanItem schema matching Prisma model
export const PlanItemSchema = z.object({
  id: z.string().cuid().optional(), // Optional for create operations
  text: z.string().min(1, "Item text cannot be empty"),
  status: PlanStatusSchema.default("TODO"),
  dueTime: z.string().datetime().optional().nullable(), // ISO datetime string, optional
  tags: z.array(z.string()).default([]),
  order: z.number().int().min(0),
});

// Plan schema matching Prisma model (full model with all fields)
export const PlanSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  title: z.string().min(1, "Plan title cannot be empty"),
  items: z.array(PlanItemSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// UpsertPlan schema for create/update operations (without id, userId, timestamps)
export const UpsertPlanSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  title: z.string().min(1, "Plan title cannot be empty"),
  items: z.array(
    PlanItemSchema.omit({ id: true }).extend({
      id: z.string().cuid().optional(), // Allow id for updates
    })
  ),
});

// Type exports for TypeScript
export type PlanStatus = z.infer<typeof PlanStatusSchema>;
export type PlanItem = z.infer<typeof PlanItemSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type UpsertPlan = z.infer<typeof UpsertPlanSchema>;

export default TaskTitleSchema;
