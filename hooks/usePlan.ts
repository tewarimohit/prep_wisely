"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlan } from "@/lib/api/plans";

/**
 * Query key factory for plan queries
 */
export function planQueryKey(dateStr: string) {
  return ["plan", dateStr] as const;
}

/**
 * Hook to fetch plan data for a given date
 */
export function usePlan(dateStr: string) {
  return useQuery({
    queryKey: planQueryKey(dateStr),
    queryFn: () => fetchPlan(dateStr),
  });
}
