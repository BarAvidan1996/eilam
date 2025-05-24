import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  try {
    console.log("📨 התקבלה בקשת צ'אט")

    const { message, sessionId } = await request.json()

    if (!message || !sessionId) {
      console.log("❌ חסרים פרמטרים: message או sessionId")
      return NextResponse.json({ error: "חסרים פרמטרים נדרשים" }, { status: 400 })
    }

    console.log(`💬 מעבד הודעה: "${message}" עבור סשן: ${sessionId}`)

    // שמירת הודעת המשתמש
    await saveChatMessage(sessionId, message, true)
    console.log("✅ הודעת משתמש נשמרה")

    // עיבוד השאלה
    const result = await processRAGQuery(message)
    console.log("📊 תוצאת עיבוד:", {
      answerLength: result.answer.length,
      sourcesCount: result.sources.length,
      usedFallback: result.usedFallback,
      hasError: !!result.error,
    })

    // שמירת תשובת הבוט
    await saveChatMessage(sessionId, result.answer, false, result.sources)
    console.log("✅ תשובת בוט נשמרה")

    // אם יש שגיאה, נוסיף אותה לתגובה לצורך debug
    const response = {
      answer: result.answer,
      sources: result.sources,
      usedFallback: result.usedFallback,
      ...(result.error && { debugError: result.error }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ שגיאה כללית ב-API:", error)

    return NextResponse.json(
      {
        error: "שגיאה פנימית בשרת",
        debugError: error instanceof Error ? error.message : JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}
