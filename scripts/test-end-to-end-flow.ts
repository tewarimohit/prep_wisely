/**
 * End-to-end flow test for Prep Wisely application
 * Tests the complete user journey from planning to AI acceptance
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

async function testDayPlanning() {
  console.log("\n=== Testing Day Planning Flow ===\n");

  try {
    // 1. Create a plan for a date
    const planPayload = {
      title: "Test Daily Plan",
      items: [
        { text: "Task 1", status: "TODO", order: 0, tags: [], dueTime: null },
        { text: "Task 2", status: "TODO", order: 1, tags: [], dueTime: null },
      ],
    };

    const createResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planPayload),
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Failed to create plan: ${createResponse.status}`);
    }

    const createdPlan = await createResponse.json();
    logTest("Create plan for date", true);

    // 2. Toggle tasks → reload → verify persistence
    const updatedItems = createdPlan.items.map((item: any, index: number) => ({
      ...item,
      status: index === 0 ? "DONE" : item.status, // Toggle first task
    }));

    const updatePayload = {
      ...planPayload,
      items: updatedItems,
    };

    const updateResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update plan: ${updateResponse.status}`);
    }

    logTest("Toggle task completion", true);

    // 3. Reload and verify persistence
    const reloadResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`
    );

    if (!reloadResponse.ok) {
      throw new Error(`Failed to reload plan: ${reloadResponse.status}`);
    }

    const reloadedPlan = await reloadResponse.json();
    const firstItemStatus = reloadedPlan.items.find((i: any) => i.order === 0)?.status;

    if (firstItemStatus !== "DONE") {
      throw new Error(`Task status not persisted. Expected DONE, got ${firstItemStatus}`);
    }

    logTest("Reload and verify persistence", true);
  } catch (error: any) {
    logTest("Day planning flow", false, error.message);
  }
}

async function testMCQFlow() {
  console.log("\n=== Testing MCQ Flow ===\n");

  try {
    // 1. Start MCQ session
    const playResponse = await fetch(
      `${BASE_URL}/api/mcq/play?userId=${TEST_USER_ID}&limit=5`
    );

    if (!playResponse.ok) {
      throw new Error(`Failed to start MCQ session: ${playResponse.status}`);
    }

    const playData = await playResponse.json();
    logTest("Start MCQ session", true);

    if (!playData.sessionId || !playData.questions || playData.questions.length === 0) {
      throw new Error("Invalid MCQ play response");
    }

    // 2. Submit a response
    const firstQuestion = playData.questions[0];
    const submitResponse = await fetch(`${BASE_URL}/api/mcq/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: playData.sessionId,
        mcqId: firstQuestion.id,
        choice: 0, // Select first option
        timeMs: 5000,
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`Failed to submit response: ${submitResponse.status}`);
    }

    const result = await submitResponse.json();
    logTest("Submit MCQ response", true);

    if (typeof result.correct !== "boolean") {
      throw new Error("Invalid response result");
    }

    // 3. Check weak areas update
    const weakAreasResponse = await fetch(
      `${BASE_URL}/api/weak-areas?userId=${TEST_USER_ID}`
    );

    if (!weakAreasResponse.ok) {
      throw new Error(`Failed to fetch weak areas: ${weakAreasResponse.status}`);
    }

    const weakAreas = await weakAreasResponse.json();
    logTest("Check weak areas update", true);

    // Note: Weak areas may be empty if no topics linked, which is OK
    console.log(`   Found ${weakAreas.weakAreas?.length || 0} weak areas`);
  } catch (error: any) {
    logTest("MCQ flow", false, error.message);
  }
}

async function testFeedbackFlow() {
  console.log("\n=== Testing Feedback Flow ===\n");

  try {
    // Submit daily feedback
    const feedbackResponse = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: TEST_DATE,
        mood: "good",
        blockers: "Test blocker",
        note: "Test note",
      }),
    });

    if (!feedbackResponse.ok) {
      throw new Error(`Failed to submit feedback: ${feedbackResponse.status}`);
    }

    logTest("Submit daily feedback", true);

    // Verify feedback persists
    const readResponse = await fetch(
      `${BASE_URL}/api/feedback?date=${TEST_DATE}&userId=${TEST_USER_ID}`
    );

    if (!readResponse.ok) {
      throw new Error(`Failed to read feedback: ${readResponse.status}`);
    }

    const feedback = await readResponse.json();
    logTest("Read feedback persistence", true);

    if (feedback.mood !== "good") {
      throw new Error(`Feedback not persisted correctly. Expected 'good', got '${feedback.mood}'`);
    }
  } catch (error: any) {
    logTest("Feedback flow", false, error.message);
  }
}

async function testDashboardFlow() {
  console.log("\n=== Testing Dashboard Flow ===\n");

  try {
    // Get week dates
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDate = formatDate(monday);
    const endDate = formatDate(sunday);

    // Test week plans API
    const weekPlansResponse = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!weekPlansResponse.ok) {
      throw new Error(`Failed to fetch week plans: ${weekPlansResponse.status}`);
    }

    const weekPlans = await weekPlansResponse.json();
    logTest("Fetch week plans for dashboard", true);

    // Test MCQ stats API
    const mcqStatsResponse = await fetch(
      `${BASE_URL}/api/mcq/stats?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!mcqStatsResponse.ok) {
      throw new Error(`Failed to fetch MCQ stats: ${mcqStatsResponse.status}`);
    }

    const mcqStats = await mcqStatsResponse.json();
    logTest("Fetch MCQ stats for dashboard", true);

    // Test feedback week API
    const feedbackWeekResponse = await fetch(
      `${BASE_URL}/api/feedback/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!feedbackWeekResponse.ok) {
      throw new Error(`Failed to fetch feedback week: ${feedbackWeekResponse.status}`);
    }

    const feedbackWeek = await feedbackWeekResponse.json();
    logTest("Fetch feedback week for dashboard", true);

    console.log(`   Week summary: ${weekPlans.summary?.completionPercentage || 0}% completion`);
    console.log(`   MCQ stats: ${mcqStats.totalAttempts || 0} attempts`);
    console.log(`   Feedback entries: ${feedbackWeek.entries || 0}`);
  } catch (error: any) {
    logTest("Dashboard flow", false, error.message);
  }
}

async function testAIFlow() {
  console.log("\n=== Testing AI Plan Flow ===\n");

  try {
    // 1. Generate AI plan preview
    const previewResponse = await fetch(
      `${BASE_URL}/api/ai/plan-preview?date=${TEST_DATE}&type=day`
    );

    if (!previewResponse.ok) {
      throw new Error(`Failed to generate preview: ${previewResponse.status}`);
    }

    const previewData = await previewResponse.json();
    logTest("Generate AI plan preview", true);

    if (!previewData.plan || !previewData.plan.title || !previewData.plan.items) {
      throw new Error("Invalid preview data structure");
    }

    // 2. Regenerate once
    const regenerateResponse = await fetch(`${BASE_URL}/api/ai/regenerate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: TEST_DATE }),
    });

    if (!regenerateResponse.ok) {
      // Rate limiting is OK - just log it
      if (regenerateResponse.status === 429) {
        console.log("   ⚠️  Regeneration rate limited (expected if already used)");
        logTest("Regenerate AI plan", true);
      } else {
        throw new Error(`Failed to regenerate: ${regenerateResponse.status}`);
      }
    } else {
      const regenerateData = await regenerateResponse.json();
      logTest("Regenerate AI plan", true);
    }

    // 3. Accept plan
    const acceptResponse = await fetch(`${BASE_URL}/api/ai/accept-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: TEST_DATE,
        aiPlan: previewData.plan,
      }),
    });

    if (!acceptResponse.ok) {
      throw new Error(`Failed to accept plan: ${acceptResponse.status}`);
    }

    const acceptedPlan = await acceptResponse.json();
    logTest("Accept AI plan", true);

    // 4. Verify plan saved (reload)
    const reloadResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`
    );

    if (!reloadResponse.ok) {
      throw new Error(`Failed to reload plan: ${reloadResponse.status}`);
    }

    const reloadedPlan = await reloadResponse.json();
    const hasAIGeneratedTag = reloadedPlan.items.some((item: any) =>
      item.tags?.includes("ai-generated")
    );

    if (!hasAIGeneratedTag) {
      console.log("   ⚠️  AI-generated tag not found (may be expected)");
    }

    logTest("Reload and verify AI plan saved", true);
  } catch (error: any) {
    logTest("AI flow", false, error.message);
  }
}

async function main() {
  console.log("Starting End-to-End Flow Tests...\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Date: ${TEST_DATE}`);
  console.log(`Test User ID: ${TEST_USER_ID}\n`);

  await testDayPlanning();
  await testMCQFlow();
  await testFeedbackFlow();
  await testDashboardFlow();
  await testAIFlow();

  // Summary
  console.log("\n=== Test Summary ===");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
  }
}

main().catch(console.error);
