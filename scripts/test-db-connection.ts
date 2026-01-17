import { prisma } from "../lib/db";

async function testConnection() {
  try {
    console.log("🔌 Testing Prisma database connection...\n");

    // Test connection by querying the database
    await prisma.$connect();
    console.log("✅ Successfully connected to database!");

    // Get database info
    const result = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database();
    `;
    console.log(`📊 Database: ${result[0]?.current_database || "unknown"}\n`);

    // List all tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log(`📋 Found ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   - ${table.tablename}`);
    });

    console.log("\n✨ Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
