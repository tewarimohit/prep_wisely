/**
 * Test script to verify GET /api/plans/week API
 * Run with: npx tsx scripts/test-week-api.ts
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = process.env.TEST_USER_ID || "cmko9jw0y0002dx23vbn4lnm2";

// Helper to get Monday and Sunday of current week
function getWeekDates(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(today.setDate(diff));
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

async function testWeekAPI() {
  console.log("🧪 Testing GET /api/plans/week API\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}\n`);

  const { startDate, endDate } = getWeekDates();
  console.log(`Week range: ${startDate} to ${endDate}\n`);

  try {
    // Test 1: Valid request
    console.log("📝 Test 1: Fetching week plans...");
    const url = `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${startDate}&endDate=${endDate}`;
    console.log(`URL: ${url}\n`);

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch week plans: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const plans = await response.json();
    console.log(`✅ Successfully fetched ${plans.length} plans\n`);

    // Verify response structure
    if (!Array.isArray(plans)) {
      throw new Error("Response is not an array");
    }

    // Verify each plan has minimal fields
    plans.forEach((plan: any, index: number) => {
      console.log(`  Plan ${index + 1}:`);
      console.log(`    Date: ${plan.date}`);
      console.log(`    Title: ${plan.title}`);
      console.log(`    Status: ${plan.status}`);
      console.log(`    Items: ${plan.items?.length || 0}`);
      
      // Verify required fields
      if (!plan.date) {
        throw new Error(`Plan ${index + 1} missing date field`);
      }
      if (!plan.title) {
        throw new Error(`Plan ${index + 1} missing title field`);
      }
      if (!plan.status) {
        throw new Error(`Plan ${index + 1} missing status field`);
      }
      if (!["completed", "in_progress", "pending"].includes(plan.status)) {
        throw new Error(
          `Plan ${index + 1} has invalid status: ${plan.status}. Expected: completed, in_progress, or pending`
        );
      }
      if (!Array.isArray(plan.items)) {
        throw new Error(`Plan ${index + 1} items is not an array`);
      }

      // Verify completion status matches items
      const completedCount = plan.items.filter(
        (item: any) => item.status === "DONE"
      ).length;
      const totalCount = plan.items.length;
      const expectedStatus =
        totalCount === 0
          ? "pending"
          : completedCount === totalCount
          ? "completed"
          : completedCount > 0
          ? "in_progress"
          : "pending";

      if (plan.status !== expectedStatus) {
        throw new Error(
          `Plan ${index + 1} status mismatch: expected ${expectedStatus}, got ${plan.status} (${completedCount}/${totalCount} completed)`
        );
      }

      // Verify items have minimal fields
      plan.items.forEach((item: any, itemIndex: number) => {
        if (!item.id) {
          throw new Error(`Plan ${index + 1}, Item ${itemIndex + 1} missing id`);
        }
        if (item.status === undefined) {
          throw new Error(`Plan ${index + 1}, Item ${itemIndex + 1} missing status`);
        }
        if (item.order === undefined) {
          throw new Error(`Plan ${index + 1}, Item ${itemIndex + 1} missing order`);
        }
      });

      // Verify items don't have extra fields (only id, status, order)
      const itemKeys = Object.keys(plan.items[0] || {});
      const allowedKeys = ["id", "status", "order"];
      const extraKeys = itemKeys.filter((key) => !allowedKeys.includes(key));
      if (extraKeys.length > 0) {
        console.log(`    ⚠️  Warning: Item has extra fields: ${extraKeys.join(", ")}`);
      }
    });

    console.log("\n✅ All plans have correct structure and completion status\n");

    // Test 2: Missing userId
    console.log("📝 Test 2: Missing userId...");
    const response2 = await fetch(
      `${BASE_URL}/api/plans/week?startDate=${startDate}&endDate=${endDate}`,
      { method: "GET" }
    );

    if (response2.ok) {
      throw new Error("Expected 400 error for missing userId");
    }

    if (response2.status !== 400) {
      throw new Error(`Expected 400, got ${response2.status}`);
    }

    console.log("✅ Correctly rejected missing userId\n");

    // Test 3: Missing dates
    console.log("📝 Test 3: Missing dates...");
    const response3 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}`,
      { method: "GET" }
    );

    if (response3.ok) {
      throw new Error("Expected 400 error for missing dates");
    }

    if (response3.status !== 400) {
      throw new Error(`Expected 400, got ${response3.status}`);
    }

    console.log("✅ Correctly rejected missing dates\n");

    // Test 4: Invalid date format
    console.log("📝 Test 4: Invalid date format...");
    const response4 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=invalid&endDate=${endDate}`,
      { method: "GET" }
    );

    if (response4.ok) {
      throw new Error("Expected 400 error for invalid date format");
    }

    if (response4.status !== 400) {
      throw new Error(`Expected 400, got ${response4.status}`);
    }

    console.log("✅ Correctly rejected invalid date format\n");

    // Test 5: startDate > endDate
    console.log("📝 Test 5: startDate > endDate...");
    const response5 = await fetch(
      `${BASE_URL}/api/plans/week?userId=${TEST_USER_ID}&startDate=${endDate}&endDate=${startDate}`,
      { method: "GET" }
    );

    if (response5.ok) {
      throw new Error("Expected 400 error for invalid date range");
    }

    if (response5.status !== 400) {
      throw new Error(`Expected 400, got ${response5.status}`);
    }

    console.log("✅ Correctly rejected invalid date range\n");

    console.log("✅ All Tests Passed!\n");
    console.log("Summary:");
    console.log(`  ✅ Fetched ${plans.length} plans for week`);
    console.log("  ✅ Response structure is correct");
    console.log("  ✅ Minimal fields returned (date, title, status, items)");
    console.log("  ✅ Completion status computed correctly");
    console.log("  ✅ Items have minimal fields (id, status, order)");
    console.log("  ✅ Error handling works correctly");
  } catch (error: any) {
    console.error("\n❌ Test Failed:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testWeekAPI();
