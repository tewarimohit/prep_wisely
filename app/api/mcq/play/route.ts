import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MCQPlayRequestSchema } from "@/lib/contracts/mcq";

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

    // TODO: Implement logic to fetch MCQs
    // - Create or get MCQSession
    // - Fetch MCQs based on topicIds and limit
    // - Return questions

    return NextResponse.json(
      {
        sessionId: "placeholder-session-id",
        questions: [],
        message: "MCQ play endpoint - not yet implemented",
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

    // TODO: Implement logic to fetch MCQs
    // - Create or get MCQSession
    // - Fetch MCQs based on topicIds and limit
    // - Return questions

    return NextResponse.json(
      {
        sessionId: "placeholder-session-id",
        questions: [],
        message: "MCQ play endpoint - not yet implemented",
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
    return NextResponse.json(
      { error: "Failed to process MCQ play request" },
      { status: 500 }
    );
  }
}
