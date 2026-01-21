/**
 * Create a test user for API testing
 * Run with: npx tsx scripts/create-test-user.ts
 */

import { prisma } from "../lib/db";

async function createTestUser() {
  const testUserId = process.env.TEST_USER_ID || "test-user-123";
  const testEmail = `test-${testUserId}@example.com`;

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    if (!user) {
      // Create test user
      user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          name: "Test User",
          role: "ASPIRANT",
        },
      });
      console.log(`✅ Created test user: ${user.id} (${user.email})`);
    } else {
      console.log(`ℹ️  Test user already exists: ${user.id} (${user.email})`);
    }

    console.log(`\nUse this userId in tests: ${user.id}`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating test user:", error.message);
    process.exit(1);
  }
}

createTestUser();
