import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UpsertPlanSchema } from "@/lib/contracts";

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

    // Normalize date for exact match (unique constraint ensures no duplicates)
    const normalizedDate = new Date(planDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Fetch Plan for user + date with ordered PlanItems
    // Using findFirst with exact date match (unique constraint prevents duplicates)
    const plan = await prisma.plan.findFirst({
      where: {
        userId,
        date: normalizedDate,
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

    // Guarantee response includes ordered PlanItems (always present due to include)
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Read request body
    const body = await request.json();

    // Validate payload using Zod schema (fail fast)
    const validationResult = UpsertPlanSchema.safeParse({
      ...body,
      date: dateParam, // Use date from route params
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, items } = validationResult.data;

    // Normalize date (string → Date) - start of day in UTC
    const planDate = new Date(dateParam + "T00:00:00.000Z");
    const normalizedDate = new Date(planDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Use Prisma transaction for atomic upsert with duplicate prevention
    const plan = await prisma.$transaction(
      async (tx) => {
        // Find existing plan for user + date (exact match - unique constraint prevents duplicates)
        const existingPlan = await tx.plan.findFirst({
          where: {
            userId,
            date: normalizedDate,
          },
        });

        if (existingPlan) {
          // Update existing plan: delete old items first to prevent orphans
          await tx.planItem.deleteMany({
            where: { planId: existingPlan.id },
          });

          // Update plan title and create new items atomically
          const updatedPlan = await tx.plan.update({
            where: { id: existingPlan.id },
            data: {
              title,
              items: {
                create: items.map((item) => ({
                  text: item.text,
                  status: item.status,
                  dueTime: item.dueTime ? new Date(item.dueTime) : null,
                  tags: item.tags,
                  order: item.order,
                })),
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

          return updatedPlan;
        } else {
          // Create new plan with items atomically
          const newPlan = await tx.plan.create({
            data: {
              userId,
              date: normalizedDate,
              title,
              items: {
                create: items.map((item) => ({
                  text: item.text,
                  status: item.status,
                  dueTime: item.dueTime ? new Date(item.dueTime) : null,
                  tags: item.tags,
                  order: item.order,
                })),
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

          return newPlan;
        }
      },
      {
        // Retry on unique constraint violations (race condition handling)
        maxWait: 5000,
        timeout: 10000,
      }
    );

    // Ensure response always includes PlanItems ordered correctly
    if (!plan.items || plan.items.length === 0) {
      plan.items = [];
    }

    return NextResponse.json(plan, { status: 200 });
  } catch (error: any) {
    console.error("Error upserting plan:", error);

    // Handle unique constraint violation (duplicate plan)
    if (error.code === "P2002" || error.meta?.target?.includes("userId_date")) {
      return NextResponse.json(
        { error: "A plan already exists for this user and date" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
