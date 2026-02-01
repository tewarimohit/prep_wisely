import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MCQResponseSubmitSchema, MCQResultSchema, MCQResult } from "@/lib/contracts/mcq";

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

    // TODO: Implement evaluation logic
    // 1. Fetch MCQ to get correct answer
    // 2. Compare choice with answerIndex
    // 3. Create MCQResponse record
    // 4. Return result with explanation

    // Placeholder evaluation
    const result: MCQResult = {
      correct: false,
      explanation: null,
      correctAnswerIndex: 0,
    };

    return NextResponse.json(
      {
        ...result,
        message: "MCQ response endpoint - not yet implemented",
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
      { error: "Failed to process MCQ response" },
      { status: 500 }
    );
  }
}
