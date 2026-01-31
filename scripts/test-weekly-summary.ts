/**
 * Test script to verify weekly completion summary
 * Run with: npx tsx scripts/test-weekly-summary.ts
 */

import { prisma } from "../lib/db";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = process.env.TEST_USER_ID || "cmko9jw0y0002dx23vbn4lnm2";

// Helper to get Monday and Sunday of current week
function getWeekDates(): { startDate: string; endDate: string } {
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

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

async function testWeeklySummary() {
  console.log("🧪 Testing Weekly Completion Summary\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}\n`);

  const { startDate, endDate } = getWeekDates();
  console.log(`Week range: ${startDate} to ${endDate}\n`);

  try {
    // ============================================
    // Test 1: Week with no plans → safe empty state
    // ============================================
    console.log("📝 Test 1: Week with no plans (empty state)\n");

    // Clean up existing plans for the test week
    const monday = new Date(startDate + "T00:00:00.000Z");
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(endDate + "T23:59:59.999Z");
    sunday.setUTCHours(23, 59, 59, 999);

    await prisma.plan.deleteMany({
      where: {
        userId: TEST_USER_ID,
        date: {
          gte: monday,
          lte: sunday,
        },
      },
    });
    console.log("  ✅ Cleaned up existing plans\n");

    // Fetch week plans
    const responseEmpty = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!responseEmpty.ok) {
      throw new Error(`Failed to fetch week: ${responseEmpty.status}`);
    }

    const emptyData = await responseEmpty.json();

    // Verify response structure
    if (!emptyData.plans || !Array.isArray(emptyData.plans)) {
      throw new Error("Response missing plans array");
    }
    if (!emptyData.summary) {
      throw new Error("Response missing summary");
    }

    // Verify empty state
    if (emptyData.plans.length !== 0) {
      throw new Error(`Expected 0 plans, got ${emptyData.plans.length}`);
    }
    if (emptyData.summary.totalTasks !== 0) {
      throw new Error(`Expected 0 total tasks, got ${emptyData.summary.totalTasks}`);
    }
    if (emptyData.summary.completedTasks !== 0) {
      throw new Error(`Expected 0 completed tasks, got ${emptyData.summary.completedTasks}`);
    }
    if (emptyData.summary.completionPercentage !== 0) {
      throw new Error(`Expected 0% completion, got ${emptyData.summary.completionPercentage}%`);
    }

    console.log("  ✅ Empty week handled correctly:");
    console.log(`     Plans: ${emptyData.plans.length}`);
    console.log(`     Total tasks: ${emptyData.summary.totalTasks}`);
    console.log(`     Completed tasks: ${emptyData.summary.completedTasks}`);
    console.log(`     Completion: ${emptyData.summary.completionPercentage}%\n`);

    // ============================================
    // Test 2: Week fully completed → shows 100%
    // ============================================
    console.log("📝 Test 2: Week fully completed (100%)\n");

    // Create plans with all tasks completed
    const plan1Date = new Date(startDate + "T00:00:00.000Z");
    plan1Date.setUTCHours(0, 0, 0, 0);
    const plan2Date = new Date(startDate + "T00:00:00.000Z");
    plan2Date.setDate(plan2Date.getDate() + 1);
    plan2Date.setUTCHours(0, 0, 0, 0);

    await prisma.plan.create({
      data: {
        userId: TEST_USER_ID,
        date: plan1Date,
        title: "Completed Plan 1",
        items: {
          create: [
            { text: "Task 1", status: "DONE", order: 0, tags: [], dueTime: null },
            { text: "Task 2", status: "DONE", order: 1, tags: [], dueTime: null },
          ],
        },
      },
    });

    await prisma.plan.create({
      data: {
        userId: TEST_USER_ID,
        date: plan2Date,
        title: "Completed Plan 2",
        items: {
          create: [
            { text: "Task 3", status: "DONE", order: 0, tags: [], dueTime: null },
            { text: "Task 4", status: "DONE", order: 1, tags: [], dueTime: null },
            { text: "Task 5", status: "DONE", order: 2, tags: [], dueTime: null },
          ],
        },
      },
    });

    const responseFull = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!responseFull.ok) {
      throw new Error(`Failed to fetch week: ${responseFull.status}`);
    }

    const fullData = await responseFull.json();

    // Verify 100% completion
    if (fullData.summary.totalTasks !== 5) {
      throw new Error(`Expected 5 total tasks, got ${fullData.summary.totalTasks}`);
    }
    if (fullData.summary.completedTasks !== 5) {
      throw new Error(`Expected 5 completed tasks, got ${fullData.summary.completedTasks}`);
    }
    if (fullData.summary.completionPercentage !== 100) {
      throw new Error(`Expected 100% completion, got ${fullData.summary.completionPercentage}%`);
    }

    console.log("  ✅ Fully completed week:");
    console.log(`     Total tasks: ${fullData.summary.totalTasks}`);
    console.log(`     Completed tasks: ${fullData.summary.completedTasks}`);
    console.log(`     Completion: ${fullData.summary.completionPercentage}%\n`);

    // ============================================
    // Test 3: Mixed progress → summary accurate
    // ============================================
    console.log("📝 Test 3: Mixed progress (summary accuracy)\n");

    // Clean up and create mixed plans
    await prisma.plan.deleteMany({
      where: {
        userId: TEST_USER_ID,
        date: {
          gte: monday,
          lte: sunday,
        },
      },
    });

    const plan3Date = new Date(startDate + "T00:00:00.000Z");
    plan3Date.setUTCHours(0, 0, 0, 0);
    const plan4Date = new Date(startDate + "T00:00:00.000Z");
    plan4Date.setDate(plan4Date.getDate() + 2);
    plan4Date.setUTCHours(0, 0, 0, 0);

    // Plan 1: 2/3 completed (66.67%)
    await prisma.plan.create({
      data: {
        userId: TEST_USER_ID,
        date: plan3Date,
        title: "Mixed Plan 1",
        items: {
          create: [
            { text: "Task A", status: "DONE", order: 0, tags: [], dueTime: null },
            { text: "Task B", status: "DONE", order: 1, tags: [], dueTime: null },
            { text: "Task C", status: "TODO", order: 2, tags: [], dueTime: null },
          ],
        },
      },
    });

    // Plan 2: 1/4 completed (25%)
    await prisma.plan.create({
      data: {
        userId: TEST_USER_ID,
        date: plan4Date,
        title: "Mixed Plan 2",
        items: {
          create: [
            { text: "Task X", status: "DONE", order: 0, tags: [], dueTime: null },
            { text: "Task Y", status: "TODO", order: 1, tags: [], dueTime: null },
            { text: "Task Z", status: "TODO", order: 2, tags: [], dueTime: null },
            { text: "Task W", status: "TODO", order: 3, tags: [], dueTime: null },
          ],
        },
      },
    });

    const responseMixed = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`
    );

    if (!responseMixed.ok) {
      throw new Error(`Failed to fetch week: ${responseMixed.status}`);
    }

    const mixedData = await responseMixed.json();

    // Verify mixed progress: 3 completed out of 7 total = 42.86% → 43% rounded
    if (mixedData.summary.totalTasks !== 7) {
      throw new Error(`Expected 7 total tasks, got ${mixedData.summary.totalTasks}`);
    }
    if (mixedData.summary.completedTasks !== 3) {
      throw new Error(`Expected 3 completed tasks, got ${mixedData.summary.completedTasks}`);
    }
    const expectedPercentage = Math.round((3 / 7) * 100); // 43%
    if (mixedData.summary.completionPercentage !== expectedPercentage) {
      throw new Error(
        `Expected ${expectedPercentage}% completion, got ${mixedData.summary.completionPercentage}%`
      );
    }

    console.log("  ✅ Mixed progress summary:");
    console.log(`     Total tasks: ${mixedData.summary.totalTasks}`);
    console.log(`     Completed tasks: ${mixedData.summary.completedTasks}`);
    console.log(`     Completion: ${mixedData.summary.completionPercentage}%`);
    console.log(`     Expected: ${expectedPercentage}% (3/7 = 42.86% rounded)\n`);

    // ============================================
    // Test 4: Verify response structure
    // ============================================
    console.log("📝 Test 4: Response structure validation\n");

    // Verify all required fields exist
    if (!mixedData.plans || !Array.isArray(mixedData.plans)) {
      throw new Error("Response missing plans array");
    }
    if (!mixedData.summary) {
      throw new Error("Response missing summary");
    }
    if (typeof mixedData.summary.totalTasks !== "number") {
      throw new Error("summary.totalTasks is not a number");
    }
    if (typeof mixedData.summary.completedTasks !== "number") {
      throw new Error("summary.completedTasks is not a number");
    }
    if (typeof mixedData.summary.completionPercentage !== "number") {
      throw new Error("summary.completionPercentage is not a number");
    }

    console.log("  ✅ Response structure valid:");
    console.log(`     plans: array with ${mixedData.plans.length} items`);
    console.log(`     summary.totalTasks: ${mixedData.summary.totalTasks}`);
    console.log(`     summary.completedTasks: ${mixedData.summary.completedTasks}`);
    console.log(`     summary.completionPercentage: ${mixedData.summary.completionPercentage}\n`);

    // ============================================
    // Summary
    // ============================================
    console.log("✅ All Weekly Summary Tests Passed!\n");
    console.log("Summary:");
    console.log("  ✅ Empty week handled correctly (0% completion)");
    console.log("  ✅ Fully completed week shows 100%");
    console.log("  ✅ Mixed progress summary is accurate");
    console.log("  ✅ Response structure is valid");
  } catch (error: any) {
    console.error("\n❌ Test Failed:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testWeeklySummary();
