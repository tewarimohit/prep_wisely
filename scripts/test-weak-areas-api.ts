/**
 * Test script for Weak Areas API
 * Tests GET /api/weak-areas endpoint
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

async function testWeakAreasAPI() {
  console.log("=== Testing Weak Areas API ===\n");

  try {
    const url = `${BASE_URL}/api/weak-areas?userId=${TEST_USER_ID}`;
    console.log(`Fetching weak areas from: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API request failed:", data);
      return;
    }

    console.log("✅ API request successful");
    console.log("\nResponse structure:");
    console.log("- weakAreas:", Array.isArray(data.weakAreas) ? `Array(${data.weakAreas.length})` : "Not an array");

    if (!Array.isArray(data.weakAreas)) {
      console.error("❌ Response is not an array");
      return;
    }

    if (data.weakAreas.length === 0) {
      console.log("\n⚠️  No weak areas found (empty state)");
      console.log("   This is expected if no MCQs have been attempted yet");
      return;
    }

    console.log("\n✅ Validation checks:");
    
    // Validate structure
    const firstArea = data.weakAreas[0];
    const requiredFields = ["topicId", "topicName", "score", "attempts", "lastSeenAt"];
    const missingFields = requiredFields.filter(field => !(field in firstArea));
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing fields: ${missingFields.join(", ")}`);
      return;
    }
    console.log("   ✅ All required fields present");

    // Validate score range
    const invalidScores = data.weakAreas.filter((area: any) => 
      area.score < 0 || area.score > 100
    );
    if (invalidScores.length > 0) {
      console.error(`❌ Invalid scores found: ${invalidScores.length} items`);
      return;
    }
    console.log("   ✅ All scores in valid range (0-100)");

    // Validate attempts
    const invalidAttempts = data.weakAreas.filter((area: any) => 
      !Number.isInteger(area.attempts) || area.attempts < 0
    );
    if (invalidAttempts.length > 0) {
      console.error(`❌ Invalid attempts found: ${invalidAttempts.length} items`);
      return;
    }
    console.log("   ✅ All attempts are valid integers");

    // Check sorting (lowest score first, then highest attempts)
    console.log("\n✅ Sorting verification:");
    let prevScore = -1;
    let prevAttempts = Infinity;
    let sortingCorrect = true;

    for (const area of data.weakAreas) {
      if (area.score < prevScore) {
        console.error(`❌ Sorting error: score ${area.score} < previous ${prevScore}`);
        sortingCorrect = false;
        break;
      }
      if (area.score === prevScore && area.attempts > prevAttempts) {
        console.error(`❌ Sorting error: same score but attempts ${area.attempts} > previous ${prevAttempts}`);
        sortingCorrect = false;
        break;
      }
      prevScore = area.score;
      prevAttempts = area.attempts;
    }

    if (sortingCorrect) {
      console.log("   ✅ Items sorted correctly (lowest score first, then highest attempts)");
    }

    // Display sample data
    console.log("\n📊 Sample weak areas (first 5):");
    data.weakAreas.slice(0, 5).forEach((area: any, index: number) => {
      console.log(`   ${index + 1}. ${area.topicName}`);
      console.log(`      Score: ${area.score.toFixed(1)}%`);
      console.log(`      Attempts: ${area.attempts}`);
      console.log(`      Last seen: ${new Date(area.lastSeenAt).toLocaleDateString()}`);
    });

    console.log("\n✅ All validation checks passed!");

  } catch (error: any) {
    console.error("❌ Error during test:", error.message);
  }
}

// Test without userId (should fail)
async function testMissingUserId() {
  console.log("\n=== Testing Missing userId ===\n");

  try {
    const url = `${BASE_URL}/api/weak-areas`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.status === 400 && data.error) {
      console.log("✅ Correctly returns 400 for missing userId");
    } else {
      console.error("❌ Should return 400 for missing userId");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

async function main() {
  await testWeakAreasAPI();
  await testMissingUserId();
}

main().catch(console.error);
