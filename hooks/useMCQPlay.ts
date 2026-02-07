"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Fetch MCQs for play session
 * User ID is obtained from session on the server
 */
async function fetchMCQs(topicIds?: string[], limit: number = 10) {
  const topicIdsParam = topicIds && topicIds.length > 0 ? topicIds.join(",") : undefined;
  const params = new URLSearchParams({
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
    queryKey: ["mcqPlay", topicIds, limit],
    queryFn: () => fetchMCQs(topicIds, limit),
  });
}
