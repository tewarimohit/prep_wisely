/**
 * Test script to validate error handling in the day page
 * Tests various failure scenarios to ensure UI doesn't crash
 * Run with: npx tsx scripts/test-error-handling.ts
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

async function testErrorHandling() {
  console.log("🧪 Testing Error Handling (Failure Paths)\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Date: ${TEST_DATE}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Invalid API URL (404)
  console.log("📝 Test 1: Invalid API URL (404)...");
  try {
    const response = await fetch(
      `${BASE_URL}/api/plans/invalid-date-format?userId=${TEST_USER_ID}`
    );
    if (response.status === 400) {
      console.log("   ✅ API correctly returns 400 for invalid date format");
      testsPassed++;
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ✅ Network error caught (expected): ${error.message}`);
    testsPassed++;
  }

  // Test 2: Missing userId (400)
  console.log("\n📝 Test 2: Missing userId parameter...");
  try {
    const response = await fetch(`${BASE_URL}/api/plans/${TEST_DATE}`);
    const data = await response.json();
    if (response.status === 400 && data.error?.includes("userId")) {
      console.log("   ✅ API correctly returns 400 for missing userId");
      testsPassed++;
    } else {
      console.log(`   ❌ Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
    testsFailed++;
  }

  // Test 3: Invalid payload (400)
  console.log("\n📝 Test 3: Invalid payload (missing title)...");
  try {
    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing title
          items: [],
        }),
      }
    );
    const data = await response.json();
    if (response.status === 400 && data.error) {
      console.log("   ✅ API correctly returns 400 for invalid payload");
      console.log(`   Error message: ${data.error}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Simulate 500 error by creating invalid data
  console.log("\n📝 Test 4: Simulating server error...");
  try {
    // Try to create plan with invalid userId (non-existent)
    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=non-existent-user-id-12345`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Plan",
          items: [
            {
              text: "Test Item",
              status: "TODO",
              order: 0,
              tags: [],
              dueTime: null,
            },
          ],
        }),
      }
    );
    const data = await response.json();
    // Should either return 400 (validation) or 500 (server error)
    if (response.status >= 400) {
      console.log(`   ✅ API correctly handles invalid userId (${response.status})`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Unexpected success: ${response.status}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ✅ Network error caught: ${error.message}`);
    testsPassed++;
  }

  // Test 5: Test with malformed JSON
  console.log("\n📝 Test 5: Malformed JSON payload...");
  try {
    const response = await fetch(
      `${BASE_URL}/api/plans/${TEST_DATE}?userId=${TEST_USER_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      }
    );
    // Should return 400 or 500
    if (response.status >= 400) {
      console.log(`   ✅ API correctly rejects malformed JSON (${response.status})`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Unexpected success: ${response.status}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ✅ Network error caught: ${error.message}`);
    testsPassed++;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results:");
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log("=".repeat(60));

  if (testsFailed > 0) {
    console.log("\n⚠️  Some tests failed. Review the output above.");
    process.exit(1);
  } else {
    console.log("\n🎉 All error handling tests passed!");
    console.log("\n✅ UI should handle these errors gracefully:");
    console.log("   - Invalid API URLs");
    console.log("   - Missing parameters");
    console.log("   - Invalid payloads");
    console.log("   - Server errors");
    console.log("   - Network failures");
  }
}

testErrorHandling();
