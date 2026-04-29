import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'OG image generation temporarily disabled' })
}