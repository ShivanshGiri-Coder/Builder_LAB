import { NextResponse } from "next/server";

// Server-side Claude calls: validate session, read ANTHROPIC_API_KEY, stream or return JSON — never expose key to client.
export async function POST() {
  return NextResponse.json(null);
}
