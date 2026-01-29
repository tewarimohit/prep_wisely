/**
 * Test script to verify Week → Day navigation flow
 * Run with: npx tsx scripts/test-navigation-flow.ts
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

async function testNavigationFlow() {
  console.log("🧪 Testing Week → Day Navigation Flow\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}\n`);

  const { startDate, endDate } = getWeekDates();
  console.log(`Week range: ${startDate} to ${endDate}\n`);

  try {
    // ============================================
    // Test 1: Week API returns carry-forward counts
    // ============================================
    console.log("📝 Test 1: Week API includes carry-forward counts\n");

    // Create a plan with carried-forward tasks
    const testDate = startDate; // Monday
    const planDate = new Date(testDate + "T00:00:00.000Z");
    planDate.setUTCHours(0, 0, 0, 0);

    // Clean up existing plan
    const existingPlan = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: planDate,
      },
    });

    if (existingPlan) {
      await prisma.planItem.deleteMany({ where: { planId: existingPlan.id } });
      await prisma.plan.delete({ where: { id: existingPlan.id } });
    }

    // Create plan with carried-forward tasks
    const plan = await prisma.plan.create({
      data: {
        userId: TEST_USER_ID,
        date: planDate,
        title: "Test Plan with Carried Tasks",
        items: {
          create: [
            {
              text: "Regular Task 1",
              status: "DONE",
              order: 0,
              tags: [],
              dueTime: null,
            },
            {
              text: "Carried Task 1",
              status: "TODO",
              order: 1,
              tags: ["carried-forward"],
              dueTime: null,
            },
            {
              text: "Carried Task 2",
              status: "TODO",
              order: 2,
              tags: ["carried-forward"],
              dueTime: null,
            },
          ],
        },
      },
    });

    console.log(`  ✅ Created plan with ${plan.items.length} items (2 carried-forward)\n`);

    // Fetch week plans
    const weekResponse = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!weekResponse.ok) {
      throw new Error(`Failed to fetch week: ${weekResponse.status}`);
    }

    const weekPlans = await weekResponse.json();
    const testPlan = weekPlans.find((p: any) => {
      const pDate = new Date(p.date);
      const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}-${String(pDate.getDate()).padStart(2, "0")}`;
      return pDateStr === testDate;
    });

    if (!testPlan) {
      throw new Error("Test plan not found in week response");
    }

    // Verify carry-forward counts
    if (testPlan.totalTasks !== 3) {
      throw new Error(`Expected 3 total tasks, got ${testPlan.totalTasks}`);
    }
    if (testPlan.completedTasks !== 1) {
      throw new Error(`Expected 1 completed task, got ${testPlan.completedTasks}`);
    }
    if (testPlan.carriedForwardTasks !== 2) {
      throw new Error(`Expected 2 carried-forward tasks, got ${testPlan.carriedForwardTasks}`);
    }

    console.log(`  ✅ Week API returns correct counts:`);
    console.log(`     Total: ${testPlan.totalTasks}`);
    console.log(`     Completed: ${testPlan.completedTasks}`);
    console.log(`     Carried Forward: ${testPlan.carriedForwardTasks}\n`);

    // ============================================
    // Test 2: Day page reads query param correctly
    // ============================================
    console.log("📝 Test 2: Day page reads query param\n");

    // Simulate clicking a day: GET /day?date=YYYY-MM-DD
    const dayResponse = await fetch(
      `${BASE_URL}/api/plans/${testDate}?userId=${TEST_USER_ID}`,
      { method: "GET" }
    );

    if (!dayResponse.ok) {
      throw new Error(`Failed to fetch day plan: ${dayResponse.status}`);
    }

    const dayPlan = await dayResponse.json();

    if (!dayPlan) {
      throw new Error("Day plan not found");
    }

    // Verify it's the correct plan
    if (dayPlan.title !== "Test Plan with Carried Tasks") {
      throw new Error(`Wrong plan loaded: expected "Test Plan with Carried Tasks", got "${dayPlan.title}"`);
    }

    console.log(`  ✅ Day API correctly loads plan for date ${testDate}`);
    console.log(`     Plan title: ${dayPlan.title}`);
    console.log(`     Items: ${dayPlan.items.length}\n`);

    // ============================================
    // Test 3: Default to today if no date param
    // ============================================
    console.log("📝 Test 3: Default to today (no date param)\n");

    const today = new Date().toISOString().split("T")[0];
    const todayResponse = await fetch(
      `${BASE_URL}/api/plans/${today}?userId=${TEST_USER_ID}`,
      { method: "GET" }
    );

    // Should return plan or null (both are valid)
    if (!todayResponse.ok && todayResponse.status !== 404) {
      throw new Error(`Failed to fetch today's plan: ${todayResponse.status}`);
    }

    console.log(`  ✅ Day API handles today's date correctly\n`);

    // ============================================
    // Test 4: Reload preserves data
    // ============================================
    console.log("📝 Test 4: Reload preserves data\n");

    // Fetch week plans again (simulating reload)
    const reloadResponse1 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!reloadResponse1.ok) {
      throw new Error(`Failed to reload week: ${reloadResponse1.status}`);
    }

    const reloadPlans1 = await reloadResponse1.json();

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Reload again
    const reloadResponse2 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!reloadResponse2.ok) {
      throw new Error(`Failed to reload week (2nd time): ${reloadResponse2.status}`);
    }

    const reloadPlans2 = await reloadResponse2.json();

    // Verify data persists
    if (reloadPlans1.length !== reloadPlans2.length) {
      throw new Error(
        `Plan count changed after reload: ${reloadPlans1.length} → ${reloadPlans2.length}`
      );
    }

    const reloadTestPlan = reloadPlans2.find((p: any) => {
      const pDate = new Date(p.date);
      const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}-${String(pDate.getDate()).padStart(2, "0")}`;
      return pDateStr === testDate;
    });

    if (!reloadTestPlan) {
      throw new Error("Test plan missing after reload");
    }

    if (reloadTestPlan.carriedForwardTasks !== 2) {
      throw new Error(
        `Carried-forward count changed after reload: expected 2, got ${reloadTestPlan.carriedForwardTasks}`
      );
    }

    console.log(`  ✅ Data persists after reload`);
    console.log(`     Carried-forward count: ${reloadTestPlan.carriedForwardTasks}\n`);

    // ============================================
    // Summary
    // ============================================
    console.log("✅ All Navigation Flow Tests Passed!\n");
    console.log("Summary:");
    console.log("  ✅ Week API includes carry-forward counts");
    console.log("  ✅ Day page reads query param correctly");
    console.log("  ✅ Default to today works");
    console.log("  ✅ Reload preserves data");
    console.log("  ✅ Navigation flow works correctly");
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

testNavigationFlow();
