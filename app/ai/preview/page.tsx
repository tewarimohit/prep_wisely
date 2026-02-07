"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorMessage } from "@/components/ErrorMessage";
import { AIDayPlan } from "@/lib/contracts/aiPlanner";

export default function AIPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const type = searchParams.get("type") || "day";

  const [previewData, setPreviewData] = useState<{
    context: any;
    plan: AIDayPlan | any;
    metadata: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

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
          throw new Error(data.error || "Failed to load preview");
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

      // Navigate to Day page on success
      // Day page accepts YYYY-MM-DD format in query param
      router.push(`/day?date=${dateParam}`);
    } catch (err: any) {
      setAcceptError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRegenerate = () => {
    // Reload preview
    window.location.reload();
  };

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
        <ErrorMessage message={`Could not load preview: ${error}`} />
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

      <h1 className="text-3xl font-bold mb-6">AI Plan Preview</h1>

      {previewData.metadata && (
        <div className="mb-4 text-sm text-gray-600">
          Generated at: {new Date(previewData.metadata.generatedAt).toLocaleString()}
          {previewData.metadata.modelUsed && (
            <> • Model: {previewData.metadata.modelUsed}</>
          )}
        </div>
      )}

      {type === "day" && previewData.plan && (
        <>
          <div className="mb-6 p-4 border border-gray-300 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">{previewData.plan.title}</h2>
            <div className="space-y-2">
              {previewData.plan.items
                .sort((a: any, b: any) => a.order - b.order)
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium">{index + 1}.</span>
                    <span>{item.text}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="px-6 py-2 bg-green-600 text-white border border-green-700 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? "Accepting..." : "Accept Plan"}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isAccepting}
              className="px-6 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Regenerate
            </button>
          </div>

          {acceptError && (
            <div className="mt-4 text-red-600 text-sm">
              Failed to accept plan: {acceptError}
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
