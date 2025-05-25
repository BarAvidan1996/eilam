import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

export async function POST(req: Request) {
  console.log("🚀 API Chat - התחלת עיבוד בקשה")

  try {
    const { messages, sessionId } = await req.json()
    console.log("📦 הודעות שהתקבלו:", messages?.length || 0)
    console.log("🔑 Session ID:", sessionId)

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages are required", { status: 400 })
    }

    if (!sessionId || typeof sessionId !== "string") {
      return new Response("SessionId is required", { status: 400 })
    }

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

    // שמירת תשובת הבוט
    console.log("💾 שומר תשובת בוט...")
    await saveChatMessage(sessionId, ragResult.answer, false, ragResult.sources)

    // יצירת streaming response עם Vercel AI SDK
    const result = await streamText({
      model: openai("gpt-4"),
      messages: [
        {
          role: "system",
          content: `אתה עיל"ם, עוזר החירום של פיקוד העורף. 
          השתמש בתשובה הבאה שכבר הוכנה עבורך ותציג אותה בצורה טבעית וחלקה.
          
          תשובה מוכנה: ${ragResult.answer}
          
          מקורות: ${ragResult.sources.map((s) => s.title).join(", ")}
          
          הצג את התשובה בדיוק כמו שהיא, אבל בצורה טבעית.`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
      temperature: 0.1,
      maxTokens: 1000,
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
    console.error("💥 שגיאה כללית ב-API:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
