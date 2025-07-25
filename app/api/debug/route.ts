import { NextResponse } from "next/server"

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiKeys: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          prefix: process.env.OPENAI_API_KEY?.substring(0, 10) || "Not set",
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) || "Not set",
        },
      },
      availableModels: [
        { id: "gpt-4o", provider: "openai" },
        { id: "claude-sonnet-4-20250514", provider: "claude" },
      ],
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
