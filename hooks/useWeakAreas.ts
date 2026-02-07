"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Fetch weak areas from API
 * User ID is obtained from session on the server
 */
async function fetchWeakAreas() {
  const response = await fetch(`/api/weak-areas`);

  if (!response.ok) {
    throw new Error(`Failed to fetch weak areas: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch weak areas for the authenticated user
 */
export function useWeakAreas() {
  return useQuery({
    queryKey: ["weakAreas"],
    queryFn: () => fetchWeakAreas(),
  });
}
