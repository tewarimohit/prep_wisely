import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  MCQResponseSubmitSchema,
  MCQResultSchema,
  MCQResult,
} from "@/lib/contracts/mcq";
import { updateWeakAreas } from "@/lib/services/weakAreaService";

/**
 * POST /api/mcq/response
 * Submit a response to an MCQ question
 * Evaluates correctness and stores the response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse and validate input
    const validated = MCQResponseSubmitSchema.parse(body);

    // Fetch MCQ to get correct answer
    const mcq = await prisma.mCQ.findUnique({
      where: { id: validated.mcqId },
      select: {
        id: true,
        answerIndex: true,
        explanation: true,
      },
    });

    if (!mcq) {
      return NextResponse.json(
        { error: "MCQ not found" },
        { status: 404 }
      );
    }

    // Verify session exists and get userId
    const session = await prisma.mCQSession.findUnique({
      where: { id: validated.sessionId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Compute correctness server-side
    const isCorrect = validated.choice === mcq.answerIndex;

    // Store MCQResponse
    await prisma.mCQResponse.create({
      data: {
        sessionId: validated.sessionId,
        mcqId: validated.mcqId,
        choice: validated.choice,
        correct: isCorrect,
        timeMs: validated.timeMs,
        userId: session.userId,
      },
    });

    // Update weak area snapshots (non-blocking - failures won't break response)
    updateWeakAreas({
      userId: session.userId,
      mcqId: validated.mcqId,
      isCorrect,
    }).catch((error) => {
      // Log but don't throw - weak area updates are best-effort
      console.error("Weak area update failed (non-blocking):", error);
    });

    // Build result
    const result: MCQResult = {
      correct: isCorrect,
      explanation: mcq.explanation,
      correctAnswerIndex: mcq.answerIndex,
    };

    // Validate result with Zod schema
    const validatedResult = MCQResultSchema.parse(result);

    return NextResponse.json(validatedResult, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("MCQ response error:", error);
    return NextResponse.json(
      { error: "Failed to process MCQ response" },
      { status: 500 }
    );
  }
}
