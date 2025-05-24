import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { answerQuestion } from "@/lib/services/rag-service"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId, userId } = await request.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // יצירת תשובה באמצעות RAG
    const ragResponse = await answerQuestion(question)

    let currentSessionId = sessionId

    // יצירת סשן חדש אם לא קיים
    if (!currentSessionId && userId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: question.substring(0, 50) + (question.length > 50 ? "..." : ""),
        })
        .select("id")
        .single()

      if (!sessionError && newSession) {
        currentSessionId = newSession.id
      }
    }

    // שמירת ההודעות במסד הנתונים
    if (currentSessionId) {
      // שמירת שאלת המשתמש
      await supabase.from("chat_messages").insert({
        session_id: currentSessionId,
        role: "user",
        content: question,
      })

      // שמירת תשובת הבוט
      await supabase.from("chat_messages").insert({
        session_id: currentSessionId,
        role: "assistant",
        content: ragResponse.answer,
      })
    }

    return NextResponse.json({
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      method: ragResponse.method,
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
