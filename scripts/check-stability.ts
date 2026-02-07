/**
 * Quick stability check script
 * Verifies critical pages load without runtime errors
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function checkPage(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    return response.ok || response.status === 200;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log("Running stability checks...\n");

  const criticalPages = [
    "/day",
    "/week",
    "/dashboard",
    "/mcq/play",
    "/weak-areas",
    "/ai/preview?date=2024-01-23&type=day",
  ];

  const results: { path: string; ok: boolean }[] = [];

  for (const path of criticalPages) {
    const ok = await checkPage(path);
    results.push({ path, ok });
    console.log(`${ok ? "✅" : "❌"} ${path}`);
  }

  const allOk = results.every((r) => r.ok);

  if (allOk) {
    console.log("\n✅ All critical pages accessible");
  } else {
    console.log("\n❌ Some pages failed - check server logs");
    process.exit(1);
  }
}

main().catch(console.error);
