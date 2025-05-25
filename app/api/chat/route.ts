import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    // קריאת הגוף של הבקשה
    const body = await request.json()
    console.log("📦 גוף הבקשה שהתקבל:", JSON.stringify(body, null, 2))

    // useChat שולח messages array ו-sessionId בנפרד
    const { messages, sessionId } = body

    console.log("🔍 Raw data from body:")
    console.log("  - messages:", messages)
    console.log("  - sessionId:", sessionId)
    console.log("  - messages type:", typeof messages)
    console.log("  - messages length:", messages?.length)

    // הודעה אחרונה היא השאלה הנוכחית
    const lastMessage = messages?.[messages.length - 1]
    const message = lastMessage?.content

    console.log("🔍 פירוק פרמטרים:")
    console.log("  - lastMessage:", lastMessage)
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
      throw saveError
    }

    // עיבוד השאלה
    console.log("🧠 מתחיל עיבוד RAG...")
    let result
    try {
      result = await processRAGQuery(message)
      console.log("📊 תוצאת עיבוד RAG:", {
        answerLength: result.answer.length,
        sourcesCount: result.sources.length,
        usedFallback: result.usedFallback,
        hasError: !!result.error,
      })
    } catch (ragError) {
      console.error("❌ שגיאה בעיבוד RAG:", ragError)
      throw ragError
    }

    // הדפסת אחוזי התאמה לקונסול
    if (result.sources && result.sources.length > 0) {
      console.log(
        "📊 Sources with similarity scores:",
        result.sources.map((s) => ({
          title: s.title,
          similarity: Math.round(s.similarity * 100) + "%",
        })),
      )
    }

    if (result.error) {
      console.log("⚠️ שגיאה בעיבוד RAG:", result.error)
    }

    // יצירת streaming response
    console.log("🌊 מתחיל יצירת streaming response...")
    const encoder = new TextEncoder()
    let fullAnswer = ""

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("🎬 מתחיל streaming של התשובה...")
          // שליחת התשובה במקטעים קטנים לאפקט streaming
          const words = result.answer.split(" ")
          console.log("📝 מספר מילים לשליחה:", words.length)

          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : " " + words[i]
            fullAnswer += chunk

            // שליחת המקטע
            controller.enqueue(encoder.encode(chunk))

            // השהיה קטנה לאפקט streaming
            await new Promise((resolve) => setTimeout(resolve, 50))
          }

          console.log("✅ סיום streaming")
          controller.close()

          // שמירת תשובת הבוט אחרי שהסטרימינג הסתיים
          console.log("💾 שומר תשובת בוט...")
          try {
            await saveChatMessage(sessionId, fullAnswer, false, result.sources)
            console.log("✅ תשובת בוט נשמרה בהצלחה")
          } catch (saveError) {
            console.error("❌ שגיאה בשמירת תשובת בוט:", saveError)
          }
        } catch (streamError) {
          console.error("❌ שגיאה בסטרימינג:", streamError)
          controller.error(streamError)
        }
      },
    })

    // החזרת streaming response עם headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Sources": JSON.stringify(result.sources || []),
        "X-Used-Fallback": result.usedFallback.toString(),
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
