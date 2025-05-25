import { type NextRequest, NextResponse } from "next/server"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

// ודא שאנחנו ב-Node.js runtime ולא Edge
export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    // קריאת הגוף של הבקשה
    const body = await request.json()
    console.log("📦 גוף הבקשה שהתקבל:", JSON.stringify(body, null, 2))

    // useChat שולח messages array ו-sessionId בנפרד
    const { messages, sessionId } = body

    // הודעה אחרונה היא השאלה הנוכחית
    const lastMessage = messages?.[messages.length - 1]
    const message = lastMessage?.content

    console.log("🔍 פירוק פרמטרים:")
    console.log("  - message:", message, "(type:", typeof message, ")")
    console.log("  - sessionId:", sessionId, "(type:", typeof sessionId, ")")

    // בדיקת תקינות פרמטרים
    if (!message || typeof message !== "string" || message.trim() === "") {
      console.log("❌ שגיאה: message לא תקין")
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
    try {
      await saveChatMessage(sessionId, message, true)
      console.log("✅ הודעת משתמש נשמרה בהצלחה")
    } catch (saveError) {
      console.error("❌ שגיאה בשמירת הודעת משתמש:", saveError)
      // נמשיך גם אם השמירה נכשלה
    }

    // עיבוד השאלה עם RAG
    console.log("🧠 מתחיל עיבוד RAG...")
    let ragResult
    try {
      ragResult = await processRAGQuery(message)
      console.log("📊 תוצאת עיבוד RAG:", {
        answerLength: ragResult.answer.length,
        sourcesCount: ragResult.sources.length,
        usedFallback: ragResult.usedFallback,
        hasError: !!ragResult.error,
      })

      // הדפסת אחוזי התאמה לקונסול
      if (ragResult.sources && ragResult.sources.length > 0) {
        console.log(
          "📊 Sources with similarity scores:",
          ragResult.sources.map((s) => ({
            title: s.title,
            similarity: Math.round(s.similarity * 100) + "%",
          })),
        )
      }

      if (ragResult.error) {
        console.log("⚠️ שגיאה בעיבוד RAG:", ragResult.error)
      }
    } catch (ragError) {
      console.error("❌ שגיאה בעיבוד RAG:", ragError)
      // fallback - תשובה גנרית
      ragResult = {
        answer: "מצטער, אירעה שגיאה בעיבוד השאלה. אנא נסה שוב או פנה לתמיכה.",
        sources: [],
        usedFallback: true,
        error: ragError instanceof Error ? ragError.message : "Unknown RAG error",
      }
    }

    // יצירת OpenAI stream עם התשובה מ-RAG
    console.log("🌊 מתחיל יצירת OpenAI stream...")

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `אתה עוזר חירום בשם עיל"ם. תענה בעברית בצורה ברורה ומועילה. 
          
          התשובה שלך צריכה להיות: ${ragResult.answer}
          
          פשוט החזר את התשובה הזו בדיוק כפי שהיא, ללא שינויים.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
      temperature: 0.1,
    })

    console.log("✅ OpenAI stream נוצר בהצלחה")

    // המרה ל-OpenAIStream
    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        console.log("💾 שומר תשובת בוט...")
        try {
          await saveChatMessage(sessionId, completion, false, ragResult.sources)
          console.log("✅ תשובת בוט נשמרה בהצלחה")
        } catch (saveError) {
          console.error("❌ שגיאה בשמירת תשובת בוט:", saveError)
        }
      },
    })

    console.log("✅ StreamingTextResponse מוכן לשליחה")

    // החזרת StreamingTextResponse תואם ל-useChat
    return new StreamingTextResponse(stream, {
      headers: {
        "X-Sources": JSON.stringify(ragResult.sources || []),
        "X-Used-Fallback": ragResult.usedFallback.toString(),
      },
    })
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
