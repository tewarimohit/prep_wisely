"use client";

import { useWeakAreas } from "@/hooks/useWeakAreas";
import { ErrorMessage } from "@/components/ErrorMessage";
import Link from "next/link";
import { WeakAreaItem } from "@/lib/contracts/weakAreas";

export default function WeakAreasPage() {
  const { data, isLoading, error, refetch } = useWeakAreas();

  const weakAreas = data?.weakAreas || [];
  const hasWeakAreas = weakAreas.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Weak Areas</h1>
        <Link
          href="/week"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Week View
        </Link>
      </div>

      {isLoading && (
        <div className="text-gray-500 mb-4">Loading weak areas...</div>
      )}

      {error && (
        <ErrorMessage
          message="Could not load weak areas. Retry."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && !hasWeakAreas && (
        <div className="text-gray-600 italic p-8 bg-gray-50 border border-gray-200 rounded-lg">
          No MCQs attempted yet. Start practicing to see your weak areas!
        </div>
      )}

      {!isLoading && !error && hasWeakAreas && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Topic
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Attempts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {weakAreas.map((area: WeakAreaItem) => {
                const scoreColor =
                  area.score >= 70
                    ? "text-green-600"
                    : area.score >= 50
                    ? "text-yellow-600"
                    : "text-red-600";

                return (
                  <tr key={area.topicId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {area.topicName}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${scoreColor}`}>
                      {area.score.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {area.attempts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
