import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";

/**
 * GET /api/mcq/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get MCQ statistics for a date range
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

    // Get authenticated user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch MCQ responses in date range
    const responses = await prisma.mCQResponse.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        correct: true,
        timeMs: true,
      },
    });

    const totalAttempts = responses.length;
    const correctCount = responses.filter((r) => r.correct).length;
    const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
    const totalTimeMs = responses.reduce((sum, r) => sum + r.timeMs, 0);
    const avgTimeMs = totalAttempts > 0 ? totalTimeMs / totalAttempts : 0;

    return NextResponse.json(
      {
        totalAttempts,
        correctCount,
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
        avgTimeMs: Math.round(avgTimeMs),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("MCQ stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MCQ stats" },
      { status: 500 }
    );
  }
}
