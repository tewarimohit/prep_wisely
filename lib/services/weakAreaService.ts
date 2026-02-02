import { prisma } from "@/lib/db";

/**
 * Update weak area snapshots after an MCQ response
 * 
 * For each topic associated with the MCQ:
 * - Increment attempts count
 * - Update score as rolling accuracy (correct / attempts)
 * - Update lastSeenAt timestamp
 * 
 * Note: Since WeakAreaSnapshot doesn't have a unique constraint on (userId, topicId),
 * we use findFirst and then update/create manually.
 */
export async function updateWeakAreas({
  userId,
  mcqId,
  isCorrect,
}: {
  userId: string;
  mcqId: string;
  isCorrect: boolean;
}): Promise<void> {
  try {
    // Fetch MCQ with its topics
    const mcq = await prisma.mCQ.findUnique({
      where: { id: mcqId },
      select: {
        id: true,
        topics: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!mcq) {
      console.warn(`MCQ not found: ${mcqId}`);
      return;
    }

    if (!mcq.topics || mcq.topics.length === 0) {
      console.warn(`MCQ ${mcqId} has no topics associated`);
      return;
    }

    // Update snapshot for each topic
    const updatePromises = mcq.topics.map(async (topic) => {
      // Find existing snapshot
      const existing = await prisma.weakAreaSnapshot.findFirst({
        where: {
          userId,
          topicId: topic.id,
        },
      });

      if (existing) {
        // Calculate new values
        // Score is stored as percentage (0-100), so we need to derive correct count
        // correctCount ≈ (score / 100) * attempts
        // But to be precise, we'll recalculate from attempts and score
        const currentAttempts = existing.attempts;
        const currentScore = existing.score; // percentage 0-100
        
        // Derive approximate correct count from score
        // This is approximate due to rounding, but acceptable for rolling accuracy
        const approximateCorrect = Math.round((currentScore / 100) * currentAttempts);
        
        const newAttempts = currentAttempts + 1;
        const newCorrect = approximateCorrect + (isCorrect ? 1 : 0);
        const newScore = newAttempts > 0 
          ? (newCorrect / newAttempts) * 100 
          : 0;

        // Update existing snapshot
        await prisma.weakAreaSnapshot.update({
          where: { id: existing.id },
          data: {
            attempts: newAttempts,
            score: newScore,
            lastSeenAt: new Date(),
          },
        });
      } else {
        // Create new snapshot
        const newAttempts = 1;
        const newScore = isCorrect ? 100 : 0;

        await prisma.weakAreaSnapshot.create({
          data: {
            userId,
            topicId: topic.id,
            attempts: newAttempts,
            score: newScore,
            lastSeenAt: new Date(),
          },
        });
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    // Log error but don't throw - weak area updates should not break MCQ response flow
    console.error("Failed to update weak areas:", error);
  }
}
