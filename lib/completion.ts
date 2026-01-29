/**
 * Client-side completion status computation
 * Can be used as a fallback or for client-side calculations
 */

export type CompletionStatus = "completed" | "in_progress" | "pending";

export interface PlanItem {
  status: string;
}

/**
 * Compute completion status based on plan items
 * Rules:
 * - 100% done → "completed"
 * - 1-99% done → "in_progress"
 * - 0% done → "pending"
 */
export function computeCompletionStatus(
  items: PlanItem[]
): CompletionStatus {
  if (!items || items.length === 0) {
    return "pending";
  }

  const completedCount = items.filter((item) => item.status === "DONE").length;
  const completionPercentage = (completedCount / items.length) * 100;

  if (completionPercentage === 100) {
    return "completed";
  } else if (completionPercentage > 0) {
    return "in_progress";
  } else {
    return "pending";
  }
}

/**
 * Compute completion percentage (0-100)
 */
export function computeCompletionPercentage(items: PlanItem[]): number {
  if (!items || items.length === 0) {
    return 0;
  }

  const completedCount = items.filter((item) => item.status === "DONE").length;
  return Math.round((completedCount / items.length) * 100);
}
