import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    // Parse date from route params
    const dateParam = params.date;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth context (session/token)
    // For now, getting from query param for development
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Convert date string to Date object (start of day in UTC)
    const planDate = new Date(dateParam + "T00:00:00.000Z");
    const startOfDay = new Date(planDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Fetch Plan for user + date with ordered PlanItems
    const plan = await prisma.plan.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        items: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Return null if no plan exists
    if (!plan) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
