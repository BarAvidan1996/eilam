import { streamText, StreamingTextResponse } from "ai"
import { openai } from "@ai-sdk/openai"
import { processRAGQuery, saveChatMessage } from "@/lib/rag-service"

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

    // יצירת streaming response
    const result = await streamText({
      model: openai("gpt-4"),
      system: systemPrompt,
      prompt: message,
      temperature: 0.3,
      maxTokens: 800,
    })

    // שמירת התשובה המלאה אחרי שהיא מסתיימת
    result.finishReason.then(async () => {
      const fullText = await result.text
      await saveChatMessage(sessionId, fullText, false, ragResult.sources)
    })

    // החזרת streaming response עם metadata - התיקון כאן!
    return new StreamingTextResponse(result.toAIStream(), {
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
