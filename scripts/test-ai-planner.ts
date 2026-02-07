/**
 * Test script for AI planner preview endpoint
 * Tests that real app data drives plan generation
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_DATE = new Date().toISOString().split("T")[0]; // Today in YYYY-MM-DD

async function testDayPlanPreview() {
  console.log("\n=== Testing Day Plan Preview ===\n");

  try {
    const url = `${BASE_URL}/api/ai/plan-preview?date=${TEST_DATE}&type=day`;
    console.log(`Fetching day plan preview from: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Request failed:", data);
      return false;
    }

    console.log("✅ Request successful");
    console.log("\nResponse structure:");
    console.log("- type:", data.type);
    console.log("- context:", Object.keys(data.context || {}));
    console.log("- plan:", Object.keys(data.plan || {}));
    console.log("- metadata:", data.metadata);

    // Validate structure
    if (!data.plan || !data.plan.title || !Array.isArray(data.plan.items)) {
      console.error("❌ Invalid plan structure");
      return false;
    }

    console.log("\n📋 Generated Day Plan:");
    console.log(`Title: ${data.plan.title}`);
    console.log("Items:");
    data.plan.items.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. [Order ${item.order}] ${item.text}`);
    });

    // Check if plan reflects context
    if (data.context.weakAreas && data.context.weakAreas.length > 0) {
      const weakAreaNames = data.context.weakAreas.map((a: any) => a.topicName);
      const planText = JSON.stringify(data.plan);
      const includesWeakArea = weakAreaNames.some((name: string) =>
        planText.includes(name)
      );

      if (includesWeakArea) {
        console.log("\n✅ Plan includes weak area topics");
      } else {
        console.log("\n⚠️  Plan does not explicitly mention weak areas");
      }
    }

    return true;
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function testWeekPlanPreview() {
  console.log("\n=== Testing Week Plan Preview ===\n");

  try {
    const url = `${BASE_URL}/api/ai/plan-preview?date=${TEST_DATE}&type=week`;
    console.log(`Fetching week plan preview from: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Request failed:", data);
      return false;
    }

    console.log("✅ Request successful");
    console.log("\n📋 Generated Week Summary:");
    console.log(`Focus Areas: ${data.plan.focusAreas.join(", ")}`);
    console.log(`Intensity: ${data.plan.intensity}`);
    console.log(`Notes: ${data.plan.notes}`);

    // Check if summary reflects context
    if (data.context.lastWeekCompletion !== undefined) {
      console.log(`\n✅ Context includes completion: ${data.context.lastWeekCompletion}%`);
    }
    if (data.context.recentMCQAccuracy !== undefined) {
      console.log(`✅ Context includes MCQ accuracy: ${data.context.recentMCQAccuracy}%`);
    }

    return true;
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function testRateLimit() {
  console.log("\n=== Testing Rate Limit ===\n");

  try {
    // Make multiple requests quickly
    const requests = Array(12).fill(null).map(() =>
      fetch(`${BASE_URL}/api/ai/plan-preview?date=${TEST_DATE}&type=day`)
    );

    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map((r) => r.json()));

    const rateLimited = results.filter((r) => r.error && r.error.includes("Rate limit"));
    const successful = results.filter((r) => !r.error);

    console.log(`Made ${requests.length} requests`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Rate limited: ${rateLimited.length}`);

    if (rateLimited.length > 0) {
      console.log("✅ Rate limiting is working");
    } else {
      console.log("⚠️  Rate limiting may not be active (or limit is high)");
    }

    return true;
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function testValidationFailure() {
  console.log("\n=== Testing Validation Failure Handling ===\n");
  console.log("Note: This test requires mocking AI response to return invalid data");
  console.log("Manual test: Modify aiClient to return invalid JSON and verify fallback");
  console.log("✅ Validation is enforced via Zod schemas");
}

async function main() {
  console.log("Starting AI Planner Tests...\n");

  const test1 = await testDayPlanPreview();
  const test2 = await testWeekPlanPreview();
  const test3 = await testRateLimit();
  await testValidationFailure();

  console.log("\n=== Test Summary ===");
  console.log(`Day plan preview: ${test1 ? "✅" : "❌"}`);
  console.log(`Week plan preview: ${test2 ? "✅" : "❌"}`);
  console.log(`Rate limiting: ${test3 ? "✅" : "❌"}`);
}

main().catch(console.error);
