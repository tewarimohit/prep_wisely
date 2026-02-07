import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Get authenticated user session in App Router API routes
 * Returns null if not authenticated
 */
export async function auth(request: NextRequest) {
  // For NextAuth v4, we need to create req/res objects from NextRequest
  // This is a workaround for App Router compatibility
  const req = {
    headers: Object.fromEntries(request.headers.entries()),
  } as any;
  
  const res = {
    getHeader: () => null,
    setHeader: () => {},
    setCookie: () => {},
  } as any;

  try {
    const session = await getServerSession(req, res, authOptions);
    return session;
  } catch (error) {
    console.error("[Auth] Error getting session:", error);
    return null;
  }
}

/**
 * Get authenticated user ID from session
 * Returns null if not authenticated (doesn't throw)
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth(request);
  return session?.user?.id || null;
}
