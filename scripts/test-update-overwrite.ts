/**
 * Test script to validate update-overwrite scenario
 * Ensures updates don't create duplicates and items are replaced cleanly
 * Run with: npx tsx scripts/test-update-overwrite.ts
 */

import { prisma } from "../lib/db";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

async function testUpdateOverwrite() {
  console.log("🧪 Testing Update-Overwrite Scenario\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE}\n`);

  try {
    // Step 1: Create initial plan
    console.log("📝 Step 1: Creating initial plan...");
    const initialPlan = {
      title: "Initial Plan",
      items: [
        {
          text: "Item A",
          status: "TODO",
          order: 0,
          tags: [],
          dueTime: null,
        },
        {
          text: "Item B",
          status: "TODO",
          order: 1,
          tags: [],
          dueTime: null,
        },
        {
          text: "Item C",
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
      throw new Error(`Failed to create plan: ${createResponse.status} - ${errorText}`);
    }

    const createdPlan = await createResponse.json();
    const initialPlanId = createdPlan.id;
    const initialItemIds = createdPlan.items.map((i: any) => i.id);
    const initialItemCount = createdPlan.items.length;

    console.log("✅ Initial plan created!");
    console.log(`   Plan ID: ${initialPlanId}`);
    console.log(`   Items: ${initialItemCount}`);
    console.log(`   Item IDs: ${initialItemIds.join(", ")}\n`);

    // Step 2: Modify the plan (first update)
    console.log("📝 Step 2: First modification (update)...");
    const firstUpdate = {
      title: "Updated Plan - First",
      items: [
        {
          text: "Item X",
          status: "DONE",
          order: 0,
          tags: [],
          dueTime: null,
        },
        {
          text: "Item Y",
          status: "TODO",
          order: 1,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const firstUpdateResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(firstUpdate),
      }
    );

    if (!firstUpdateResponse.ok) {
      const errorText = await firstUpdateResponse.text();
      throw new Error(`Failed to update plan: ${firstUpdateResponse.status} - ${errorText}`);
    }

    const planAfterFirstUpdate = await firstUpdateResponse.json();
    const firstUpdateItemIds = planAfterFirstUpdate.items.map((i: any) => i.id);
    const firstUpdateItemCount = planAfterFirstUpdate.items.length;

    console.log("✅ First update completed!");
    console.log(`   Plan ID: ${planAfterFirstUpdate.id}`);
    console.log(`   Items: ${firstUpdateItemCount}`);
    console.log(`   Item IDs: ${firstUpdateItemIds.join(", ")}\n`);

    // Verify same plan ID
    if (planAfterFirstUpdate.id !== initialPlanId) {
      throw new Error(
        `Plan ID changed! Expected ${initialPlanId}, got ${planAfterFirstUpdate.id}`
      );
    }
    console.log("   ✅ Plan ID unchanged (update, not create)");

    // Verify items were replaced (not appended)
    if (firstUpdateItemCount !== 2) {
      throw new Error(
        `Item count incorrect! Expected 2, got ${firstUpdateItemCount}`
      );
    }
    console.log("   ✅ Item count correct (2 items, not 5)");

    // Verify old items are gone
    const oldItemsStillExist = firstUpdateItemIds.some((id: string) =>
      initialItemIds.includes(id)
    );
    if (oldItemsStillExist) {
      throw new Error("Old items still exist! Items were appended, not replaced.");
    }
    console.log("   ✅ Old items replaced (new IDs)\n");

    // Step 3: Refresh page (GET request)
    console.log("📝 Step 3: Simulating page refresh (GET request)...");
    const refreshResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "GET",
      }
    );

    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh plan: ${refreshResponse.status}`);
    }

    const refreshedPlan = await refreshResponse.json();
    if (!refreshedPlan) {
      throw new Error("Plan not found after refresh!");
    }

    console.log("✅ Plan refreshed successfully!");
    console.log(`   Plan ID: ${refreshedPlan.id}`);
    console.log(`   Title: ${refreshedPlan.title}`);
    console.log(`   Items: ${refreshedPlan.items.length}\n`);

    // Verify refreshed data matches first update
    if (refreshedPlan.id !== planAfterFirstUpdate.id) {
      throw new Error("Plan ID mismatch after refresh!");
    }
    if (refreshedPlan.items.length !== planAfterFirstUpdate.items.length) {
      throw new Error("Item count mismatch after refresh!");
    }

    // Step 4: Modify again (second update)
    console.log("📝 Step 4: Second modification (update again)...");
    const secondUpdate = {
      title: "Updated Plan - Second",
      items: [
        {
          text: "Item Alpha",
          status: "TODO",
          order: 0,
          tags: [],
          dueTime: null,
        },
        {
          text: "Item Beta",
          status: "DOING",
          order: 1,
          tags: [],
          dueTime: null,
        },
        {
          text: "Item Gamma",
          status: "TODO",
          order: 2,
          tags: [],
          dueTime: null,
        },
      ],
    };

    const secondUpdateResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(secondUpdate),
      }
    );

    if (!secondUpdateResponse.ok) {
      const errorText = await secondUpdateResponse.text();
      throw new Error(`Failed to update plan: ${secondUpdateResponse.status} - ${errorText}`);
    }

    const planAfterSecondUpdate = await secondUpdateResponse.json();
    const secondUpdateItemIds = planAfterSecondUpdate.items.map((i: any) => i.id);
    const secondUpdateItemCount = planAfterSecondUpdate.items.length;

    console.log("✅ Second update completed!");
    console.log(`   Plan ID: ${planAfterSecondUpdate.id}`);
    console.log(`   Items: ${secondUpdateItemCount}`);
    console.log(`   Item IDs: ${secondUpdateItemIds.join(", ")}\n`);

    // Verify same plan ID again
    if (planAfterSecondUpdate.id !== initialPlanId) {
      throw new Error(
        `Plan ID changed on second update! Expected ${initialPlanId}, got ${planAfterSecondUpdate.id}`
      );
    }
    console.log("   ✅ Plan ID unchanged (still same plan)");

    // Verify items were replaced again (not appended)
    if (secondUpdateItemCount !== 3) {
      throw new Error(
        `Item count incorrect! Expected 3, got ${secondUpdateItemCount}`
      );
    }
    console.log("   ✅ Item count correct (3 items, not 5)");

    // Verify previous update items are gone
    const previousItemsStillExist = secondUpdateItemIds.some((id: string) =>
      firstUpdateItemIds.includes(id)
    );
    if (previousItemsStillExist) {
      throw new Error(
        "Previous update items still exist! Items were appended, not replaced."
      );
    }
    console.log("   ✅ Previous items replaced (new IDs)\n");

    // Step 5: Verify only one Plan row exists
    console.log("📝 Step 5: Verifying only one Plan row exists...");
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
        `Found ${allPlans.length} plans! Expected only 1. Plan IDs: ${allPlans.map((p) => p.id).join(", ")}`
      );
    }

    if (allPlans.length === 0) {
      throw new Error("No plan found in database!");
    }

    if (allPlans[0].id !== initialPlanId) {
      throw new Error(
        `Plan ID mismatch! Expected ${initialPlanId}, got ${allPlans[0].id}`
      );
    }

    console.log("✅ Only one Plan row exists");
    console.log(`   Plan ID: ${allPlans[0].id}`);
    console.log(`   Title: ${allPlans[0].title}\n`);

    // Step 6: Verify PlanItems are replaced cleanly (not appended)
    console.log("📝 Step 6: Verifying PlanItems are replaced cleanly...");
    const allPlanItems = await prisma.planItem.findMany({
      where: {
        planId: initialPlanId,
      },
      orderBy: {
        order: "asc",
      },
    });

    console.log(`   Total PlanItems in database: ${allPlanItems.length}`);
    console.log(`   Expected: ${secondUpdateItemCount}`);

    if (allPlanItems.length !== secondUpdateItemCount) {
      throw new Error(
        `Item count mismatch! Expected ${secondUpdateItemCount}, found ${allPlanItems.length} in database. Items were appended, not replaced!`
      );
    }

    // Verify all items belong to the plan
    const allItemsBelongToPlan = allPlanItems.every(
      (item) => item.planId === initialPlanId
    );
    if (!allItemsBelongToPlan) {
      throw new Error("Some items don't belong to the plan!");
    }

    // Verify item IDs match
    const dbItemIds = allPlanItems.map((item) => item.id).sort();
    const apiItemIds = secondUpdateItemIds.sort();
    if (JSON.stringify(dbItemIds) !== JSON.stringify(apiItemIds)) {
      throw new Error(
        `Item IDs mismatch! Database: [${dbItemIds.join(", ")}], API: [${apiItemIds.join(", ")}]`
      );
    }

    console.log("✅ PlanItems replaced cleanly");
    console.log(`   Item IDs match: ${dbItemIds.join(", ")}\n`);

    // Summary
    console.log("=" .repeat(60));
    console.log("🎉 All update-overwrite tests passed!");
    console.log("✅ Only one Plan row exists");
    console.log("✅ PlanItems are replaced cleanly (not appended)");
    console.log("✅ Multiple updates work correctly");
    console.log("=" .repeat(60));
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateOverwrite();
