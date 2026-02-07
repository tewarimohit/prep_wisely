/**
 * AI API client for OpenAI-compatible endpoints
 * Server-side only - never expose API key to client
 */

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const AI_API_URL = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";

/**
 * Call AI API with structured prompt
 * Returns raw JSON response from AI
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY not configured");
  }

  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3, // Low temperature for deterministic output
      max_tokens: 1000, // Bounded tokens
      response_format: { type: "json_object" }, // Force JSON output
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`AI API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned no content");
  }

  return content;
}

export function getAIModel(): string {
  return AI_MODEL;
}
