import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MCQPlayRequestSchema, MCQSafeSchema } from "@/lib/contracts/mcq";

/**
 * GET /api/mcq/play
 * Start a new MCQ session or fetch questions for an existing session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode") || "practice";
    const topicIdsParam = searchParams.get("topicIds");
    const limitParam = searchParams.get("limit");

    // Parse and validate input
    const topicIds = topicIdsParam ? topicIdsParam.split(",") : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const validated = MCQPlayRequestSchema.parse({
      userId: userId || "",
      mode,
      topicIds,
      limit,
    });

    // Create a new session
    // Note: In a production app, you might want to find an existing active session
    // For now, we create a new session each time
    const newSession = await prisma.mCQSession.create({
      data: {
        userId: validated.userId,
        mode: validated.mode,
      },
    });

    // Build where clause for MCQ query
    const whereClause: any = {};
    if (validated.topicIds && validated.topicIds.length > 0) {
      whereClause.topics = {
        some: {
          id: {
            in: validated.topicIds,
          },
        },
      };
    }

    // Fetch MCQs with randomization
    // Note: Prisma doesn't have native random ordering, so we'll fetch more and shuffle
    const allMcqs = await prisma.mCQ.findMany({
      where: whereClause,
      select: {
        id: true,
        stem: true,
        options: true,
        // answerIndex is intentionally excluded
      },
      take: validated.limit * 2, // Fetch more for randomization
    });

    // Shuffle and take limit
    const shuffled = allMcqs.sort(() => Math.random() - 0.5);
    const selectedMcqs = shuffled.slice(0, validated.limit);

    // Validate and transform to safe format (without answerIndex)
    const safeQuestions = selectedMcqs.map((mcq) => {
      const safe = MCQSafeSchema.parse({
        id: mcq.id,
        stem: mcq.stem,
        options: mcq.options,
      });
      return safe;
    });

    return NextResponse.json(
      {
        sessionId: newSession.id,
        questions: safeQuestions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }
    console.error("MCQ play error:", error);
    return NextResponse.json(
      { error: "Failed to process MCQ play request" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcq/play
 * Alternative endpoint for starting a session with body payload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = MCQPlayRequestSchema.parse(body);

    // Create a new session
    const newSession = await prisma.mCQSession.create({
      data: {
        userId: validated.userId,
        mode: validated.mode,
      },
    });

    // Build where clause for MCQ query
    const whereClause: any = {};
    if (validated.topicIds && validated.topicIds.length > 0) {
      whereClause.topics = {
        some: {
          id: {
            in: validated.topicIds,
          },
        },
      };
    }

    // Fetch MCQs with randomization
    const allMcqs = await prisma.mCQ.findMany({
      where: whereClause,
      select: {
        id: true,
        stem: true,
        options: true,
        // answerIndex is intentionally excluded
      },
      take: validated.limit * 2, // Fetch more for randomization
    });

    // Shuffle and take limit
    const shuffled = allMcqs.sort(() => Math.random() - 0.5);
    const selectedMcqs = shuffled.slice(0, validated.limit);

    // Validate and transform to safe format (without answerIndex)
    const safeQuestions = selectedMcqs.map((mcq) => {
      const safe = MCQSafeSchema.parse({
        id: mcq.id,
        stem: mcq.stem,
        options: mcq.options,
      });
      return safe;
    });

    return NextResponse.json(
      {
        sessionId: newSession.id,
        questions: safeQuestions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("MCQ play error:", error);
    return NextResponse.json(
      { error: "Failed to process MCQ play request" },
      { status: 500 }
    );
  }
}
