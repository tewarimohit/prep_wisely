import {
  AIDayPlan,
  AIDayPlanSchema,
  AIWeekSummary,
  AIWeekSummarySchema,
  PlannerInput,
} from "@/lib/contracts/aiPlanner";

/**
 * Generate a daily plan based on real planner context
 * 
 * This is a stub function that returns mocked data derived from inputs.
 * In production, this would call an AI API (e.g., OpenAI, Anthropic).
 * 
 * @param context - Real planner context from buildPlannerContext
 * @returns Generated day plan conforming to AIDayPlanSchema
 */
export async function generateDayPlan(context: PlannerInput): Promise<AIDayPlan> {
  // TODO: Replace with actual AI API call
  // For now, return mocked data that is derived from real context
  
  // Derive plan title based on mood and completion
  let title = "Daily Study Plan";
  if (context.latestMood === "struggling" || context.lastWeekCompletion < 50) {
    title = "Focused Recovery Plan";
  } else if (context.latestMood === "great" && context.lastWeekCompletion >= 80) {
    title = "Maintain Momentum Plan";
  }

  // Build items based on weak areas
  const items: Array<{ text: string; order: number }> = [];
  let order = 0;

  // Add weak area focus items
  if (context.weakAreas.length > 0) {
    context.weakAreas.slice(0, 2).forEach((area) => {
      items.push({
        text: `Review and practice: ${area.topicName} (current accuracy: ${area.score.toFixed(1)}%)`,
        order: order++,
      });
    });
  }

  // Add MCQ practice based on recent accuracy
  const mcqCount = context.recentMCQAccuracy < 60 ? 15 : 10;
  items.push({
    text: `Practice ${mcqCount} MCQs on current topics`,
    order: order++,
  });

  // Add revision item
  items.push({
    text: "Revise previous day's notes and key concepts",
    order: order++,
  });

  // Add blockers-specific item if present
  if (context.latestBlockers) {
    items.push({
      text: `Address blocker: ${context.latestBlockers.substring(0, 50)}${context.latestBlockers.length > 50 ? "..." : ""}`,
      order: order++,
    });
  }

  // Ensure at least one item
  if (items.length === 0) {
    items.push({
      text: "Complete daily study routine",
      order: 0,
    });
  }

  const plan: AIDayPlan = {
    title,
    items,
  };

  // Validate with Zod schema
  return AIDayPlanSchema.parse(plan);
}

/**
 * Generate a weekly summary and guidance based on real planner context
 * 
 * This is a stub function that returns mocked data derived from inputs.
 * In production, this would call an AI API (e.g., OpenAI, Anthropic).
 * 
 * @param context - Real planner context from buildPlannerContext
 * @returns Generated week summary conforming to AIWeekSummarySchema
 */
export async function generateWeekPlan(context: PlannerInput): Promise<AIWeekSummary> {
  // TODO: Replace with actual AI API call
  // For now, return mocked data that is derived from real context
  
  // Determine intensity based on completion and accuracy
  let intensity: "light" | "moderate" | "intensive" = "moderate";
  if (context.lastWeekCompletion < 50 || context.recentMCQAccuracy < 50) {
    intensity = "intensive";
  } else if (context.lastWeekCompletion >= 80 && context.recentMCQAccuracy >= 70) {
    intensity = "light";
  }

  // Build focus areas from weak areas
  const focusAreas = context.weakAreas
    .slice(0, 3)
    .map((area) => area.topicName);

  // Add general revision if we have fewer than 3 weak areas
  if (focusAreas.length < 3) {
    focusAreas.push("General Revision");
  }

  // Ensure we don't exceed max
  const finalFocusAreas = focusAreas.slice(0, 5);

  // Build notes based on context
  let notes = `Based on your ${context.lastWeekCompletion}% completion last week and ${context.recentMCQAccuracy}% MCQ accuracy`;
  
  if (context.latestMood) {
    notes += `, with a ${context.latestMood} mood`;
  }
  
  notes += ", focus on strengthening your weak areas while maintaining consistent practice.";

  if (context.latestBlockers) {
    notes += ` Address blockers: ${context.latestBlockers.substring(0, 100)}${context.latestBlockers.length > 100 ? "..." : ""}`;
  }

  const summary: AIWeekSummary = {
    focusAreas: finalFocusAreas,
    intensity,
    notes,
  };

  // Validate with Zod schema
  return AIWeekSummarySchema.parse(summary);
}
