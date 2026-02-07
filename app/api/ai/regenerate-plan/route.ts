import { NextRequest, NextResponse } from "next/server";
import { buildPlannerContext } from "@/lib/services/plannerContext";
import { generateDayPlan } from "@/lib/services/aiPlanner";
import { checkRegenerationLimit, getRegenerationStatus } from "@/lib/services/rateLimiter";
import { getAIModel } from "@/lib/services/aiClient";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

/**
 * POST /api/ai/regenerate-plan
 * Regenerate AI plan preview (no DB writes)
 * Returns fresh suggestion based on same context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Check regeneration limit
    const regenerationAllowed = await checkRegenerationLimit(TEST_USER_ID);
    if (!regenerationAllowed) {
      const status = getRegenerationStatus(TEST_USER_ID);
      return NextResponse.json(
        {
          error: "Regeneration limit exceeded",
          message: `Maximum ${status.remaining} regenerations per day. Reset date: ${status.resetDate}`,
        },
        { status: 429 }
      );
    }

    // Build planner context from real app data (same as preview)
    const context = await buildPlannerContext(TEST_USER_ID, body.date);

    // Generate new plan
    const startTime = Date.now();
    const plan = await generateDayPlan(context);
    const generationTime = Date.now() - startTime;

    // Return preview only (no DB writes)
    return NextResponse.json(
      {
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
    console.error("[API] Regenerate plan error:", {
      error: error.message,
      stack: error.stack,
      date: body.date,
      userId: TEST_USER_ID,
    });
    return NextResponse.json(
      { error: "Failed to regenerate plan. Please try again later." },
      { status: 500 }
    );
  }
}
