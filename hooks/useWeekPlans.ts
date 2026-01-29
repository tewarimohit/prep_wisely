"use client";

import { useQuery } from "@tanstack/react-query";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * Fetch week plans from API
 */
async function fetchWeekPlans(startDate: string, endDate: string) {
  const response = await fetch(
    `/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
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
