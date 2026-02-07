"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FeedbackSubmit, FeedbackRead } from "@/lib/contracts/feedback";

/**
 * Fetch feedback for a date
 */
async function fetchFeedback(date: string): Promise<FeedbackRead> {
  const response = await fetch(`/api/feedback?date=${date}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch feedback: ${response.status}`);
  }

  return response.json();
}

/**
 * Submit feedback
 */
async function submitFeedback(payload: FeedbackSubmit): Promise<FeedbackRead> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit feedback");
  }

  return response.json();
}

/**
 * Hook to fetch feedback for a date
 */
export function useFeedback(date: string) {
  return useQuery({
    queryKey: ["feedback", date],
    queryFn: () => fetchFeedback(date),
  });
}

/**
 * Hook to submit feedback
 */
export function useFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: (data, variables) => {
      // Invalidate and refetch feedback for the date
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.date] });
    },
  });
}
