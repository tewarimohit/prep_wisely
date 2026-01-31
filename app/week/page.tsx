"use client";

import Link from "next/link";
import { useWeekPlans } from "@/hooks/useWeekPlans";
import { CompletionStatus } from "@/lib/completion";
import { ErrorMessage } from "@/components/ErrorMessage";

/**
 * Get Monday and Sunday of current week
 */
function getWeekDates(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday (if today is Sunday, go back 6 days; otherwise go back to Monday)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday (6 days after Monday)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

/**
 * Generate array of 7 days (Monday to Sunday)
 */
function getWeekDays(startDate: string): string[] {
  const [year, month, day] = startDate.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }

  return days;
}

/**
 * Format date for display
 */
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekday = weekdays[date.getDay()];
  return `${weekday}, ${month}/${day}`;
}

/**
 * Get status badge styling
 */
function getStatusBadgeStyle(status: CompletionStatus): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get status display text
 */
function getStatusText(status: CompletionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "pending":
      return "Pending";
    default:
      return "No Plan";
  }
}

export default function WeekPage() {
  const { startDate, endDate } = getWeekDates();
  const weekDays = getWeekDays(startDate);
  
  const { data: weekData, isLoading, error, refetch: refetchWeek } = useWeekPlans(startDate, endDate);

  // Extract plans and summary from API response
  const plans = weekData?.plans || [];
  const summary = weekData?.summary || { totalTasks: 0, completedTasks: 0, completionPercentage: 0 };

  // Create a map of date -> plan for quick lookup
  const plansByDate = new Map<string, any>();
  if (plans && Array.isArray(plans)) {
    plans.forEach((plan: any) => {
      const planDate = new Date(plan.date);
      const dateStr = `${planDate.getFullYear()}-${String(planDate.getMonth() + 1).padStart(2, "0")}-${String(planDate.getDate()).padStart(2, "0")}`;
      plansByDate.set(dateStr, plan);
    });
  }

  // Check if week has any plans
  const hasPlans = plans.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Week View</h1>

      {isLoading && (
        <div className="text-gray-500 mb-4">Loading week...</div>
      )}

      {error && (
        <ErrorMessage
          message="Could not load week. Retry."
          onRetry={() => refetchWeek()}
        />
      )}

      {/* Weekly Summary */}
      {!isLoading && !error && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {hasPlans ? (
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-gray-800">
                Week completion: {summary.completionPercentage}%
              </div>
              <div className="text-sm text-gray-600">
                {summary.completedTasks} / {summary.totalTasks} tasks completed
              </div>
            </div>
          ) : (
            <div className="text-gray-600 italic">
              No plans created this week
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {weekDays.map((dateStr) => {
          const plan = plansByDate.get(dateStr);
          const status: CompletionStatus = plan?.status || "pending";
          const isToday = dateStr === new Date().toISOString().split("T")[0];

          return (
            <Link
              key={dateStr}
              href={`/day?date=${dateStr}`}
              className={`block border rounded-lg p-4 ${
                isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold">
                      {formatDateDisplay(dateStr)}
                    </h2>
                    {isToday && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-medium">
                        Today
                      </span>
                    )}
                  </div>
                  {plan?.title ? (
                    <p className="text-gray-700 font-medium">{plan.title}</p>
                  ) : (
                    <p className="text-gray-400 italic">No plan</p>
                  )}
                  {plan?.carriedForwardTasks > 0 && (
                    <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      {plan.carriedForwardTasks} task{plan.carriedForwardTasks !== 1 ? "s" : ""} carried forward
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded border text-sm font-semibold ${getStatusBadgeStyle(
                      status
                    )}`}
                  >
                    {getStatusText(status)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
