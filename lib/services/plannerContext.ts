import { prisma } from "@/lib/db";
import { PlannerInput, PlannerInputSchema } from "@/lib/contracts/aiPlanner";

/**
 * Get week dates (Monday to Sunday) for a given date
 */
function getWeekDatesForDate(date: Date): { startDate: Date; endDate: Date } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startDate: monday, endDate: sunday };
}

/**
 * Get previous week dates
 */
function getPreviousWeekDates(date: Date): { startDate: Date; endDate: Date } {
  const currentWeek = getWeekDatesForDate(date);
  const prevMonday = new Date(currentWeek.startDate);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);

  return { startDate: prevMonday, endDate: prevSunday };
}

/**
 * Build planner context from real app data
 * Aggregates weak areas, completion stats, MCQ performance, and feedback
 */
export async function buildPlannerContext(
  userId: string,
  date: string // YYYY-MM-DD
): Promise<PlannerInput> {
  const targetDate = new Date(date + "T00:00:00.000Z");
  targetDate.setUTCHours(0, 0, 0, 0);

  // Fetch weak areas (top 5)
  const weakAreaSnapshots = await prisma.weakAreaSnapshot.findMany({
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
      { score: "asc" }, // Lowest score first
      { attempts: "desc" }, // Highest attempts second
    ],
    take: 5,
  });

  const weakAreas = weakAreaSnapshots.map((snapshot) => ({
    topicId: snapshot.topicId,
    topicName: snapshot.topic.name,
    score: snapshot.score,
    attempts: snapshot.attempts,
  }));

  // Fetch last week's plan completion
  const { startDate: prevStart, endDate: prevEnd } = getPreviousWeekDates(targetDate);
  
  const prevWeekPlans = await prisma.plan.findMany({
    where: {
      userId,
      date: {
        gte: prevStart,
        lte: prevEnd,
      },
    },
    select: {
      items: {
        select: {
          status: true,
        },
      },
    },
  });

  // Calculate completion percentage
  let totalTasks = 0;
  let completedTasks = 0;
  prevWeekPlans.forEach((plan) => {
    plan.items.forEach((item) => {
      totalTasks++;
      if (item.status === "DONE") {
        completedTasks++;
      }
    });
  });

  const lastWeekCompletion = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  // Fetch recent MCQ accuracy (last 7 days)
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentResponses = await prisma.mCQResponse.findMany({
    where: {
      userId,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      correct: true,
    },
  });

  const recentMCQAccuracy = recentResponses.length > 0
    ? Math.round(
        (recentResponses.filter((r) => r.correct).length / recentResponses.length) * 100
      )
    : 0;

  // Fetch latest feedback entry
  const latestFeedback = await prisma.feedbackEntry.findFirst({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      mood: true,
      blockers: true,
    },
  });

  // Build planner input
  const plannerInput: PlannerInput = {
    weakAreas,
    lastWeekCompletion,
    recentMCQAccuracy,
    latestMood: latestFeedback?.mood || null,
    latestBlockers: latestFeedback?.blockers || null,
    date,
  };

  // Validate with Zod schema
  return PlannerInputSchema.parse(plannerInput);
}
