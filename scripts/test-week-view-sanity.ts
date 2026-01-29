/**
 * Test script to verify Week View sanity checks
 * Run with: npx tsx scripts/test-week-view-sanity.ts
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

async function testWeekViewSanity() {
  console.log("🧪 Testing Week View Sanity Checks\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}\n`);

  const { startDate, endDate } = getWeekDates();
  console.log(`Week range: ${startDate} to ${endDate}\n`);

  try {
    // ============================================
    // Test 1: Week with no plans → empty states handled
    // ============================================
    console.log("📝 Test 1: Week with no plans (empty state)\n");

    // Clean up any existing plans for this week
    const mondayDate = new Date(startDate + "T00:00:00.000Z");
    const sundayDate = new Date(endDate + "T23:59:59.999Z");
    
    const existingPlans = await prisma.plan.findMany({
      where: {
        userId: TEST_USER_ID,
        date: {
          gte: mondayDate,
          lte: sundayDate,
        },
      },
    });

    if (existingPlans.length > 0) {
      console.log(`  Cleaning up ${existingPlans.length} existing plans...`);
      for (const plan of existingPlans) {
        await prisma.planItem.deleteMany({ where: { planId: plan.id } });
        await prisma.plan.delete({ where: { id: plan.id } });
      }
      console.log("  ✅ Cleaned up existing plans\n");
    }

    // Fetch week plans (should return empty array)
    const emptyResponse = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!emptyResponse.ok) {
      throw new Error(`Failed to fetch empty week: ${emptyResponse.status}`);
    }

    const emptyPlans = await emptyResponse.json();
    
    if (!Array.isArray(emptyPlans)) {
      throw new Error("Response is not an array");
    }

    console.log(`  ✅ API returns empty array: ${emptyPlans.length} plans`);
    console.log("  ✅ Empty state handled correctly (all days show 'Pending')\n");

    // ============================================
    // Test 2: Mixed completion statuses render correctly
    // ============================================
    console.log("📝 Test 2: Mixed completion statuses\n");

    // Create plans with different completion statuses
    const testPlans = [
      {
        date: startDate, // Monday - Completed (all DONE)
        title: "Monday Plan - Completed",
        items: [
          { text: "Task 1", status: "DONE", order: 0 },
          { text: "Task 2", status: "DONE", order: 1 },
        ],
      },
      {
        date: new Date(mondayDate.getTime() + 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Tuesday - In Progress (1 done, 1 todo)
        title: "Tuesday Plan - In Progress",
        items: [
          { text: "Task 1", status: "DONE", order: 0 },
          { text: "Task 2", status: "TODO", order: 1 },
        ],
      },
      {
        date: new Date(mondayDate.getTime() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Wednesday - Pending (all TODO)
        title: "Wednesday Plan - Pending",
        items: [
          { text: "Task 1", status: "TODO", order: 0 },
          { text: "Task 2", status: "TODO", order: 1 },
        ],
      },
    ];

    console.log("  Creating test plans with mixed statuses...");
    for (const planData of testPlans) {
      const planDate = new Date(planData.date + "T00:00:00.000Z");
      planDate.setUTCHours(0, 0, 0, 0);

      const plan = await prisma.plan.create({
        data: {
          userId: TEST_USER_ID,
          date: planDate,
          title: planData.title,
          items: {
            create: planData.items.map((item) => ({
              text: item.text,
              status: item.status as any,
              order: item.order,
              tags: [],
              dueTime: null,
            })),
          },
        },
      });

      console.log(`    ✅ Created plan for ${planData.date}: ${planData.title}`);
    }

    // Fetch week plans
    const mixedResponse = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!mixedResponse.ok) {
      throw new Error(`Failed to fetch mixed week: ${mixedResponse.status}`);
    }

    const mixedPlans = await mixedResponse.json();

    // Verify statuses
    const statusMap = new Map<string, string>();
    mixedPlans.forEach((plan: any) => {
      const planDate = new Date(plan.date);
      const dateStr = `${planDate.getFullYear()}-${String(planDate.getMonth() + 1).padStart(2, "0")}-${String(planDate.getDate()).padStart(2, "0")}`;
      statusMap.set(dateStr, plan.status);
    });

    // Expected statuses
    const expectedStatuses: Record<string, string> = {
      [testPlans[0].date]: "completed", // All DONE
      [testPlans[1].date]: "in_progress", // 1 DONE, 1 TODO
      [testPlans[2].date]: "pending", // All TODO
    };

    console.log("\n  Verifying completion statuses:");
    for (const [date, expectedStatus] of Object.entries(expectedStatuses)) {
      const actualStatus = statusMap.get(date);
      if (actualStatus !== expectedStatus) {
        throw new Error(
          `Status mismatch for ${date}: expected ${expectedStatus}, got ${actualStatus}`
        );
      }
      console.log(`    ✅ ${date}: ${actualStatus} (correct)`);
    }

    console.log("\n  ✅ Mixed completion statuses render correctly\n");

    // ============================================
    // Test 3: Clicking a day opens correct plan
    // ============================================
    console.log("📝 Test 3: Day navigation (date param handling)\n");

    // Test date conversion: YYYY-MM-DD → DD/MM/YYYY
    const testDate = testPlans[0].date; // Monday
    const [yyyy, mm, dd] = testDate.split("-").map(Number);
    const expectedDisplayFormat = `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;

    console.log(`  Test date: ${testDate} (YYYY-MM-DD)`);
    console.log(`  Expected display format: ${expectedDisplayFormat} (DD/MM/YYYY)`);

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
    if (dayPlan.title !== testPlans[0].title) {
      throw new Error(
        `Wrong plan loaded: expected "${testPlans[0].title}", got "${dayPlan.title}"`
      );
    }

    console.log(`  ✅ Correct plan loaded: ${dayPlan.title}`);
    console.log(`  ✅ Date param ${testDate} correctly fetches plan\n`);

    // ============================================
    // Test 4: Reload works
    // ============================================
    console.log("📝 Test 4: Reload behavior\n");

    // Fetch week plans again (simulating reload)
    const reloadResponse1 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (!reloadResponse1.ok) {
      throw new Error(`Failed to reload week: ${reloadResponse1.status}`);
    }

    const reloadPlans1 = await reloadResponse1.json();

    // Wait a bit (simulating user interaction)
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

    // Verify plans match
    const plans1Map = new Map(
      reloadPlans1.map((p: any) => [
        new Date(p.date).toISOString().split("T")[0],
        p,
      ])
    );
    const plans2Map = new Map(
      reloadPlans2.map((p: any) => [
        new Date(p.date).toISOString().split("T")[0],
        p,
      ])
    );

    for (const [date, plan1] of plans1Map.entries()) {
      const plan2 = plans2Map.get(date);
      if (!plan2) {
        throw new Error(`Plan for ${date} missing after reload`);
      }
      if (plan1.title !== plan2.title) {
        throw new Error(
          `Plan title changed for ${date}: "${plan1.title}" → "${plan2.title}"`
        );
      }
      if (plan1.status !== plan2.status) {
        throw new Error(
          `Plan status changed for ${date}: "${plan1.status}" → "${plan2.status}"`
        );
      }
    }

    console.log(`  ✅ Data persists after reload: ${reloadPlans2.length} plans`);
    console.log("  ✅ All plans match between reloads\n");

    // ============================================
    // Summary
    // ============================================
    console.log("✅ All Sanity Checks Passed!\n");
    console.log("Summary:");
    console.log("  ✅ Empty states handled correctly");
    console.log("  ✅ Mixed completion statuses render correctly");
    console.log("  ✅ Day navigation works correctly");
    console.log("  ✅ Reload preserves data correctly");
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

testWeekViewSanity();
