"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Fetch week plans from API
 * User ID is obtained from session on the server
 */
async function fetchWeekPlans(startDate: string, endDate: string) {
  const response = await fetch(
    `/api/plans/week?startDate=${startDate}&endDate=${endDate}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch week plans: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch week plans for a date range
 */
export function useWeekPlans(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["weekPlans", startDate, endDate],
    queryFn: () => fetchWeekPlans(startDate, endDate),
  });
}
