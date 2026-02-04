"use client";

import { useMutation } from "@tanstack/react-query";
import { MCQResponseSubmitSchema, MCQResult } from "@/lib/contracts/mcq";

/**
 * Submit MCQ response
 */
async function submitMCQResponse(payload: {
  sessionId: string;
  mcqId: string;
  choice: number;
  timeMs: number;
}): Promise<MCQResult> {
  const response = await fetch("/api/mcq/response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit response");
  }

  return response.json();
}

/**
 * Hook to submit MCQ response
 */
export function useMCQResponse() {
  return useMutation({
    mutationFn: submitMCQResponse,
  });
}
