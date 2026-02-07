"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { ErrorMessage } from "@/components/ErrorMessage";
import Link from "next/link";

export default function DashboardPage() {
  const { weekPlans, weakAreas, mcqStats, feedbackWeek } = useDashboard();

  // Extract week plans summary
  const plans = weekPlans.data?.plans || [];
  const weekSummary = weekPlans.data?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    completionPercentage: 0,
  };
  const daysPlanned = plans.filter((p: any) => p.title && p.title.trim() !== "").length;
  const daysCompleted = plans.filter(
    (p: any) => p.status === "completed"
  ).length;

  // Extract weak areas (top 3)
  const topWeakAreas = (weakAreas.data?.weakAreas || []).slice(0, 3);

  // Extract MCQ stats
  const mcqData = mcqStats.data || {
    totalAttempts: 0,
    accuracy: 0,
    avgTimeMs: 0,
  };

  // Extract feedback
  const feedbackData = feedbackWeek.data || {
    entries: 0,
    mostFrequentMood: null,
    lastMood: null,
  };

  const getMoodDisplay = () => {
    if (feedbackData.mostFrequentMood) {
      return `Mostly ${feedbackData.mostFrequentMood} this week`;
    } else if (feedbackData.lastMood) {
      return `Last mood: ${feedbackData.lastMood}`;
    }
    return null;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Link href="/day" className="text-blue-600 hover:text-blue-800 underline">
            Day →
          </Link>
          <Link href="/week" className="text-blue-600 hover:text-blue-800 underline">
            Week →
          </Link>
          <Link href="/mcq/play" className="text-blue-600 hover:text-blue-800 underline">
            MCQs →
          </Link>
          <Link
            href={`/ai/preview?date=${new Date().toISOString().split("T")[0]}&type=day`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            AI Plan →
          </Link>
        </div>
      </div>

      {/* Weekly Plan Summary */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-1">This Week at a Glance</h2>
        <p className="text-sm text-gray-600 mb-3">
          Your plan completion progress for the current week
        </p>
        {weekPlans.isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : weekPlans.error ? (
          <div className="text-red-600 text-sm">Failed to load plan data</div>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Days planned:</span> {daysPlanned} / 7
            </div>
            <div>
              <span className="font-medium">Days completed:</span> {daysCompleted} / 7
            </div>
            <div>
              <span className="font-medium">Overall completion:</span>{" "}
              <span className="font-semibold">{weekSummary.completionPercentage}%</span>
            </div>
            {weekSummary.totalTasks > 0 && (
              <div className="text-sm text-gray-600">
                {weekSummary.completedTasks} / {weekSummary.totalTasks} tasks completed
              </div>
            )}
            {daysPlanned === 0 && (
              <div className="text-gray-500 text-sm">No plans created this week</div>
            )}
          </div>
        )}
      </div>

      {/* MCQ Snapshot */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-1">MCQ Performance</h2>
        <p className="text-sm text-gray-600 mb-3">
          Your accuracy and practice volume from this week's MCQ sessions
        </p>
        {mcqStats.isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : mcqStats.error ? (
          <div className="text-red-600 text-sm">Failed to load MCQ stats</div>
        ) : mcqData.totalAttempts === 0 ? (
          <div className="text-gray-500 text-sm">No MCQs attempted this week</div>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Questions attempted:</span> {mcqData.totalAttempts}
            </div>
            <div>
              <span className="font-medium">MCQ accuracy:</span>{" "}
              <span className="font-semibold">{mcqData.accuracy.toFixed(1)}%</span>
            </div>
            {mcqData.avgTimeMs > 0 && (
              <div className="text-sm text-gray-600">
                Average time: {Math.round(mcqData.avgTimeMs / 1000)}s per question
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weak Areas */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Areas to Focus</h2>
          <Link href="/weak-areas" className="text-sm text-blue-600 hover:text-blue-800 underline">
            View all →
          </Link>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Topics where your accuracy is below target, ranked by priority
        </p>
        {weakAreas.isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : weakAreas.error ? (
          <div className="text-red-600 text-sm">Failed to load weak areas</div>
        ) : topWeakAreas.length === 0 ? (
          <div className="text-gray-500 text-sm">No focus areas identified yet</div>
        ) : (
          <div className="space-y-2">
            {topWeakAreas.map((area: any) => {
              const scoreColor =
                area.score >= 70
                  ? "text-green-600"
                  : area.score >= 50
                  ? "text-yellow-600"
                  : "text-red-600";

              return (
                <div key={area.topicId} className="flex items-center justify-between">
                  <span className="text-sm">{area.topicName}</span>
                  <span className={`text-sm font-medium ${scoreColor}`}>
                    {area.score.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Signal */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-1">Weekly Mood</h2>
        <p className="text-sm text-gray-600 mb-3">
          Your overall sentiment pattern from daily feedback entries
        </p>
        {feedbackWeek.isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : feedbackWeek.error ? (
          <div className="text-red-600 text-sm">Failed to load feedback</div>
        ) : feedbackData.entries === 0 ? (
          <div className="text-gray-500 text-sm">No feedback recorded this week</div>
        ) : (
          <div className="text-sm">
            {getMoodDisplay() || "No mood data available"}
          </div>
        )}
      </div>
    </div>
  );
}
