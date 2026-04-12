import { NextResponse } from "next/server";

// OAuth / magic-link callback: exchange code for session, set cookies, redirect to app.
export async function GET() {
  return NextResponse.json(null);
}
