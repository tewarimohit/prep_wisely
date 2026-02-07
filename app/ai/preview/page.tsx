"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorMessage } from "@/components/ErrorMessage";
import { AIDayPlan } from "@/lib/contracts/aiPlanner";
import { usePlan } from "@/hooks/usePlan";
import { planToAIDayPlan } from "@/lib/transformers";
import { computePlanDiff, plansAreIdentical, PlanDiff } from "@/lib/utils/planDiff";

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY for usePlan hook
 */
function convertApiDateToDisplayFormat(apiDate: string): string {
  const [yyyy, mm, dd] = apiDate.split("-").map(Number);
  return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
}

export default function AIPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const type = searchParams.get("type") || "day";

  // Convert date for fetching current plan
  const displayDate = convertApiDateToDisplayFormat(dateParam);
  const { data: currentPlanData } = usePlan(displayDate);

  const [previewData, setPreviewData] = useState<{
    context: any;
    plan: AIDayPlan | any;
    metadata: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [regenerationLimit, setRegenerationLimit] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  // Fetch preview on mount
  useEffect(() => {
    async function fetchPreview() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/ai/plan-preview?date=${dateParam}&type=${type}`
        );
        const data = await response.json();

        if (!response.ok) {
          // Handle rate limiting gracefully
          if (response.status === 429) {
            throw new Error(data.message || "Too many requests. Please try again later.");
          }
          throw new Error(data.error || "Failed to load AI suggestion. Please try again later.");
        }

        setPreviewData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreview();
  }, [dateParam, type]);

  const handleAccept = async () => {
    if (!previewData || type !== "day") {
      return; // Only day plans can be accepted for now
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);
      setAcceptSuccess(false);

      const response = await fetch("/api/ai/accept-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateParam,
          aiPlan: previewData.plan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept plan");
      }

      // Show success message briefly before navigating
      setAcceptSuccess(true);
      setTimeout(() => {
        router.push(`/day?date=${dateParam}`);
      }, 1500);
    } catch (err: any) {
      setAcceptError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      setRegenerateError(null);
      setRegenerationLimit(null);

      const response = await fetch("/api/ai/regenerate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateParam,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRegenerationLimit(data.message || "Regeneration limit exceeded");
        }
        throw new Error(data.error || "Failed to regenerate plan");
      }

      // Update preview with new plan
      setPreviewData((prev) => ({
        ...prev!,
        plan: data.plan,
        metadata: data.metadata,
      }));
    } catch (err: any) {
      setRegenerateError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleKeepCurrent = () => {
    // Navigate to Day page without accepting new plan
    router.push(`/day?date=${dateParam}`);
  };

  // Convert current plan to AIDayPlan format for comparison
  const currentAIPlan = currentPlanData ? planToAIDayPlan(currentPlanData) : null;
  
  // Check if we have weak area data for context explanation
  const hasWeakAreaData = previewData?.context?.weakAreas && previewData.context.weakAreas.length > 0;
  const hasLowActivity = previewData?.context?.lastWeekCompletion !== undefined && previewData.context.lastWeekCompletion < 30;
  
  // Compute diff if we have both plans
  const diff: PlanDiff | null = previewData?.plan && currentAIPlan
    ? computePlanDiff(currentAIPlan, previewData.plan)
    : null;
  
  const hasChanges = diff && (
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    diff.reordered.length > 0
  );
  
  const isIdentical = previewData?.plan && currentAIPlan
    ? plansAreIdentical(currentAIPlan, previewData.plan)
    : false;

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-gray-500">Loading plan preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <ErrorMessage message={`Could not load AI suggestion: ${error}`} />
        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-700 mb-2">
            You can create your plan manually instead:
          </p>
          <Link href={`/day?date=${dateParam}`} className="text-blue-600 underline">
            Go to Day Planner →
          </Link>
        </div>
        <Link href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-gray-600">No preview data available.</div>
        <Link href="/dashboard" className="text-blue-600 underline mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 underline">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">AI Suggested Plan</h1>
      <p className="text-sm text-gray-600 mb-6">
        This plan is a suggestion. You remain in control. You can edit after accepting.
      </p>

      {previewData.metadata && (
        <div className="mb-4 text-sm text-gray-600">
          Generated at: {new Date(previewData.metadata.generatedAt).toLocaleString()}
          {previewData.metadata.modelUsed && (
            <> • Model: {previewData.metadata.modelUsed}</>
          )}
        </div>
      )}

      {/* Context explanation for empty/edge states */}
      {type === "day" && previewData?.plan && (
        <div className="mb-4 text-sm text-gray-600">
          {!hasWeakAreaData && (
            <p className="mb-2">
              <span className="font-medium">Note:</span> This is a general suggestion. 
              Practice MCQs to get personalized recommendations based on your weak areas.
            </p>
          )}
          {hasLowActivity && (
            <p>
              <span className="font-medium">Note:</span> Based on your recent activity, 
              this suggestion focuses on building consistency.
            </p>
          )}
        </div>
      )}

      {type === "day" && previewData.plan && (
        <>
          {/* Comparison UI */}
          {currentAIPlan && diff && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-3">Plan Comparison</h2>
              
              {isIdentical ? (
                <div className="text-gray-600 text-sm">
                  The new suggestion is identical to your current plan.
                </div>
              ) : hasChanges ? (
                <div className="space-y-4">
                  {diff.added.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-1">Added tasks:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {diff.added.map((item, idx) => (
                          <li key={idx}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {diff.removed.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-1">Removed tasks:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {diff.removed.map((item, idx) => (
                          <li key={idx}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {diff.reordered.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-1">Reordered tasks:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {diff.reordered.map((item, idx) => (
                          <li key={idx}>
                            {item.text} (was #{item.oldOrder + 1}, now #{item.newOrder + 1})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600 text-sm">
                  No changes detected.
                </div>
              )}
            </div>
          )}

          {/* Current Plan */}
          {currentAIPlan && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Current Plan</h2>
              <h3 className="text-md font-medium mb-3">{currentAIPlan.title}</h3>
              <div className="space-y-2">
                {currentAIPlan.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium">{index + 1}.</span>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Suggestion */}
          <div className="mb-6 p-4 border border-gray-300 rounded-lg border-blue-400 bg-blue-50">
            <h2 className="text-lg font-semibold mb-2 text-blue-900">AI Suggested Plan</h2>
            <h3 className="text-md font-medium mb-3">{previewData.plan.title}</h3>
            <div className="space-y-2">
              {previewData.plan.items
                .sort((a: any, b: any) => a.order - b.order)
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-medium">{index + 1}.</span>
                    <span className="text-blue-900">{item.text}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleAccept}
              disabled={isAccepting || isRegenerating}
              className="px-6 py-2 bg-green-600 text-white border border-green-700 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? "Saving..." : "Accept Suggested Plan"}
            </button>
            
            {currentAIPlan && (
              <button
                onClick={handleKeepCurrent}
                disabled={isAccepting || isRegenerating}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Current
              </button>
            )}
            
            <button
              onClick={handleRegenerate}
              disabled={isAccepting || isRegenerating || regenerationLimit !== null}
              className="px-6 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate Again"}
            </button>
          </div>

          {regenerationLimit && (
            <div className="mt-4 p-3 border border-orange-300 bg-orange-50 rounded text-orange-700 text-sm">
              {regenerationLimit} You can try again tomorrow or create your plan manually on the Day page.
            </div>
          )}

          {regenerateError && (
            <div className="mt-4 text-red-600 text-sm">
              Failed to regenerate: {regenerateError}
            </div>
          )}

          {acceptSuccess && (
            <div className="mt-4 p-3 border border-green-300 bg-green-50 rounded text-green-700 text-sm">
              Plan saved successfully. Redirecting to Day Planner...
            </div>
          )}

          {acceptError && (
            <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded text-red-700 text-sm">
              Failed to save plan: {acceptError}. You can create your plan manually on the Day page.
            </div>
          )}
        </>
      )}

      {type === "week" && previewData.plan && (
        <div className="mb-6 p-4 border border-gray-300 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Weekly Summary</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Focus Areas:</span>{" "}
              {previewData.plan.focusAreas.join(", ")}
            </div>
            <div>
              <span className="font-medium">Intensity:</span> {previewData.plan.intensity}
            </div>
            <div>
              <span className="font-medium">Notes:</span>
              <p className="mt-1 text-gray-700">{previewData.plan.notes}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 italic">
            Week summaries are informational only. Use day plans for actionable tasks.
          </div>
        </div>
      )}
    </div>
  );
}
