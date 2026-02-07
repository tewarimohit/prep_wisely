import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WeakAreaReadSchema } from "@/lib/contracts/weakAreas";
import { getUserId } from "@/lib/auth-helpers";

/**
 * GET /api/weak-areas
 * Fetch weak area snapshots for a user
 * Returns topics ordered by lowest score first, then highest attempts
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch weak area snapshots with topic information
    const snapshots = await prisma.weakAreaSnapshot.findMany({
      where: {
        userId,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          score: "asc", // Lowest score first (weakest areas)
        },
        {
          attempts: "desc", // Highest attempts second (more data = more reliable)
        },
      ],
    });

    // Transform to response format
    const weakAreas = snapshots.map((snapshot) => ({
      topicId: snapshot.topicId,
      topicName: snapshot.topic.name,
      score: snapshot.score,
      attempts: snapshot.attempts,
      lastSeenAt: snapshot.lastSeenAt.toISOString(),
    }));

    // Validate response with Zod schema
    const validated = WeakAreaReadSchema.parse({
      weakAreas,
    });

    return NextResponse.json(validated, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid response data", details: error.errors },
        { status: 500 }
      );
    }
    console.error("Weak areas fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weak areas" },
      { status: 500 }
    );
  }
}
