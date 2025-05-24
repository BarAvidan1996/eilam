import { type NextRequest, NextResponse } from "next/server"

// Import the handler from the cron job
import { GET as cronHandler } from "../expiry-notifications/route"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Running cron job test...")

    // Call the cron job handler directly
    const response = await cronHandler(request)

    // Get the response data
    const responseData = await response.json()

    // Return the response with additional test info
    return NextResponse.json({
      test: "success",
      cronResponse: responseData,
      message: "Cron job test completed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Cron job test failed:", error)
    return NextResponse.json(
      {
        test: "failed",
        error: "Cron job test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
