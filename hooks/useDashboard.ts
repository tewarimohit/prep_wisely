"use client";

import { useQuery } from "@tanstack/react-query";
import { useWeekPlans } from "./useWeekPlans";
import { useWeakAreas } from "./useWeakAreas";

/**
 * Get week dates (Monday to Sunday)
 */
function getWeekDates(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

/**
 * Fetch MCQ stats for a date range
 */
async function fetchMCQStats(startDate: string, endDate: string) {
  const response = await fetch(
    `/api/mcq/stats?startDate=${startDate}&endDate=${endDate}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch MCQ stats: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch feedback for a date range
 */
async function fetchFeedbackWeek(startDate: string, endDate: string) {
  const response = await fetch(
    `/api/feedback/week?startDate=${startDate}&endDate=${endDate}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch feedback: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch dashboard data
 */
export function useDashboard() {
  const { startDate, endDate } = getWeekDates();
  
  const weekPlans = useWeekPlans(startDate, endDate);
  const weakAreas = useWeakAreas();
  
  const mcqStats = useQuery({
    queryKey: ["mcqStats", startDate, endDate],
    queryFn: () => fetchMCQStats(startDate, endDate),
  });

  const feedbackWeek = useQuery({
    queryKey: ["feedbackWeek", startDate, endDate],
    queryFn: () => fetchFeedbackWeek(startDate, endDate),
  });

  return {
    weekPlans,
    weakAreas,
    mcqStats,
    feedbackWeek,
    startDate,
    endDate,
  };
}
