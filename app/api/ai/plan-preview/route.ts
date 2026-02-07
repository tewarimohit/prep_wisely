import { NextRequest, NextResponse } from "next/server";
import { buildPlannerContext } from "@/lib/services/plannerContext";
import { generateDayPlan, generateWeekPlan } from "@/lib/services/aiPlanner";
import { checkRateLimit, getRateLimitStatus } from "@/lib/services/rateLimiter";
import { getAIModel } from "@/lib/services/aiClient";

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

    // Check rate limit
    const rateLimitAllowed = await checkRateLimit(TEST_USER_ID);
    if (!rateLimitAllowed) {
      const status = getRateLimitStatus(TEST_USER_ID);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Maximum ${status.remaining} requests per day. Reset date: ${status.resetDate}`,
        },
        { status: 429 }
      );
    }

    // Build planner context from real app data
    const context = await buildPlannerContext(TEST_USER_ID, dateParam);

    // Generate plan based on type
    const startTime = Date.now();
    let plan;
    
    if (type === "day") {
      plan = await generateDayPlan(context);
    } else {
      plan = await generateWeekPlan(context);
    }

    const generationTime = Date.now() - startTime;

    // Return preview (no DB writes)
    return NextResponse.json(
      {
        type,
        context,
        plan,
        metadata: {
          generatedAt: new Date().toISOString(),
          modelUsed: getAIModel(),
          generationTimeMs: generationTime,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid planner context", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API] Plan preview error:", {
      error: error.message,
      stack: error.stack,
      date: dateParam,
      type,
      userId: TEST_USER_ID,
    });
    return NextResponse.json(
      { error: "Failed to generate plan preview. Please try again later." },
      { status: 500 }
    );
  }
}
