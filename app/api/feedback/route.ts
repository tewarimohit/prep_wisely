import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FeedbackSubmitSchema, FeedbackReadSchema } from "@/lib/contracts/feedback";
import { getUserId } from "@/lib/auth-helpers";

/**
 * POST /api/feedback
 * Create or update feedback for a date
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validated = FeedbackSubmitSchema.parse(body);

    // Convert date string to Date object
    const feedbackDate = new Date(validated.date + "T00:00:00.000Z");
    feedbackDate.setUTCHours(0, 0, 0, 0);

    // Find existing feedback or create new
    const existing = await prisma.feedbackEntry.findFirst({
      where: {
        userId,
        date: feedbackDate,
      },
    });

    let feedback;
    if (existing) {
      // Update existing feedback
      feedback = await prisma.feedbackEntry.update({
        where: { id: existing.id },
        data: {
          mood: validated.mood,
          blockers: validated.blockers || null,
          note: validated.note || null,
        },
      });
    } else {
      // Create new feedback
      feedback = await prisma.feedbackEntry.create({
        data: {
          userId,
          date: feedbackDate,
          mood: validated.mood,
          blockers: validated.blockers || null,
          note: validated.note || null,
        },
      });
    }

    // Transform to response format
    const response = {
      id: feedback.id,
      date: validated.date,
      mood: feedback.mood,
      blockers: feedback.blockers,
      note: feedback.note,
      createdAt: feedback.createdAt.toISOString(),
    };

    // Validate response with Zod schema
    const validatedResponse = FeedbackReadSchema.parse(response);

    return NextResponse.json(validatedResponse, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback?date=YYYY-MM-DD
 * Fetch feedback for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

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

    // Get authenticated user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Convert date string to Date object
    const feedbackDate = new Date(dateParam + "T00:00:00.000Z");
    feedbackDate.setUTCHours(0, 0, 0, 0);

    // Fetch feedback
    const feedback = await prisma.feedbackEntry.findFirst({
      where: {
        userId,
        date: feedbackDate,
      },
    });

    // Transform to response format
    if (feedback) {
      const response = {
        id: feedback.id,
        date: dateParam,
        mood: feedback.mood,
        blockers: feedback.blockers,
        note: feedback.note,
        createdAt: feedback.createdAt.toISOString(),
      };

      // Validate response with Zod schema
      const validatedResponse = FeedbackReadSchema.parse(response);
      return NextResponse.json(validatedResponse, { status: 200 });
    } else {
      // Return null if no feedback exists
      return NextResponse.json(null, { status: 200 });
    }
  } catch (error: any) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
