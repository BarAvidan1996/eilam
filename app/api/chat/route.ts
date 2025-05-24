import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { answerQuestion } from "@/lib/services/rag-service"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("Chat API called")

    const body = await request.json()
    const { question, sessionId, userId } = body

    console.log("Received question:", question)

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // יצירת תשובה באמצעות RAG
    console.log("Calling RAG service...")
    const ragResponse = await answerQuestion(question)
    console.log("RAG response:", ragResponse)

    let currentSessionId = sessionId

    // יצירת סשן חדש אם לא קיים ויש משתמש
    if (!currentSessionId && userId) {
      try {
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
          console.log("Created new session:", currentSessionId)
        } else {
          console.log("Session creation error:", sessionError)
        }
      } catch (sessionErr) {
        console.error("Error creating session:", sessionErr)
      }
    }

    // שמירת ההודעות במסד הנתונים
    if (currentSessionId) {
      try {
        // שמירת שאלת המשתמש
        const { error: userMsgError } = await supabase.from("chat_messages").insert({
          session_id: currentSessionId,
          role: "user",
          content: question,
        })

        if (userMsgError) {
          console.log("User message save error:", userMsgError)
        }

        // שמירת תשובת הבוט
        const { error: botMsgError } = await supabase.from("chat_messages").insert({
          session_id: currentSessionId,
          role: "assistant",
          content: ragResponse.answer,
        })

        if (botMsgError) {
          console.log("Bot message save error:", botMsgError)
        }
      } catch (dbErr) {
        console.error("Error saving messages:", dbErr)
      }
    }

    return NextResponse.json({
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      method: ragResponse.method,
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        answer: "מצטער, אירעה שגיאה בשרת. אנא נסה שוב.",
        sources: [],
        method: "error",
      },
      { status: 500 },
    )
  }
}
