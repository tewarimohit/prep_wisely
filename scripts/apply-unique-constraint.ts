import { prisma } from "../lib/db";

async function applyConstraint() {
  try {
    // Check if constraint exists
    const result = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Plan' 
      AND constraint_name = 'plan_user_date_unique';
    `);

    if (result.length === 0) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Plan" ADD CONSTRAINT plan_user_date_unique UNIQUE ("userId", "date");'
      );
      console.log("✅ Unique constraint applied successfully");
    } else {
      console.log("ℹ️  Unique constraint already exists");
    }
  } catch (error: any) {
    console.error("❌ Error applying constraint:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

applyConstraint();
