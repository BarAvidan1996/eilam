import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    // קריאת הגוף של הבקשה
    const body = await request.json()
    console.log("📦 גוף הבקשה שהתקבל:", JSON.stringify(body, null, 2))

    const { message, sessionId } = body

    console.log("🔍 פירוק פרמטרים:")
    console.log("  - message:", message, "(type:", typeof message, ")")
    console.log("  - sessionId:", sessionId, "(type:", typeof sessionId, ")")

    // בדיקת תקינות פרמטרים
    if (!message || typeof message !== "string" || message.trim() === "") {
      console.log("❌ שגיאה: message לא תקין")
      console.log("  - message exists:", !!message)
      console.log("  - message type:", typeof message)
      console.log("  - message trimmed length:", message ? message.trim().length : 0)

      return NextResponse.json(
        {
          error: "Message is required and must be a non-empty string",
          received: { message, sessionId },
        },
        { status: 400 },
      )
    }

    if (!sessionId || typeof sessionId !== "string") {
      console.log("❌ שגיאה: sessionId לא תקין")
      console.log("  - sessionId exists:", !!sessionId)
      console.log("  - sessionId type:", typeof sessionId)

      return NextResponse.json(
        {
          error: "SessionId is required and must be a string",
          received: { message, sessionId },
        },
        { status: 400 },
      )
    }

    console.log("✅ פרמטרים תקינים, מתחיל עיבוד")
    console.log(`💬 מעבד הודעה: "${message}" עבור סשן: ${sessionId}`)

    // שמירת הודעת המשתמש
    console.log("💾 שומר הודעת משתמש...")
    await saveChatMessage(sessionId, message, true)
    console.log("✅ הודעת משתמש נשמרה בהצלחה")

    // עיבוד השאלה
    console.log("🧠 מתחיל עיבוד RAG...")
    const result = await processRAGQuery(message)
    console.log("📊 תוצאת עיבוד RAG:", {
      answerLength: result.answer.length,
      sourcesCount: result.sources.length,
      usedFallback: result.usedFallback,
      hasError: !!result.error,
    })

    if (result.error) {
      console.log("⚠️ שגיאה בעיבוד RAG:", result.error)
    }

    // שמירת תשובת הבוט
    console.log("💾 שומר תשובת בוט...")
    await saveChatMessage(sessionId, result.answer, false, result.sources)
    console.log("✅ תשובת בוט נשמרה בהצלחה")

    // הכנת התגובה
    const response = {
      answer: result.answer,
      sources: result.sources,
      usedFallback: result.usedFallback,
      sessionId: sessionId,
      ...(result.error && { debugError: result.error }),
    }

    console.log("📤 שולח תגובה:", {
      answerPreview: response.answer.substring(0, 100) + "...",
      sourcesCount: response.sources.length,
      usedFallback: response.usedFallback,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 שגיאה כללית ב-API:")
    console.error("  - Error type:", error?.constructor?.name)
    console.error("  - Error message:", error instanceof Error ? error.message : String(error))
    console.error("  - Error stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        error: "שגיאה פנימית בשרת",
        debugError: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || "Unknown",
      },
      { status: 500 },
    )
  }
}
