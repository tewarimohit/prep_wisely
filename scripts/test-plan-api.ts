/**
 * Test script to verify POST /api/plans/[date] API
 * Run with: npx tsx scripts/test-plan-api.ts
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = process.env.TEST_USER_ID || "test-user-123";
const TEST_DATE = "2024-01-15";

async function testPlanAPI() {
  console.log("🧪 Testing POST /api/plans/[date] API\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE}\n`);

  // Scenario A: Create a new plan for a fresh date
  console.log("📝 Scenario A: Creating a new plan...");
  const scenarioA = {
    title: "Daily Study Plan - Morning",
    items: [
      {
        text: "Complete History chapter 5",
        status: "TODO",
        order: 0,
        tags: ["history", "study"],
        dueTime: null,
      },
      {
        text: "Practice Geography MCQs",
        status: "DOING",
        order: 1,
        tags: ["geography", "mcq"],
        dueTime: "2024-01-15T14:00:00.000Z",
      },
      {
        text: "Review Polity notes",
        status: "TODO",
        order: 2,
        tags: ["polity"],
        dueTime: null,
      },
    ],
  };

  try {
    const responseA = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scenarioA),
      }
    );

    const dataA = await responseA.json();

    if (!responseA.ok) {
      console.error("❌ Scenario A failed:", dataA);
      return;
    }

    console.log("✅ Scenario A - Plan created successfully!");
    console.log(`   Status: ${responseA.status}`);
    console.log(`   Plan ID: ${dataA.id}`);
    console.log(`   Title: ${dataA.title}`);
    console.log(`   Items count: ${dataA.items?.length || 0}`);
    console.log(`   Items order: ${dataA.items?.map((i: any) => i.order).join(", ") || "none"}`);
    console.log(`   First item: ${dataA.items?.[0]?.text || "none"}\n`);

    // Verify response structure
    if (!dataA.id || !dataA.userId || !dataA.title || !Array.isArray(dataA.items)) {
      console.error("❌ Invalid response structure:", dataA);
      return;
    }

    if (dataA.items.length !== 3) {
      console.error(`❌ Expected 3 items, got ${dataA.items.length}`);
      return;
    }

    // Verify items are ordered correctly
    const orders = dataA.items.map((i: any) => i.order);
    if (JSON.stringify(orders) !== JSON.stringify([0, 1, 2])) {
      console.error(`❌ Items not ordered correctly. Expected [0,1,2], got [${orders.join(",")}]`);
      return;
    }

    console.log("✅ Response structure validated!\n");

    // Wait a bit before Scenario B
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Scenario B: POST again for the same date with different items
    console.log("📝 Scenario B: Updating plan with different items...");
    const scenarioB = {
      title: "Daily Study Plan - Updated",
      items: [
        {
          text: "Complete Economics chapter 3",
          status: "TODO",
          order: 0,
          tags: ["economics"],
          dueTime: null,
        },
        {
          text: "Solve 20 Math problems",
          status: "DOING",
          order: 1,
          tags: ["math", "practice"],
          dueTime: "2024-01-15T16:00:00.000Z",
        },
      ],
    };

    const responseB = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scenarioB),
      }
    );

    const dataB = await responseB.json();

    if (!responseB.ok) {
      console.error("❌ Scenario B failed:", dataB);
      return;
    }

    console.log("✅ Scenario B - Plan updated successfully!");
    console.log(`   Status: ${responseB.status}`);
    console.log(`   Plan ID: ${dataB.id}`);
    console.log(`   Title: ${dataB.title}`);
    console.log(`   Items count: ${dataB.items?.length || 0}`);
    console.log(`   Items order: ${dataB.items?.map((i: any) => i.order).join(", ") || "none"}`);
    console.log(`   First item: ${dataB.items?.[0]?.text || "none"}\n`);

    // Verify update worked correctly
    if (dataB.id !== dataA.id) {
      console.error(`❌ Plan ID changed! Expected ${dataA.id}, got ${dataB.id}`);
      return;
    }

    if (dataB.title !== scenarioB.title) {
      console.error(`❌ Title not updated! Expected "${scenarioB.title}", got "${dataB.title}"`);
      return;
    }

    if (dataB.items.length !== 2) {
      console.error(`❌ Expected 2 items after update, got ${dataB.items.length}`);
      return;
    }

    // Verify old items are gone (no "History" or "Geography" items)
    const itemTexts = dataB.items.map((i: any) => i.text);
    if (itemTexts.includes("Complete History chapter 5")) {
      console.error("❌ Old items not deleted! Found 'Complete History chapter 5'");
      return;
    }

    // Verify new items are present
    if (!itemTexts.includes("Complete Economics chapter 3")) {
      console.error("❌ New items not created! Missing 'Complete Economics chapter 3'");
      return;
    }

    // Verify items are ordered correctly
    const ordersB = dataB.items.map((i: any) => i.order);
    if (JSON.stringify(ordersB) !== JSON.stringify([0, 1])) {
      console.error(`❌ Items not ordered correctly. Expected [0,1], got [${ordersB.join(",")}]`);
      return;
    }

    console.log("✅ Update verified - old items deleted, new items created, ordering correct!\n");

    // Final verification: GET the plan to ensure it's persisted correctly
    console.log("🔍 Final verification: Fetching plan via GET...");
    const getResponse = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "GET",
      }
    );

    const getData = await getResponse.json();

    if (!getResponse.ok || !getData) {
      console.error("❌ GET request failed or returned null");
      return;
    }

    console.log("✅ GET request successful!");
    console.log(`   Plan ID: ${getData.id}`);
    console.log(`   Title: ${getData.title}`);
    console.log(`   Items count: ${getData.items?.length || 0}`);

    if (getData.id !== dataB.id || getData.title !== dataB.title) {
      console.error("❌ GET response doesn't match POST response");
      return;
    }

    if (getData.items.length !== dataB.items.length) {
      console.error(`❌ Item count mismatch. POST: ${dataB.items.length}, GET: ${getData.items.length}`);
      return;
    }

    console.log("\n🎉 All tests passed! API is working correctly.");
  } catch (error: any) {
    console.error("❌ Test failed with error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testPlanAPI().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
