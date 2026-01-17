import { NextResponse } from "next/server";

/**
 * Test endpoint to verify Next.js reads environment variables correctly
 * This is a temporary route for verification - remove in production
 */
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Mask sensitive parts of DATABASE_URL for security
  const maskedUrl = databaseUrl
    ? databaseUrl.replace(/:([^:@]+)@/, ":****@") // Mask password
    : null;

  return NextResponse.json({
    success: !!databaseUrl,
    databaseUrlConfigured: !!databaseUrl,
    maskedDatabaseUrl: maskedUrl,
    // Verify other env vars exist (even if commented out)
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasOcrApiKey: !!process.env.OCR_API_KEY,
    hasUploadBucketUrl: !!process.env.UPLOAD_BUCKET_URL,
    message: databaseUrl
      ? "Environment variables are being read correctly!"
      : "DATABASE_URL is not set. Please check your .env file.",
  });
}
