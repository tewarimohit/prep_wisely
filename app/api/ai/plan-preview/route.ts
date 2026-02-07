import { NextRequest, NextResponse } from "next/server";
import { buildPlannerContext } from "@/lib/services/plannerContext";
import { generateDayPlan, generateWeekPlan } from "@/lib/services/aiPlanner";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * GET /api/ai/plan-preview?date=YYYY-MM-DD&type=day|week
 * Preview AI-generated plan based on real app data
 * Internal endpoint for testing planner integration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const type = searchParams.get("type") || "day"; // "day" or "week"

    if (!dateParam) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== "day" && type !== "week") {
      return NextResponse.json(
        { error: "type must be 'day' or 'week'" },
        { status: 400 }
      );
    }

    // Build planner context from real app data
    const context = await buildPlannerContext(TEST_USER_ID, dateParam);

    // Generate plan based on type
    if (type === "day") {
      const dayPlan = await generateDayPlan(context);
      return NextResponse.json(
        {
          type: "day",
          context,
          plan: dayPlan,
        },
        { status: 200 }
      );
    } else {
      const weekPlan = await generateWeekPlan(context);
      return NextResponse.json(
        {
          type: "week",
          context,
          plan: weekPlan,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid planner context", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Plan preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan preview" },
      { status: 500 }
    );
  }
}
