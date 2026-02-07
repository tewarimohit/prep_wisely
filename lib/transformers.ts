import { Task } from "@/types/microplan";
import { AIDayPlan } from "@/lib/contracts/aiPlanner";

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

/**
 * Convert Plan API response to AIDayPlan format
 * Used for comparing current plan with AI suggestions
 */
export function planToAIDayPlan(plan: any): AIDayPlan | null {
  if (!plan || !plan.items || plan.items.length === 0) return null;
  
  return {
    title: plan.title || "Daily Plan",
    items: plan.items
      .sort((a: any, b: any) => a.order - b.order)
      .map((item: any) => ({
        text: item.text,
        order: item.order,
      })),
  };
}
