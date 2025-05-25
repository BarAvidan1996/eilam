import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(req: Request) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    const body = await req.json()
    console.log("📦 גוף הבקשה שהתקבל:", JSON.stringify(body, null, 2))

    const { messages, sessionId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log("❌ שגיאה: messages לא תקין")
      return new Response("Messages are required", { status: 400 })
    }

    if (!sessionId || typeof sessionId !== "string") {
      console.log("❌ שגיאה: sessionId לא תקין")
      return new Response("SessionId is required", { status: 400 })
    }

    console.log("✅ פרמטרים תקינים, מתחיל עיבוד")

    // ההודעה האחרונה היא השאלה של המשתמש
    const lastMessage = messages[messages.length - 1]
    const userQuestion = lastMessage.content

    console.log("💬 שאלת המשתמש:", userQuestion)

    // שמירת הודעת המשתמש
    console.log("💾 שומר הודעת משתמש...")
    await saveChatMessage(sessionId, userQuestion, true)

    // עיבוד RAG
    console.log("🧠 מתחיל עיבוד RAG...")
    const ragResult = await processRAGQuery(userQuestion)

    console.log("📊 תוצאת RAG:", {
      answerLength: ragResult.answer.length,
      sourcesCount: ragResult.sources.length,
      usedFallback: ragResult.usedFallback,
    })

    // יצירת streaming response עם Vercel AI SDK
    const result = await streamText({
      model: openai("gpt-4"),
      messages: [
        {
          role: "system",
          content: `אתה עיל"ם, עוזר החירום של פיקוד העורף. 
          הצג את התשובה הבאה בצורה טבעית וחלקה:
          
          ${ragResult.answer}`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
      temperature: 0.1,
      maxTokens: 1000,
      onFinish: async (result) => {
        // שמירת תשובת הבוט אחרי שהstreaming מסתיים
        console.log("💾 שומר תשובת בוט...")
        await saveChatMessage(sessionId, result.text, false, ragResult.sources)
        console.log("✅ תשובת בוט נשמרה בהצלחה")
      },
    })

    // הוספת metadata למטא-דאטה של הresponse
    return result.toAIStreamResponse({
      headers: {
        "X-RAG-Sources": JSON.stringify(ragResult.sources),
        "X-RAG-Fallback": ragResult.usedFallback.toString(),
        "X-Session-ID": sessionId,
      },
    })
  } catch (error) {
    console.error("💥 שגיאה כללית ב-API:")
    console.error("  - Error type:", error?.constructor?.name)
    console.error("  - Error message:", error instanceof Error ? error.message : String(error))
    console.error("  - Error stack:", error instanceof Error ? error.stack : "No stack")

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
