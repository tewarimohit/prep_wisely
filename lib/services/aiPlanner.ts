import {
  AIDayPlan,
  AIDayPlanSchema,
  AIWeekSummary,
  AIWeekSummarySchema,
  PlannerInput,
} from "@/lib/contracts/aiPlanner";
import { callAI, getAIModel } from "./aiClient";

/**
 * Generate a daily plan based on real planner context
 * 
 * Calls AI API with structured prompt and validates output with Zod.
 * Falls back to mocked data if AI call fails or validation fails.
 * 
 * @param context - Real planner context from buildPlannerContext
 * @returns Generated day plan conforming to AIDayPlanSchema
 */
export async function generateDayPlan(context: PlannerInput): Promise<AIDayPlan> {
  // Fallback plan (used if AI fails or validation fails)
  const getFallbackPlan = (): AIDayPlan => {
    let title = "Daily Study Plan";
    if (context.latestMood === "struggling" || context.lastWeekCompletion < 50) {
      title = "Focused Recovery Plan";
    } else if (context.latestMood === "great" && context.lastWeekCompletion >= 80) {
      title = "Maintain Momentum Plan";
    }

    const items: Array<{ text: string; order: number }> = [];
    let order = 0;

    if (context.weakAreas.length > 0) {
      context.weakAreas.slice(0, 2).forEach((area) => {
        items.push({
          text: `Review and practice: ${area.topicName} (current accuracy: ${area.score.toFixed(1)}%)`,
          order: order++,
        });
      });
    }

    const mcqCount = context.recentMCQAccuracy < 60 ? 15 : 10;
    items.push({
      text: `Practice ${mcqCount} MCQs on current topics`,
      order: order++,
    });

    items.push({
      text: "Revise previous day's notes and key concepts",
      order: order++,
    });

    if (context.latestBlockers) {
      items.push({
        text: `Address blocker: ${context.latestBlockers.substring(0, 50)}${context.latestBlockers.length > 50 ? "..." : ""}`,
        order: order++,
      });
    }

    if (items.length === 0) {
      items.push({
        text: "Complete daily study routine",
        order: 0,
      });
    }

    return { title, items };
  };

  // Try AI call if API key is configured
  if (process.env.AI_API_KEY) {
    try {
      const systemPrompt = `You are a study planner for UPSC exam preparation. Generate a daily study plan as a JSON object with this exact structure:
{
  "title": "string (plan title)",
  "items": [
    {
      "text": "string (task description)",
      "order": number (0, 1, 2, ... unique integers)
    }
  ]
}

Rules:
- Title should be concise and motivating
- Include 3-6 items
- Items must have unique order values starting from 0
- Focus on weak areas and improvement
- Keep task descriptions actionable and specific
- Return ONLY valid JSON, no markdown or extra text`;

      const userPrompt = `Generate a daily study plan for ${context.date}.

Context:
- Weak areas: ${context.weakAreas.map((a) => `${a.topicName} (${a.score.toFixed(1)}% accuracy)`).join(", ") || "None identified"}
- Last week completion: ${context.lastWeekCompletion}%
- Recent MCQ accuracy: ${context.recentMCQAccuracy}%
- Latest mood: ${context.latestMood || "Not recorded"}
- Blockers: ${context.latestBlockers || "None"}

Return a JSON object matching the schema exactly.`;

      const aiResponse = await callAI(systemPrompt, userPrompt);
      
      // Parse JSON response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        return getFallbackPlan();
      }

      // Validate with Zod schema
      try {
        const validatedPlan = AIDayPlanSchema.parse(parsedResponse);
        return validatedPlan;
      } catch (validationError: any) {
        // Zod validation failed - log and fall back
        console.error("[AI Planner] Day plan validation failed:", {
          errors: validationError.errors || validationError.message,
          context: { weakAreas: context.weakAreas.length, date: context.date },
        });
        return getFallbackPlan();
      }
    } catch (error: any) {
      // Log error but don't throw - fall back to mocked plan
      console.error("[AI Planner] Day plan generation failed:", {
        message: error.message,
        context: { weakAreas: context.weakAreas.length, date: context.date },
      });
      return getFallbackPlan();
    }
  }

  // No API key configured - use fallback
  return getFallbackPlan();
}

