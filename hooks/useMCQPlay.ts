"use client";

import { useQuery } from "@tanstack/react-query";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * Fetch MCQs for play session
 */
async function fetchMCQs(userId: string, topicIds?: string[], limit: number = 10) {
  const topicIdsParam = topicIds && topicIds.length > 0 ? topicIds.join(",") : undefined;
  const params = new URLSearchParams({
    userId,
    mode: "practice",
    limit: limit.toString(),
  });
  
  if (topicIdsParam) {
    params.append("topicIds", topicIdsParam);
  }

  const response = await fetch(`/api/mcq/play?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch MCQs: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch MCQs for a play session
 */
export function useMCQPlay(topicIds?: string[], limit: number = 10) {
  return useQuery({
    queryKey: ["mcqPlay", TEST_USER_ID, topicIds, limit],
    queryFn: () => fetchMCQs(TEST_USER_ID, topicIds, limit),
  });
}
