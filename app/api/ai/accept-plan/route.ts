import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AIDayPlanSchema } from "@/lib/contracts/aiPlanner";
import { getUserId } from "@/lib/auth-helpers";

/**
 * POST /api/ai/accept-plan
 * Accept and persist an AI-generated plan
 * Only saves to DB after explicit user acceptance
 */
export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();

    // Validate required fields
    if (!body.date || !body.aiPlan) {
      return NextResponse.json(
        { error: "date and aiPlan are required" },
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

    // Re-validate AI plan with Zod (never trust client)
    const validatedPlan = AIDayPlanSchema.parse(body.aiPlan);

    // Get authenticated user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Convert date string to Date object
    const planDate = new Date(body.date + "T00:00:00.000Z");
    planDate.setUTCHours(0, 0, 0, 0);

    // Upsert plan using transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find existing plan or create new
      const existing = await tx.plan.findFirst({
        where: {
          userId,
          date: planDate,
        },
      });

      let plan;
      if (existing) {
        // Update existing plan
        plan = await tx.plan.update({
          where: { id: existing.id },
          data: {
            title: validatedPlan.title,
          },
        });
      } else {
        // Create new plan
        plan = await tx.plan.create({
          data: {
            userId,
            date: planDate,
            title: validatedPlan.title,
          },
        });
      }

      // Delete all existing PlanItems for this plan
      await tx.planItem.deleteMany({
        where: {
          planId: plan.id,
        },
      });

      // Create new PlanItems from AI plan (in correct order)
      const planItems = await Promise.all(
        validatedPlan.items.map((item, index) =>
          tx.planItem.create({
            data: {
              planId: plan.id,
              text: item.text,
              status: "TODO",
              order: item.order,
              tags: ["ai-generated"],
            },
          })
        )
      );

      return { plan, items: planItems };
    });

    // Return saved plan
    return NextResponse.json(
      {
        plan: {
          id: result.plan.id,
          date: body.date,
          title: result.plan.title,
          items: result.items.map((item) => ({
            id: item.id,
            text: item.text,
            status: item.status,
            order: item.order,
            tags: item.tags,
          })),
        },
        metadata: {
          generatedBy: "AI",
          acceptedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid AI plan format", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API] Accept plan error:", {
      error: error.message,
      stack: error.stack,
      date: body?.date || "unknown",
      planTitle: body?.aiPlan?.title || "unknown",
    });
    return NextResponse.json(
      { error: "Failed to save plan. Please try again or create manually." },
      { status: 500 }
    );
  }
}
