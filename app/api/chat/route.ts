import { type NextRequest, NextResponse } from "next/server"

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

    // תשובה פשוטה לבדיקה (ללא RAG)
    const simpleAnswer = `שלום! קיבלתי את השאלה שלך: "${message}". זוהי תשובה פשוטה לבדיקת הסטרימינג. אני עובד על שיפור התשובות שלי.`

    console.log("🧪 משתמש בתשובה פשוטה לבדיקה")

    // יצירת streaming response פשוט
    console.log("🌊 מתחיל יצירת streaming response...")
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("🎬 מתחיל streaming של התשובה...")
          // שליחת התשובה במקטעים קטנים לאפקט streaming
          const words = simpleAnswer.split(" ")
          console.log("📝 מספר מילים לשליחה:", words.length)

          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : " " + words[i]

            // שליחת המקטע בפורמט שתואם ל-useChat
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
            console.log(`📤 שלחתי מקטע ${i + 1}/${words.length}: "${chunk}"`)

            // השהיה קטנה לאפקט streaming
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          // סיום הסטרימינג
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          console.log("✅ סיום streaming")
          controller.close()
        } catch (streamError) {
          console.error("❌ שגיאה בסטרימינג:", streamError)
          controller.error(streamError)
        }
      },
    })

    console.log("✅ Response מוכן לשליחה")

    // החזרת streaming response עם headers נכונים
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Sources": JSON.stringify([]),
        "X-Used-Fallback": "true",
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
