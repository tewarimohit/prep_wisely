/**
 * Test script to validate full reload behavior
 * Simulates: create plan → modify tasks → reload → verify persistence
 * Run with: npx tsx scripts/test-reload-behavior.ts
 */

import { prisma } from "../lib/db";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

// Convert YYYY-MM-DD to DD/MM/YYYY for display
const formatDateForDisplay = (dateStr: string): string => {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
};

async function testReloadBehavior() {
  console.log("🧪 Testing Full Reload Behavior\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE} (${formatDateForDisplay(TEST_DATE)})\n`);

  try {
    // Step 1: Create a new plan for today
    console.log("📝 Step 1: Creating a new plan for today...");
    const initialPlan = {
      title: "Test Plan - Reload Validation",
      items: [
        {
          text: "Task 1 - Initial",
          status: "TODO",
          order: 0,
          tags: [],
          dueTime: null,
        },
        {
          text: "Task 2 - Initial",
          status: "TODO",
          order: 1,
          tags: [],
          dueTime: null,
        },
        {
          text: "Task 3 - Initial",
          status: "TODO",
          order: 2,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const createResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initialPlan),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new Error(
        `Failed to create plan: ${createResponse.status} - ${JSON.stringify(errorData)}`
      );
    }

    const createdPlan = await createResponse.json();
    console.log("✅ Plan created successfully!");
    console.log(`   Plan ID: ${createdPlan.id}`);
    console.log(`   Items count: ${createdPlan.items.length}`);
    console.log(`   Item IDs: ${createdPlan.items.map((i: any) => i.id).join(", ")}\n`);

    const initialItemIds = createdPlan.items.map((i: any) => i.id);
    const initialOrder = createdPlan.items.map((i: any) => i.order);

    // Step 2: Modify tasks (add, edit, toggle, delete)
    console.log("📝 Step 2: Modifying tasks...");

    // 2a. Add a new task
    console.log("   → Adding new task...");
    const planWithNewTask = {
      title: createdPlan.title,
      items: [
        ...createdPlan.items,
        {
          text: "Task 4 - Added",
          status: "TODO",
          order: 3,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const addResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planWithNewTask),
      }
    );

    const planAfterAdd = await addResponse.json();
    console.log(`   ✅ Added task. Total items: ${planAfterAdd.items.length}`);

    // 2b. Edit a task (Task 2)
    console.log("   → Editing Task 2...");
    const planAfterEdit = {
      title: planAfterAdd.title,
      items: planAfterAdd.items.map((item: any) =>
        item.order === 1
          ? { ...item, text: "Task 2 - Edited" }
          : item
      ),
    };

    const editResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planAfterEdit),
      }
    );

    const planAfterEditResult = await editResponse.json();
    const editedTask = planAfterEditResult.items.find((i: any) => i.order === 1);
    console.log(`   ✅ Edited task. Text: "${editedTask.text}"`);

    // 2c. Toggle a task (Task 1 - mark as DONE)
    console.log("   → Toggling Task 1 to DONE...");
    const planAfterToggle = {
      title: planAfterEditResult.title,
      items: planAfterEditResult.items.map((item: any) =>
        item.order === 0
          ? { ...item, status: "DONE" }
          : item
      ),
    };

    const toggleResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planAfterToggle),
      }
    );

    const planAfterToggleResult = await toggleResponse.json();
    const toggledTask = planAfterToggleResult.items.find((i: any) => i.order === 0);
    console.log(`   ✅ Toggled task. Status: ${toggledTask.status}`);

    // 2d. Delete a task (Task 3)
    console.log("   → Deleting Task 3...");
    const planAfterDelete = {
      title: planAfterToggleResult.title,
      items: planAfterToggleResult.items.filter((item: any) => item.order !== 2),
    };

    const deleteResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planAfterDelete),
      }
    );

    const planAfterDeleteResult = await deleteResponse.json();
    console.log(`   ✅ Deleted task. Remaining items: ${planAfterDeleteResult.items.length}\n`);

    // Step 3: Simulate page refresh (GET request)
    console.log("📝 Step 3: Simulating page refresh (GET request)...");
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
      throw new Error("Plan not found after reload!");
    }

    console.log("✅ Plan reloaded successfully!");
    console.log(`   Plan ID: ${reloadedPlan.id}`);
    console.log(`   Title: ${reloadedPlan.title}`);
    console.log(`   Items count: ${reloadedPlan.items.length}\n`);

    // Step 4: Verify all conditions
    console.log("📝 Step 4: Verifying conditions...\n");

    // 4a. Data persists correctly
    console.log("   ✓ Checking data persistence...");
    if (reloadedPlan.id !== createdPlan.id) {
      throw new Error(
        `Plan ID changed! Expected ${createdPlan.id}, got ${reloadedPlan.id}`
      );
    }
    console.log("   ✅ Plan ID matches (same plan persisted)");

    if (reloadedPlan.items.length !== 3) {
      throw new Error(
        `Item count mismatch! Expected 3, got ${reloadedPlan.items.length}`
      );
    }
    console.log("   ✅ Item count matches (3 items as expected)");

    // Verify edited task
    const reloadedEditedTask = reloadedPlan.items.find((i: any) => i.order === 1);
    if (reloadedEditedTask.text !== "Task 2 - Edited") {
      throw new Error(
        `Edit not persisted! Expected "Task 2 - Edited", got "${reloadedEditedTask.text}"`
      );
    }
    console.log("   ✅ Task edit persisted correctly");

    // Verify toggled task
    const reloadedToggledTask = reloadedPlan.items.find((i: any) => i.order === 0);
    if (reloadedToggledTask.status !== "DONE") {
      throw new Error(
        `Toggle not persisted! Expected "DONE", got "${reloadedToggledTask.status}"`
      );
    }
    console.log("   ✅ Task toggle persisted correctly");

    // Verify deleted task is gone
    const deletedTaskStillExists = reloadedPlan.items.some(
      (i: any) => i.text === "Task 3 - Initial"
    );
    if (deletedTaskStillExists) {
      throw new Error("Deleted task still exists!");
    }
    console.log("   ✅ Task deletion persisted correctly");

    // Verify new task exists
    const newTaskExists = reloadedPlan.items.some((i: any) => i.text === "Task 4 - Added");
    if (!newTaskExists) {
      throw new Error("Newly added task not found!");
    }
    console.log("   ✅ New task persisted correctly\n");

    // 4b. Task order is preserved
    console.log("   ✓ Checking task order preservation...");
    const reloadedOrder = reloadedPlan.items.map((i: any) => i.order);
    const expectedOrder = [0, 1, 3]; // Task 2 (order 2) was deleted

    if (JSON.stringify(reloadedOrder) !== JSON.stringify(expectedOrder)) {
      throw new Error(
        `Order mismatch! Expected [${expectedOrder.join(", ")}], got [${reloadedOrder.join(", ")}]`
      );
    }

    // Verify items are returned in order
    const itemsInOrder = reloadedPlan.items.every(
      (item: any, index: number) => item.order === index || item.order === expectedOrder[index]
    );

    // Check if items array is sorted by order
    const sortedByOrder = reloadedPlan.items
      .map((i: any) => i.order)
      .every((order: number, index: number, arr: number[]) => {
        return index === 0 || arr[index - 1] < order;
      });

    if (!sortedByOrder) {
      throw new Error("Items are not sorted by order field!");
    }

    console.log("   ✅ Task order preserved correctly");
    console.log(`   Order values: [${reloadedOrder.join(", ")}]`);
    console.log(`   Items sorted: Yes\n`);

    // 4c. No duplicate plans
    console.log("   ✓ Checking for duplicate plans...");
    const allPlans = await prisma.plan.findMany({
      where: {
        userId: TEST_USER_ID,
        date: {
          gte: new Date(TEST_DATE + "T00:00:00.000Z"),
          lt: new Date(
            new Date(TEST_DATE + "T00:00:00.000Z").getTime() + 24 * 60 * 60 * 1000
          ),
        },
      },
    });

    if (allPlans.length > 1) {
      throw new Error(
        `Found ${allPlans.length} plans for the same date! Expected 1.`
      );
    }

    if (allPlans.length === 0) {
      throw new Error("No plan found in database!");
    }

    if (allPlans[0].id !== createdPlan.id) {
      throw new Error("Plan ID in database doesn't match!");
    }

    console.log("   ✅ No duplicate plans found");
    console.log(`   Plans for date: ${allPlans.length}`);
    console.log(`   Plan ID: ${allPlans[0].id}\n`);

    // Summary
    console.log("=" .repeat(60));
    console.log("🎉 All reload behavior tests passed!");
    console.log("✅ Data persists correctly");
    console.log("✅ Task order is preserved");
    console.log("✅ No duplicate plans created");
    console.log("=" .repeat(60));
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testReloadBehavior();
