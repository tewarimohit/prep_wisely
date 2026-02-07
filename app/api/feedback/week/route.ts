import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * GET /api/feedback/week?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get feedback entries for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateParam) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
      return NextResponse.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam + "T00:00:00.000Z");
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(endDateParam + "T23:59:59.999Z");
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch feedback entries in date range
    const feedbackEntries = await prisma.feedbackEntry.findMany({
      where: {
        userId: TEST_USER_ID,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        mood: true,
        date: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Find most frequent mood
    const moodCounts: Record<string, number> = {};
    feedbackEntries.forEach((entry) => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    const mostFrequentMood = Object.entries(moodCounts).reduce(
      (max, [mood, count]) => (count > max[1] ? [mood, count] : max),
      ["", 0]
    )[0];

    const lastMood = feedbackEntries.length > 0 ? feedbackEntries[0].mood : null;

    return NextResponse.json(
      {
        entries: feedbackEntries.length,
        mostFrequentMood: mostFrequentMood || null,
        lastMood: lastMood,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Feedback week error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
