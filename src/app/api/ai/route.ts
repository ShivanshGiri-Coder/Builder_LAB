import { NextResponse } from "next/server";

// Server-side Gemini calls: validate session, read GEMINI_API_KEY, stream or return JSON — never expose key to client.
export async function POST() {
  return NextResponse.json(null);
}
