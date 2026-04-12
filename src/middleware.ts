import { type NextRequest, NextResponse } from "next/server";

// Runs on matched paths: refresh Supabase session cookies and optionally gate /(app)/* for signed-in users only.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Limit middleware to routes that need auth refresh (tune as you add public portfolio slugs, etc.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
