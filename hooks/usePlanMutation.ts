"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Task } from "@/types/microplan";
import { upsertPlan, convertDateToApiFormat } from "@/lib/api/plans";
import { planQueryKey } from "./usePlan";

/**
 * Hook for upserting plan with optimistic updates
 * Handles optimistic updates, rollback on error, and server reconciliation
 */
export function usePlanMutation(
  onSuccess?: () => void,
  onError?: (error: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertPlan,
    onMutate: async ({ dateStr, tasks }) => {
      // Snapshot previous cache for ['plan', date]
      const queryKey = planQueryKey(dateStr);
      await queryClient.cancelQueries({ queryKey });

      const previousPlan = queryClient.getQueryData(queryKey);

      // Create optimistic plan payload
      const apiDate = convertDateToApiFormat(dateStr);
      const now = new Date().toISOString();
      const planDate = new Date(apiDate + "T00:00:00.000Z");
      const normalizedDate = new Date(planDate);
      normalizedDate.setUTCHours(0, 0, 0, 0);

      // Convert tasks to optimistic plan items
      const optimisticItems = tasks.map((task, index) => ({
        id: task.id || `temp-${Date.now()}-${index}`, // Use existing ID or generate temp ID
        text: task.title,
        status: task.completed ? "DONE" : "TODO",
        order: index,
        tags: task.carriedForward ? ["carried-forward"] : [],
        dueTime: null,
        createdAt: now,
        updatedAt: now,
      }));

      // Build optimistic plan object
      // Note: userId will be set by server response - not needed in optimistic update
      const optimisticPlan = previousPlan
        ? {
            // Update existing plan
            ...(previousPlan as any),
            title: "Daily Plan",
            items: optimisticItems,
            updatedAt: now,
          }
        : {
            // Create new plan structure
            id: `temp-${Date.now()}`,
            userId: "temp", // Placeholder - server will return real userId
            date: normalizedDate.toISOString(),
            title: "Daily Plan",
            items: optimisticItems,
            createdAt: now,
            updatedAt: now,
          };

      // Update cache optimistically
      queryClient.setQueryData(queryKey, optimisticPlan);

      // Return snapshot context for rollback
      return { previousPlan, queryKey };
    },
    onSuccess: (plan, variables) => {
      // Server reconciliation: Replace optimistic update with server response
      // Server is the final source of truth - ensures correct IDs, ordering, and data integrity
      const queryKey = planQueryKey(variables.dateStr);

      // Validate server response structure
      if (!plan || typeof plan !== "object") {
        console.error("Invalid server response:", plan);
        onError?.("Received invalid response from server. Please refresh.");
        return;
      }

      // Ensure items are ordered correctly (server should return ordered, but verify)
      // This also ensures no duplicates - server response replaces optimistic update completely
      const normalizedPlan = {
        ...plan,
        items: plan.items
          ? [...plan.items].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          : [],
      };

      // Replace cache completely with server response (overwrites optimistic update)
      // This ensures: real database IDs replace temp IDs, server ordering is preserved,
      // no duplicate items, and server timestamps are used
      queryClient.setQueryData(queryKey, normalizedPlan);

      // Call success callback
      onSuccess?.();
    },
    onError: (error: any, variables, context) => {
      // Rollback to previous cache state from snapshot
      try {
        if (context) {
          // Restore previous plan (can be null if no plan existed)
          queryClient.setQueryData(context.queryKey, context.previousPlan);
        }
      } catch (rollbackError) {
        // If rollback fails, log but don't crash - UI should still show error
        console.error("Failed to rollback cache:", rollbackError);
      }

      // Show minimal inline error message (ensure it's always a string)
      let errorMessage = "Failed to save plan. Please try again.";
      if (error) {
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = String(error.message);
        } else if (error?.toString) {
          errorMessage = String(error.toString());
        }
      }
      onError?.(errorMessage);
    },
  });
}
