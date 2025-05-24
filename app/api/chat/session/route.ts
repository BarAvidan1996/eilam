import { type NextRequest, NextResponse } from "next/server"
import { createChatSession } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  console.log("🚀 API Session - התחלת יצירת session")

  try {
    console.log("🆕 קורא לפונקציית createChatSession...")

    const sessionId = await createChatSession()

    console.log("✅ Session נוצר בהצלחה:", sessionId)

    return NextResponse.json({
      sessionId: sessionId,
      success: true,
    })
  } catch (error) {
    console.error("💥 שגיאה ביצירת session:")
    console.error("  - Error type:", error?.constructor?.name)
    console.error("  - Error message:", error instanceof Error ? error.message : String(error))
    console.error("  - Error stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        error: "שגיאה ביצירת session",
        debugError: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || "Unknown",
      },
      { status: 500 },
    )
  }
}
