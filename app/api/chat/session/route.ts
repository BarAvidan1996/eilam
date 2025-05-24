import { NextResponse } from "next/server"
import { createChatSession } from "@/lib/rag-service"

export async function POST() {
  try {
    console.log("🆕 API Session - יוצר session חדש")

    // יצירת session עם user ID גנרי (או ללא user)
    const sessionId = await createChatSession("anonymous")

    console.log("✅ Session נוצר בהצלחה:", sessionId)

    return NextResponse.json({ sessionId })
  } catch (error) {
    console.error("❌ שגיאה ביצירת session:", error)

    return NextResponse.json(
      {
        error: "שגיאה ביצירת session",
        debugError: error instanceof Error ? error.message : JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}
