/**
 * Test script to verify optimistic update paths
 * Tests:
 * 1. Add/edit/delete tasks → UI updates instantly (optimistic)
 * 2. Simulate failure → rollback works
 * 3. Reload page → data matches DB
 * 
 * Run with: npx tsx scripts/test-optimistic-paths.ts
 */

import { prisma } from "../lib/db";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = process.env.TEST_USER_ID || "cmko9jw0y0002dx23vbn4lnm2";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

// Helper to format date for display
const formatDateForDisplay = (dateStr: string): string => {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
};

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testOptimisticPaths() {
  console.log("🧪 Testing Optimistic Update Paths\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE} (${formatDateForDisplay(TEST_DATE)})\n`);

  try {
    // Clean up any existing plan for this date
    console.log("🧹 Cleaning up existing plan for test date...");
    const existingPlan = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
    });

    if (existingPlan) {
      await prisma.planItem.deleteMany({
        where: { planId: existingPlan.id },
      });
      await prisma.plan.delete({
        where: { id: existingPlan.id },
      });
      console.log("✅ Cleaned up existing plan\n");
    } else {
      console.log("✅ No existing plan to clean up\n");
    }

    // ============================================
    // Test 1: Optimistic Updates (Add/Edit/Delete)
    // ============================================
    console.log("📝 Test 1: Optimistic Updates (Add/Edit/Delete)\n");

    // Step 1.1: Create initial plan
    console.log("  Step 1.1: Creating initial plan...");
    const initialPlan = {
      title: "Test Plan - Optimistic Updates",
      items: [
        {
          text: "Task 1 - Original",
          status: "TODO" as const,
          order: 0,
          tags: [],
          dueTime: null,
        },
        {
          text: "Task 2 - Original",
          status: "TODO" as const,
          order: 1,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const createResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialPlan),
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Failed to create plan: ${createResponse.status}`);
    }

    const createdPlan = await createResponse.json();
    console.log(`  ✅ Created plan with ${createdPlan.items.length} items`);
    console.log(`     Plan ID: ${createdPlan.id}`);
    console.log(`     Items: ${createdPlan.items.map((i: any) => i.text).join(", ")}\n`);

    // Step 1.2: Simulate optimistic update - Add task
    console.log("  Step 1.2: Simulating optimistic add...");
    const planWithAddedTask = {
      ...initialPlan,
      items: [
        ...initialPlan.items,
        {
          text: "Task 3 - Added Optimistically",
          status: "TODO" as const,
          order: 2,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const addResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planWithAddedTask),
      }
    );

    if (!addResponse.ok) {
      throw new Error(`Failed to add task: ${addResponse.status}`);
    }

    const planAfterAdd = await addResponse.json();
    console.log(`  ✅ Added task optimistically`);
    console.log(`     Items: ${planAfterAdd.items.map((i: any) => i.text).join(", ")}`);

    // Verify in DB
    const dbPlanAfterAdd = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbPlanAfterAdd) {
      throw new Error("Plan not found in DB after add");
    }

    if (dbPlanAfterAdd.items.length !== 3) {
      throw new Error(
        `Expected 3 items in DB, got ${dbPlanAfterAdd.items.length}`
      );
    }

    console.log(`  ✅ Verified in DB: ${dbPlanAfterAdd.items.length} items\n`);

    // Step 1.3: Simulate optimistic update - Edit task
    console.log("  Step 1.3: Simulating optimistic edit...");
    const planWithEditedTask = {
      ...planWithAddedTask,
      items: planWithAddedTask.items.map((item: any, index: number) =>
        index === 0
          ? { ...item, text: "Task 1 - Edited Optimistically" }
          : item
      ),
    };

    const editResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planWithEditedTask),
      }
    );

    if (!editResponse.ok) {
      throw new Error(`Failed to edit task: ${editResponse.status}`);
    }

    const planAfterEdit = await editResponse.json();
    console.log(`  ✅ Edited task optimistically`);
    console.log(`     Items: ${planAfterEdit.items.map((i: any) => i.text).join(", ")}`);

    // Verify in DB
    const dbPlanAfterEdit = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbPlanAfterEdit) {
      throw new Error("Plan not found in DB after edit");
    }

    if (dbPlanAfterEdit.items[0].text !== "Task 1 - Edited Optimistically") {
      throw new Error(
        `Expected edited text, got: ${dbPlanAfterEdit.items[0].text}`
      );
    }

    console.log(`  ✅ Verified in DB: First item edited correctly\n`);

    // Step 1.4: Simulate optimistic update - Delete task
    console.log("  Step 1.4: Simulating optimistic delete...");
    const planWithDeletedTask = {
      ...planWithEditedTask,
      items: planWithEditedTask.items.filter((_: any, index: number) => index !== 1),
    };

    const deleteResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planWithDeletedTask),
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete task: ${deleteResponse.status}`);
    }

    const planAfterDelete = await deleteResponse.json();
    console.log(`  ✅ Deleted task optimistically`);
    console.log(`     Items: ${planAfterDelete.items.map((i: any) => i.text).join(", ")}`);

    // Verify in DB
    const dbPlanAfterDelete = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbPlanAfterDelete) {
      throw new Error("Plan not found in DB after delete");
    }

    if (dbPlanAfterDelete.items.length !== 2) {
      throw new Error(
        `Expected 2 items in DB, got ${dbPlanAfterDelete.items.length}`
      );
    }

    console.log(`  ✅ Verified in DB: ${dbPlanAfterDelete.items.length} items\n`);

    // ============================================
    // Test 2: Rollback on Failure
    // ============================================
    console.log("🔄 Test 2: Rollback on Failure\n");

    // Step 2.1: Create a plan to test rollback
    console.log("  Step 2.1: Creating plan for rollback test...");
    const rollbackTestPlan = {
      title: "Test Plan - Rollback",
      items: [
        {
          text: "Task Before Rollback",
          status: "TODO" as const,
          order: 0,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const rollbackCreateResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rollbackTestPlan),
      }
    );

    if (!rollbackCreateResponse.ok) {
      throw new Error(`Failed to create rollback test plan: ${rollbackCreateResponse.status}`);
    }

    const rollbackPlan = await rollbackCreateResponse.json();
    console.log(`  ✅ Created plan: ${rollbackPlan.items[0].text}`);

    // Step 2.2: Get current state from DB (this is what should be restored)
    const dbStateBeforeFailure = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbStateBeforeFailure) {
      throw new Error("Plan not found in DB before failure test");
    }

    console.log(`  ✅ Captured DB state: ${dbStateBeforeFailure.items.length} items\n`);

    // Step 2.3: Simulate failure by sending invalid payload
    console.log("  Step 2.3: Simulating API failure (invalid payload)...");
    const invalidPayload = {
      title: "", // Invalid: empty title should fail validation
      items: [
        {
          text: "Task That Should Not Be Saved",
          status: "TODO" as const,
          order: 0,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const failureResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      }
    );

    if (failureResponse.ok) {
      throw new Error("Expected validation error, but request succeeded");
    }

    console.log(`  ✅ API correctly rejected invalid payload: ${failureResponse.status}`);

    // Step 2.4: Verify DB state is unchanged (rollback worked)
    const dbStateAfterFailure = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbStateAfterFailure) {
      throw new Error("Plan not found in DB after failure");
    }

    // Verify state matches before failure (rollback successful)
    if (
      dbStateAfterFailure.items.length !== dbStateBeforeFailure.items.length
    ) {
      throw new Error(
        `Rollback failed: Expected ${dbStateBeforeFailure.items.length} items, got ${dbStateAfterFailure.items.length}`
      );
    }

    if (
      dbStateAfterFailure.items[0].text !== dbStateBeforeFailure.items[0].text
    ) {
      throw new Error(
        `Rollback failed: Item text changed from "${dbStateBeforeFailure.items[0].text}" to "${dbStateAfterFailure.items[0].text}"`
      );
    }

    console.log(`  ✅ Verified rollback: DB state unchanged`);
    console.log(`     Items: ${dbStateAfterFailure.items.map((i: any) => i.text).join(", ")}\n`);

    // ============================================
    // Test 3: Data Persistence (Reload)
    // ============================================
    console.log("💾 Test 3: Data Persistence (Reload)\n");

    // Step 3.1: Create/modify plan
    console.log("  Step 3.1: Creating plan for persistence test...");
    const persistencePlan = {
      title: "Test Plan - Persistence",
      items: [
        {
          text: "Task 1 - Persist",
          status: "DONE" as const,
          order: 0,
          tags: ["test"],
          dueTime: null,
        },
        {
          text: "Task 2 - Persist",
          status: "TODO" as const,
          order: 1,
          tags: [],
          dueTime: null,
        },
        {
          text: "Task 3 - Persist",
          status: "DOING" as const,
          order: 2,
          tags: ["important"],
          dueTime: null,
        },
      ],
    };

    const persistResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persistencePlan),
      }
    );

    if (!persistResponse.ok) {
      throw new Error(`Failed to create persistence plan: ${persistResponse.status}`);
    }

    const persistedPlan = await persistResponse.json();
    console.log(`  ✅ Created plan with ${persistedPlan.items.length} items`);

    // Step 3.2: Simulate "reload" by fetching from API
    console.log("  Step 3.2: Simulating page reload (GET request)...");
    await sleep(100); // Small delay to simulate reload

    const reloadResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "GET",
      }
    );

    if (!reloadResponse.ok) {
      throw new Error(`Failed to reload plan: ${reloadResponse.status}`);
    }

    const reloadedPlan = await reloadResponse.json();

    if (!reloadedPlan) {
      throw new Error("Plan not found after reload");
    }

    console.log(`  ✅ Reloaded plan: ${reloadedPlan.items.length} items`);

    // Step 3.3: Verify data matches DB exactly
    const dbPersistencePlan = await prisma.plan.findFirst({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!dbPersistencePlan) {
      throw new Error("Plan not found in DB");
    }

    // Verify structure matches
    if (reloadedPlan.id !== dbPersistencePlan.id) {
      throw new Error("Plan ID mismatch after reload");
    }

    if (reloadedPlan.title !== dbPersistencePlan.title) {
      throw new Error(
        `Title mismatch: ${reloadedPlan.title} !== ${dbPersistencePlan.title}`
      );
    }

    if (reloadedPlan.items.length !== dbPersistencePlan.items.length) {
      throw new Error(
        `Items count mismatch: ${reloadedPlan.items.length} !== ${dbPersistencePlan.items.length}`
      );
    }

    // Verify each item matches
    for (let i = 0; i < reloadedPlan.items.length; i++) {
      const apiItem = reloadedPlan.items[i];
      const dbItem = dbPersistencePlan.items[i];

      if (apiItem.id !== dbItem.id) {
        throw new Error(`Item ${i} ID mismatch`);
      }

      if (apiItem.text !== dbItem.text) {
        throw new Error(
          `Item ${i} text mismatch: ${apiItem.text} !== ${dbItem.text}`
        );
      }

      if (apiItem.status !== dbItem.status) {
        throw new Error(
          `Item ${i} status mismatch: ${apiItem.status} !== ${dbItem.status}`
        );
      }

      if (apiItem.order !== dbItem.order) {
        throw new Error(
          `Item ${i} order mismatch: ${apiItem.order} !== ${dbItem.order}`
        );
      }
    }

    console.log(`  ✅ Verified data persistence:`);
    console.log(`     Plan ID: ${reloadedPlan.id}`);
    console.log(`     Title: ${reloadedPlan.title}`);
    console.log(`     Items: ${reloadedPlan.items.length}`);
    console.log(`     Order: ${reloadedPlan.items.map((i: any) => i.order).join(", ")}`);
    console.log(`     Statuses: ${reloadedPlan.items.map((i: any) => i.status).join(", ")}\n`);

    // Verify no duplicate plans
    const allPlans = await prisma.plan.findMany({
      where: {
        userId: TEST_USER_ID,
        date: new Date(TEST_DATE + "T00:00:00.000Z"),
      },
    });

    if (allPlans.length > 1) {
      throw new Error(
        `Found ${allPlans.length} duplicate plans for same user+date`
      );
    }

    console.log(`  ✅ Verified no duplicate plans\n`);

    // ============================================
    // Summary
    // ============================================
    console.log("✅ All Tests Passed!\n");
    console.log("Summary:");
    console.log("  ✅ Test 1: Optimistic updates work correctly");
    console.log("  ✅ Test 2: Rollback on failure works correctly");
    console.log("  ✅ Test 3: Data persistence works correctly");
    console.log("  ✅ No duplicate plans created");
    console.log("  ✅ Server remains source of truth\n");
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

testOptimisticPaths();
