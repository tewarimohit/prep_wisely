import { Task } from "@/types/microplan";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for API
 */
export function convertDateToApiFormat(dateStr: string): string {
  const [dd, mm, yyyy] = dateStr.split("/").map(Number);
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/**
 * Fetcher function for GET /api/plans/[date]
 * Returns null if no plan exists, or plan object
 */
export async function fetchPlan(dateStr: string): Promise<any> {
  const apiDate = convertDateToApiFormat(dateStr);
  const userId = TEST_USER_ID;

  const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plan: ${response.status}`);
  }

  const plan = await response.json();
  return plan;
}

/**
 * Mutation function for POST /api/plans/[date]
 * Converts Tasks to PlanItems format and sends to API
 */
export async function upsertPlan({
  dateStr,
  tasks,
}: {
  dateStr: string;
  tasks: Task[];
}): Promise<any> {
  const apiDate = convertDateToApiFormat(dateStr);
  const userId = TEST_USER_ID;

  // Convert Tasks to PlanItems format
  const items = tasks.map((task, index) => ({
    text: task.title,
    status: task.completed ? "DONE" : "TODO",
    order: index,
    tags: task.carriedForward ? ["carried-forward"] : [],
    dueTime: null,
  }));

  const payload = {
    title: "Daily Plan", // TODO: Make title editable in UI
    items,
  };

  const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to save plan: ${response.status}`
    );
  }

  return await response.json();
}
