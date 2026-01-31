import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Compute completion status based on plan items
 * Rules:
 * - 100% done → "completed"
 * - 1-99% done → "in_progress"
 * - 0% done → "pending"
 */
function computeCompletionStatus(items: Array<{ status: string }>): string {
  if (!items || items.length === 0) {
    return "pending";
  }

  const completedCount = items.filter((item) => item.status === "DONE").length;
  const completionPercentage = (completedCount / items.length) * 100;

  if (completionPercentage === 100) {
    return "completed";
  } else if (completionPercentage > 0) {
    return "in_progress";
  } else {
    return "pending";
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from auth context (session/token)
    // For now, getting from query param for development
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get startDate and endDate from query params
    const startDateParam = request.nextUrl.searchParams.get("startDate");
    const endDateParam = request.nextUrl.searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateParam) || !dateRegex.test(endDateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Normalize dates: startDate at 00:00:00, endDate at 23:59:59.999
    const startDate = new Date(startDateParam + "T00:00:00.000Z");
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(endDateParam + "T23:59:59.999Z");
    endDate.setUTCHours(23, 59, 59, 999);

    // Validate date range
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    // Fetch plans within date range for the user
    const plans = await prisma.plan.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        title: true,
        items: {
          select: {
            id: true,
            status: true,
            order: true,
            tags: true, // Include tags to detect carried-forward tasks
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Compute completion status and task counts for each plan
    const plansWithStatus = plans.map((plan) => {
      const totalTasks = plan.items.length;
      const completedTasks = plan.items.filter(
        (item) => item.status === "DONE"
      ).length;
      const carriedForwardTasks = plan.items.filter((item) =>
        item.tags.includes("carried-forward")
      ).length;

      return {
        date: plan.date,
        title: plan.title,
        status: computeCompletionStatus(plan.items),
        totalTasks,
        completedTasks,
        carriedForwardTasks,
        items: plan.items,
      };
    });

    // Compute weekly summary
    const weeklyTotalTasks = plansWithStatus.reduce(
      (sum, plan) => sum + plan.totalTasks,
      0
    );
    const weeklyCompletedTasks = plansWithStatus.reduce(
      (sum, plan) => sum + plan.completedTasks,
      0
    );
    const weeklyCompletionPercentage =
      weeklyTotalTasks > 0
        ? Math.round((weeklyCompletedTasks / weeklyTotalTasks) * 100)
        : 0;

    return NextResponse.json(
      {
        plans: plansWithStatus,
        summary: {
          totalTasks: weeklyTotalTasks,
          completedTasks: weeklyCompletedTasks,
          completionPercentage: weeklyCompletionPercentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching week plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
