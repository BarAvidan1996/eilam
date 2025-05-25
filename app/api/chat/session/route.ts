import { type NextRequest, NextResponse } from "next/server"
import { createChatSession } from "@/lib/rag-service"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🚀 API Session - התחלת יצירת session")

  try {
    // יצירת Supabase client עם auth
    const supabase = createRouteHandlerClient({ cookies })

    // קבלת המשתמש הנוכחי
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ שגיאה באימות:", authError)
    }

    console.log("👤 משתמש נוכחי:", user?.id || "אנונימי")
    console.log("🆕 קורא לפונקציית createChatSession...")

    // יצירת session עם user_id אם קיים
    const sessionId = await createChatSession(user?.id)

    console.log("✅ Session נוצר בהצלחה:", sessionId)

    return NextResponse.json({
      sessionId: sessionId,
      success: true,
      userId: user?.id || null,
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
