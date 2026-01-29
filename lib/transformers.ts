import { Task } from "@/types/microplan";

/**
 * Convert Plan API response to Task[] format
 * Used for displaying tasks in the UI
 */
export function planToTasks(plan: any): Task[] {
  if (!plan || !plan.items) return [];
  return plan.items.map((item: any) => ({
    id: item.id,
    title: item.text,
    completed: item.status === "DONE",
    carriedForward: item.tags?.includes("carried-forward") || false,
  }));
}