/**
 * Generate a weekly summary and guidance based on real planner context
 * 
 * Calls AI API with structured prompt and validates output with Zod.
 * Falls back to mocked data if AI call fails or validation fails.
 * 
 * @param context - Real planner context from buildPlannerContext
 * @returns Generated week summary conforming to AIWeekSummarySchema
 */
export async function generateWeekPlan(context: PlannerInput): Promise<AIWeekSummary> {
  // Fallback summary (used if AI fails or validation fails)
  const getFallbackSummary = (): AIWeekSummary => {
    let intensity: "light" | "moderate" | "intensive" = "moderate";
    if (context.lastWeekCompletion < 50 || context.recentMCQAccuracy < 50) {
      intensity = "intensive";
    } else if (context.lastWeekCompletion >= 80 && context.recentMCQAccuracy >= 70) {
      intensity = "light";
    }

    const focusAreas = context.weakAreas
      .slice(0, 3)
      .map((area) => area.topicName);

    if (focusAreas.length < 3) {
      focusAreas.push("General Revision");
    }

    let notes = `Based on your ${context.lastWeekCompletion}% completion last week and ${context.recentMCQAccuracy}% MCQ accuracy`;
    
    if (context.latestMood) {
      notes += `, with a ${context.latestMood} mood`;
    }
    
    notes += ", focus on strengthening your weak areas while maintaining consistent practice.";

    if (context.latestBlockers) {
      notes += ` Address blockers: ${context.latestBlockers.substring(0, 100)}${context.latestBlockers.length > 100 ? "..." : ""}`;
    }

    return {
      focusAreas: focusAreas.slice(0, 5),
      intensity,
      notes,
    };
  };

  // Try AI call if API key is configured
  if (process.env.AI_API_KEY) {
    try {
      const systemPrompt = `You are a study planner for UPSC exam preparation. Generate a weekly planning summary as a JSON object with this exact structure:
{
  "focusAreas": ["string", "string", ...] (1-5 topic names),
  "intensity": "light" | "moderate" | "intensive",
  "notes": "string (guidance paragraph)"
}

Rules:
- focusAreas: 1-5 topic names from weak areas, prioritize lowest accuracy
- intensity: "light" if doing well, "intensive" if struggling, "moderate" otherwise
- notes: 2-4 sentences of actionable guidance
- Return ONLY valid JSON, no markdown or extra text`;

      const userPrompt = `Generate a weekly planning summary.

Context:
- Weak areas: ${context.weakAreas.map((a) => `${a.topicName} (${a.score.toFixed(1)}% accuracy, ${a.attempts} attempts)`).join(", ") || "None identified"}
- Last week completion: ${context.lastWeekCompletion}%
- Recent MCQ accuracy: ${context.recentMCQAccuracy}%
- Latest mood: ${context.latestMood || "Not recorded"}
- Blockers: ${context.latestBlockers || "None"}

Return a JSON object matching the schema exactly.`;

      const aiResponse = await callAI(systemPrompt, userPrompt);
      
      // Parse JSON response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        return getFallbackSummary();
      }

      // Validate with Zod schema
      try {
        const validatedSummary = AIWeekSummarySchema.parse(parsedResponse);
        return validatedSummary;
      } catch (validationError: any) {
        // Zod validation failed - log and fall back
        console.error("[AI Planner] Week plan validation failed:", {
          errors: validationError.errors || validationError.message,
          context: { weakAreas: context.weakAreas.length, date: context.date },
        });
        return getFallbackSummary();
      }
    } catch (error: any) {
      // Log error but don't throw - fall back to mocked summary
      console.error("[AI Planner] Week plan generation failed:", {
        message: error.message,
        context: { weakAreas: context.weakAreas.length, date: context.date },
      });
      return getFallbackSummary();
    }
  }

  // No API key configured - use fallback
  return getFallbackSummary();
}
