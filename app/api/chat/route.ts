import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("🎯 Chat API - קיבלתי בקשה:", body)

    // useChat שולח messages array ו-sessionId בנפרד
    const { messages, sessionId } = body

    // הודעה אחרונה היא השאלה הנוכחית
    const lastMessage = messages[messages.length - 1]
    const message = lastMessage?.content

    console.log("📝 Extracted data:", { message, sessionId, messagesCount: messages?.length })

    if (!message || !sessionId) {
      console.log("❌ Missing data:", { hasMessage: !!message, hasSessionId: !!sessionId })
      return new Response(JSON.stringify({ error: "Missing message or sessionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // שמירת הודעת המשתמש
    await saveChatMessage(sessionId, message, true)

    // עיבוד RAG
    const ragResult = await processRAGQuery(message)

    console.log(
      "📊 RAG Result sources:",
      ragResult.sources?.map((s) => ({
        title: s.title,
        similarity: Math.round(s.similarity * 100) + "%",
      })),
    )

    // הכנת הקשר למודל
    let context = ""
    if (ragResult.sources && ragResult.sources.length > 0) {
      context = ragResult.sources.map((source) => `מקור: ${source.title}\nתוכן: ${source.content}`).join("\n\n")
    }

    const systemPrompt = `אתה עיל"ם, עוזר החירום האישי של פיקוד העורף. 
תן תשובה קצרה ומדויקת בעברית בהתבסס על המידע המסופק.
${context ? `\n\nמידע רלוונטי:\n${context}` : ""}`

    // יצירת streaming response עם OpenAI ישירות
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
    })

    // המרה ל-stream של Vercel
    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        // שמירת התשובה המלאה אחרי שהיא מסתיימת
        await saveChatMessage(sessionId, completion, false, ragResult.sources)
      },
    })

    // החזרת streaming response עם metadata
    return new StreamingTextResponse(stream, {
      headers: {
        "X-Sources": JSON.stringify(ragResult.sources || []),
        "X-Used-Fallback": ragResult.usedFallback.toString(),
      },
    })
  } catch (error) {
    console.error("💥 Chat API Error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
