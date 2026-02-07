/**
 * Verify database connection and schema
 * Run this after setting up production database
 */

import { prisma } from "@/lib/db";

async function verifyConnection() {
  console.log("🔍 Verifying database connection...\n");

  try {
    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful\n");

    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log(`📊 Found ${tables.length} tables:\n`);
    tables.forEach((table) => {
      console.log(`  - ${table.tablename}`);
    });

    // Verify key tables exist
    const requiredTables = [
      "Plan",
      "PlanItem",
      "MCQ",
      "MCQSession",
      "MCQResponse",
      "WeakAreaSnapshot",
      "FeedbackEntry",
    ];

    const existingTables = tables.map((t) => t.tablename);
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(", ")}`);
      console.log("   Run: npx prisma migrate deploy\n");
    } else {
      console.log("\n✅ All required tables exist\n");
    }

    // Test a simple query
    const planCount = await prisma.plan.count();
    console.log(`📝 Plans in database: ${planCount}`);

    const mcqCount = await prisma.mCQ.count();
    console.log(`❓ MCQs in database: ${mcqCount}`);

    console.log("\n✅ Database verification complete!");
  } catch (error: any) {
    console.error("\n❌ Database connection failed:");
    console.error(`   ${error.message}\n`);
    console.error("Troubleshooting:");
    console.error("1. Check DATABASE_URL in .env");
    console.error("2. Verify database is accessible");
    console.error("3. Check SSL requirements (?sslmode=require)");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection().catch(console.error);
