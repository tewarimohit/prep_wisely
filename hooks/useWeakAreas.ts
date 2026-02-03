"use client";

import { useQuery } from "@tanstack/react-query";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * Fetch weak areas from API
 */
async function fetchWeakAreas(userId: string) {
  const response = await fetch(`/api/weak-areas?userId=${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch weak areas: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch weak areas for a user
 */
export function useWeakAreas() {
  return useQuery({
    queryKey: ["weakAreas", TEST_USER_ID],
    queryFn: () => fetchWeakAreas(TEST_USER_ID),
  });
}
