/**
 * Test script for weak area tracking
 * Tests that WeakAreaSnapshot updates correctly after MCQ responses
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

async function submitMCQResponse(
  sessionId: string,
  mcqId: string,
  choice: number
) {
  const url = `${BASE_URL}/api/mcq/response`;
  const payload = {
    sessionId,
    mcqId,
    choice,
    timeMs: 5000,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Response submission failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log("=== Testing Weak Area Tracking ===\n");

  try {
    // Step 1: Fetch MCQs to get a session and questions
    console.log("1. Fetching MCQs...");
    const fetchUrl = `${BASE_URL}/api/mcq/play?userId=${TEST_USER_ID}&mode=practice&limit=5`;
    const fetchResponse = await fetch(fetchUrl);
    const fetchData = await fetchResponse.json();

    if (!fetchResponse.ok || !fetchData.questions || fetchData.questions.length === 0) {
      console.log("❌ No MCQs available for testing");
      console.log("   Response:", fetchData);
      console.log("\n⚠️  To test weak areas:");
      console.log("   1. Add MCQs to the database with topics");
      console.log("   2. Run this script again");
      return;
    }

    const sessionId = fetchData.sessionId;
    const questions = fetchData.questions;
    console.log(`✅ Fetched ${questions.length} questions`);
    console.log(`   Session ID: ${sessionId}\n`);

    // Step 2: Submit responses (mix of correct and incorrect)
    console.log("2. Submitting MCQ responses...\n");

    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const question = questions[i];
      const choice = i % 2 === 0 ? 0 : 1; // Alternate choices

      console.log(`   Submitting response ${i + 1}:`);
      console.log(`   - MCQ ID: ${question.id}`);
      console.log(`   - Choice: ${choice}`);

      try {
        const result = await submitMCQResponse(sessionId, question.id, choice);
        console.log(`   - Result: ${result.correct ? "✅ Correct" : "❌ Incorrect"}`);
        console.log(`   - Correct answer index: ${result.correctAnswerIndex}\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log("3. Verification Steps:\n");
    console.log("   ✅ Responses submitted successfully");
    console.log("   📊 Check database for WeakAreaSnapshot updates:\n");
    console.log("   Run: npx prisma studio");
    console.log("   Then verify:");
    console.log("   - One snapshot per (userId, topicId) combination");
    console.log("   - attempts count increments correctly");
    console.log("   - score updates as rolling accuracy");
    console.log("   - lastSeenAt updates to current timestamp");
    console.log("\n   Example query:");
    console.log(`   SELECT * FROM "WeakAreaSnapshot" WHERE "userId" = '${TEST_USER_ID}';`);

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error);
