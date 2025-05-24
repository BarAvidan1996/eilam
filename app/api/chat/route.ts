import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery, createChatSession, saveChatMessage } from "@/lib/services/rag-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, sessionId, userId } = body

    console.log("Chat API called with:", { question, sessionId, userId })

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    let currentSessionId = sessionId

    // יצירת סשן חדש אם לא קיים
    if (!currentSessionId && userId) {
      try {
        const session = await createChatSession(userId, `שיחה - ${new Date().toLocaleDateString("he-IL")}`)
        currentSessionId = session.id
        console.log("Created new session:", currentSessionId)
      } catch (error) {
        console.error("Error creating session:", error)
        // ממשיך בלי סשן אם יש בעיה
      }
    }

    // שמירת שאלת המשתמש
    if (currentSessionId) {
      try {
        await saveChatMessage(currentSessionId, "user", question)
      } catch (error) {
        console.error("Error saving user message:", error)
      }
    }

    // עיבוד השאלה עם RAG
    const ragResult = await processRAGQuery(question)

    // שמירת תשובת הבוט
    if (currentSessionId) {
      try {
        await saveChatMessage(currentSessionId, "assistant", ragResult.answer)
      } catch (error) {
        console.error("Error saving assistant message:", error)
      }
    }

    return NextResponse.json({
      answer: ragResult.answer,
      sources: ragResult.sources,
      sessionId: currentSessionId,
      language: ragResult.language,
      documentsFound: ragResult.documentsFound,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        answer: "מצטער, אירעה שגיאה בשרת. אנא נסה שוב.",
      },
      { status: 500 },
    )
  }
}
