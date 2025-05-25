import type { NextRequest } from "next/server"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    const body = await request.json()
    console.log("📦 גוף הבקשה שהתקבל:", JSON.stringify(body, null, 2))

    const { message, sessionId } = body

    if (!message || typeof message !== "string" || message.trim() === "") {
      console.log("❌ שגיאה: message לא תקין")
      return new Response(
        JSON.stringify({
          error: "Message is required and must be a non-empty string",
          received: { message, sessionId },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!sessionId || typeof sessionId !== "string") {
      console.log("❌ שגיאה: sessionId לא תקין")
      return new Response(
        JSON.stringify({
          error: "SessionId is required and must be a string",
          received: { message, sessionId },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("✅ פרמטרים תקינים, מתחיל עיבוד")

    // שמירת הודעת המשתמש
    console.log("💾 שומר הודעת משתמש...")
    await saveChatMessage(sessionId, message, "user")
    console.log("✅ הודעת משתמש נשמרה בהצלחה")

    // יצירת streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("🧠 מתחיל עיבוד RAG...")

          // עיבוד השאלה עם callback לstreaming
          const result = await processRAGQuery(message, (chunk: string) => {
            // שליחת chunk למשתמש
            const data =
              JSON.stringify({
                type: "chunk",
                content: chunk,
              }) + "\n"
            controller.enqueue(encoder.encode(data))
          })

          console.log("📊 תוצאת עיבוד RAG:", {
            answerLength: result.answer.length,
            sourcesCount: result.sources.length,
            usedFallback: result.usedFallback,
            hasError: !!result.error,
          })

          // שליחת התוצאה הסופית
          const finalData =
            JSON.stringify({
              type: "final",
              answer: result.answer,
              sources: result.sources,
              usedFallback: result.usedFallback,
              sessionId: sessionId,
              ...(result.error && { debugError: result.error }),
            }) + "\n"

          controller.enqueue(encoder.encode(finalData))

          // שמירת תשובת הבוט
          console.log("💾 שומר תשובת בוט...")
          await saveChatMessage(sessionId, result.answer, "assistant", result.sources)
          console.log("✅ תשובת בוט נשמרה בהצלחה")

          controller.close()
        } catch (error) {
          console.error("💥 שגיאה בעיבוד:", error)

          const errorData =
            JSON.stringify({
              type: "error",
              error: "שגיאה פנימית בשרת",
              debugError: error instanceof Error ? error.message : JSON.stringify(error),
            }) + "\n"

          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("💥 שגיאה כללית ב-API:", error)

    return new Response(
      JSON.stringify({
        error: "שגיאה פנימית בשרת",
        debugError: error instanceof Error ? error.message : JSON.stringify(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
