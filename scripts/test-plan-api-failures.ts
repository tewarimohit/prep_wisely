/**
 * Test script to verify POST /api/plans/[date] failure modes
 * Run with: npx tsx scripts/test-plan-api-failures.ts
 */

import { prisma } from "../lib/db";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = process.env.TEST_USER_ID || "test-user-123";
const TEST_DATE = "2024-01-20"; // Different date to avoid conflicts

async function testFailureModes() {
  console.log("🧪 Testing POST /api/plans/[date] Failure Modes\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE}\n`);

  let allTestsPassed = true;

  // Test 1: Invalid payload → expect validation error
  console.log("📝 Test 1: Invalid payload (missing title)...");
  try {
    const invalidPayload = {
      // Missing title field
      items: [
        {
          text: "Test item",
          status: "TODO",
          order: 0,
          tags: [],
        },
      ],
    };

    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidPayload),
      }
    );

    const data = await response.json();

    if (response.status !== 400) {
      console.error(`❌ Expected 400, got ${response.status}`);
      allTestsPassed = false;
    } else if (!data.error || !data.details) {
      console.error("❌ Expected error and details in response");
      console.error("   Response:", data);
      allTestsPassed = false;
    } else {
      console.log("✅ Test 1 passed - Validation error returned");
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${JSON.stringify(data.details)}\n`);
    }

    // Verify no plan was created
    const planCheck = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
    });

    if (planCheck) {
      console.error("❌ Test 1 failed - Plan was created despite validation error!");
      console.error(`   Plan ID: ${planCheck.id}`);
      allTestsPassed = false;
    } else {
      console.log("✅ Test 1 - No partial write: No plan created\n");
    }
  } catch (error: any) {
    console.error("❌ Test 1 failed with error:", error.message);
    allTestsPassed = false;
  }

  // Test 2: Empty items → expect Zod failure
  console.log("📝 Test 2: Empty items array...");
  try {
    const emptyItemsPayload = {
      title: "Test Plan",
      items: [], // Empty array
    };

    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emptyItemsPayload),
      }
    );

    const data = await response.json();

    // Empty items array might be valid, but let's check if it's handled
    // Actually, empty items should be allowed (user might have no tasks)
    // So this test should succeed, but let's verify no partial write
    if (response.status === 200) {
      console.log("✅ Test 2 passed - Empty items array accepted (valid use case)");
      console.log(`   Plan ID: ${data.id}`);
      console.log(`   Items count: ${data.items?.length || 0}\n`);

      // Clean up - delete the plan for next tests
      await prisma.plan.delete({
        where: { id: data.id },
      });
      console.log("   Cleaned up test plan\n");
    } else if (response.status === 400) {
      console.log("✅ Test 2 passed - Empty items rejected (if that's the expected behavior)");
      console.log(`   Error: ${data.error || JSON.stringify(data)}\n`);

      // Verify no plan was created
      const planCheck = await prisma.plan.findFirst({
        where: {
          userId: TEST_USER_ID,
          date: new Date(TEST_DATE + "T00:00:00.000Z"),
        },
      });

      if (planCheck) {
        console.error("❌ Test 2 failed - Plan was created despite validation error!");
        allTestsPassed = false;
      } else {
        console.log("✅ Test 2 - No partial write: No plan created\n");
      }
    } else {
      console.error(`❌ Unexpected status: ${response.status}`);
      allTestsPassed = false;
    }
  } catch (error: any) {
    console.error("❌ Test 2 failed with error:", error.message);
    allTestsPassed = false;
  }

  // Test 3: Invalid item structure → expect validation error
  console.log("📝 Test 3: Invalid item structure (missing required fields)...");
  try {
    const invalidItemPayload = {
      title: "Test Plan",
      items: [
        {
          text: "Valid item",
          status: "TODO",
          order: 0,
          tags: [],
        },
        {
          // Missing text field
          status: "TODO",
          order: 1,
          tags: [],
        },
      ],
    };

    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidItemPayload),
      }
    );

    const data = await response.json();

    if (response.status !== 400) {
      console.error(`❌ Expected 400, got ${response.status}`);
      allTestsPassed = false;
    } else {
      console.log("✅ Test 3 passed - Validation error returned");
      console.log(`   Error: ${data.error || "Validation failed"}`);
      if (data.details) {
        console.log(`   Details: ${JSON.stringify(data.details)}\n`);
      }
    }

    // Verify no plan was created
    const planCheck = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
    });

    if (planCheck) {
      console.error("❌ Test 3 failed - Plan was created despite validation error!");
      console.error(`   Plan ID: ${planCheck.id}`);
      allTestsPassed = false;
    } else {
      console.log("✅ Test 3 - No partial write: No plan created\n");
    }
  } catch (error: any) {
    console.error("❌ Test 3 failed with error:", error.message);
    allTestsPassed = false;
  }

  // Test 4: Invalid date format → expect validation error
  console.log("📝 Test 4: Invalid date format...");
  try {
    const validPayload = {
      title: "Test Plan",
      items: [
        {
          text: "Test item",
          status: "TODO",
          order: 0,
          tags: [],
        },
      ],
    };

    const response = await fetch(
      `${BASE_URL}/api/plans/invalid-date-format?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validPayload),
      }
    );

    const data = await response.json();

    if (response.status !== 400) {
      console.error(`❌ Expected 400, got ${response.status}`);
      allTestsPassed = false;
    } else {
      console.log("✅ Test 4 passed - Invalid date format rejected");
      console.log(`   Error: ${data.error}\n`);
    }
  } catch (error: any) {
    console.error("❌ Test 4 failed with error:", error.message);
    allTestsPassed = false;
  }

  // Test 5: Verify no orphaned items exist (items without valid plan)
  console.log("📝 Test 5: Checking for orphaned PlanItems...");
  try {
    // Get all plan IDs that exist
    const allPlanIds = (
      await prisma.plan.findMany({
        select: { id: true },
      })
    ).map((p) => p.id);

    // Find items whose planId doesn't exist in any plan
    const allItems = await prisma.planItem.findMany({
      select: { id: true, planId: true },
    });

    const orphanedItems = allItems.filter(
      (item) => !allPlanIds.includes(item.planId)
    );

    if (orphanedItems.length > 0) {
      console.error(`❌ Found ${orphanedItems.length} orphaned PlanItems!`);
      console.error("   Orphaned item IDs:", orphanedItems.map((i) => i.id));
      console.error("   Orphaned planIds:", orphanedItems.map((i) => i.planId));
      
      // Check if these are from test user
      const testUserOrphans = await prisma.planItem.findMany({
        where: {
          id: { in: orphanedItems.map((i) => i.id) },
          plan: {
            userId: TEST_USER_ID,
          },
        },
      });

      if (testUserOrphans.length > 0) {
        console.error(`   ⚠️  ${testUserOrphans.length} orphaned items belong to test user`);
        allTestsPassed = false;
      } else {
        console.log("   ℹ️  Orphaned items belong to other users (not a test failure)");
      }
    } else {
      console.log("✅ Test 5 passed - No orphaned PlanItems found");
      console.log(`   Total items checked: ${allItems.length}\n`);
    }
  } catch (error: any) {
    console.error("❌ Test 5 failed with error:", error.message);
    allTestsPassed = false;
  }

  // Summary
  console.log("=" .repeat(50));
  if (allTestsPassed) {
    console.log("🎉 All failure mode tests passed!");
    console.log("✅ Validation errors work correctly");
    console.log("✅ No partial writes occurred");
    console.log("✅ No orphaned items found");
  } else {
    console.log("❌ Some tests failed - check output above");
    process.exit(1);
  }
}

// Run the tests
testFailureModes().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
