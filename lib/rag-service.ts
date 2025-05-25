import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// זיהוי שפה
export function detectLanguage(text: string): "he" | "en" {
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// פונקציה לחיתוך טקסט חכם
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  // חיתוך במשפט שלם אם אפשר
  const truncated = text.substring(0, maxLength)
  const lastSentence = truncated.lastIndexOf(".")
  const lastQuestion = truncated.lastIndexOf("?")
  const lastExclamation = truncated.lastIndexOf("!")

  const lastPunctuation = Math.max(lastSentence, lastQuestion, lastExclamation)

  if (lastPunctuation > maxLength * 0.7) {
    return truncated.substring(0, lastPunctuation + 1)
  }

  return truncated + "..."
}

// חישוב מספר טוקנים משוער (4 תווים = 1 טוקן בממוצע)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// יצירת embedding
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    console.log("🔄 יוצר embedding עבור:", text.substring(0, 100) + "...")

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    })

    console.log("✅ Embedding נוצר בהצלחה, אורך:", response.data[0].embedding.length)
    return response.data[0].embedding
  } catch (error) {
    console.error("❌ שגיאה ביצירת embedding:", error)
    throw new Error(`שגיאה ביצירת embedding: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`)
  }
}

// חיפוש מסמכים דומים
export async function searchSimilarDocuments(
  embedding: number[],
  language: "he" | "en",
  limit = 3,
): Promise<
  Array<{
    plain_text: string
    title: string
    file_name: string
    similarity: number
  }>
> {
  try {
    console.log(`🔍 מחפש מסמכים בשפה: ${language}, limit: ${limit}`)
    console.log("📊 Embedding length:", embedding.length)

    const { data: functions, error: functionsError } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.2, // הורדתי חזרה ל-0.2 כדי למצוא יותר מסמכים
      match_count: limit,
      filter_language: language,
    })

    if (functionsError) {
      console.error("❌ שגיאה בקריאה ל-RPC match_documents:", functionsError)
      throw new Error(`שגיאה בחיפוש מסמכים: ${functionsError.message}`)
    }

    console.log(`✅ נמצאו ${functions?.length || 0} מסמכים`)
    console.log(
      "📄 מסמכים שנמצאו:",
      functions?.map((doc) => ({
        title: doc.title,
        similarity: doc.similarity,
        text_preview: doc.plain_text?.substring(0, 100) + "...",
      })),
    )

    return functions || []
  } catch (error) {
    console.error("❌ שגיאה בחיפוש מסמכים:", error)
    throw error
  }
}

// יצירת תשובה עם step-back prompting וניהול טוקנים חכם
export async function generateAnswer(
  question: string,
  documents: Array<{
    plain_text: string
    title: string
    file_name: string
    similarity: number
  }>,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean }> {
  try {
    console.log(`🤖 יוצר תשובה לשאלה: "${question}"`)
    console.log(`📚 מספר מסמכים: ${documents.length}`)

    if (documents.length === 0) {
      console.log("⚠️ אין מסמכים רלוונטיים, משתמש ב-fallback")
      return await generateFallbackAnswer(question, language)
    }

    // הכנת הקשר עם ניהול טוקנים חכם
    const maxContextLength = 2000
    let context = ""
    let currentLength = 0

    for (const doc of documents) {
      const docText = `מקור: ${doc.title}\nתוכן: ${doc.plain_text}\n\n`

      if (currentLength + docText.length > maxContextLength) {
        const remainingSpace = maxContextLength - currentLength
        if (remainingSpace > 200) {
          const truncatedText = truncateText(doc.plain_text, remainingSpace - doc.title.length - 20)
          context += `מקור: ${doc.title}\nתוכן: ${truncatedText}\n\n`
        }
        break
      }

      context += docText
      currentLength += docText.length
    }

    console.log(`📊 אורך הקשר סופי: ${context.length} תווים (${estimateTokens(context)} טוקנים משוערים)`)

    const stepBackPrompt =
      language === "he" ? `עקרונות כלליים לשאלה: "${question}"` : `General principles for: "${question}"`

    const systemPrompt =
      language === "he"
        ? `אתה עוזר AI של פיקוד העורף. השתמש במידע המסופק ותן תשובה קצרה ומדויקת. ציין מקורות.`
        : `You are an Israeli Home Front Command AI assistant. Use the provided information for a concise, accurate answer. Cite sources.`

    const userPrompt =
      language === "he"
        ? `רקע: ${stepBackPrompt}

שאלה: ${question}

מידע:
${context}

תן תשובה קצרה ומדויקת בעברית.`
        : `Background: ${stepBackPrompt}

Question: ${question}

Information:
${context}

Provide a concise, accurate answer in English.`

    const totalTokens = estimateTokens(systemPrompt + userPrompt)
    console.log(`📊 טוקנים משוערים לבקשה: ${totalTokens}`)

    if (totalTokens > 3500) {
      console.log("⚠️ יותר מדי טוקנים, עובר ל-fallback")
      return await generateFallbackAnswer(question, language)
    }

    console.log("🔄 שולח בקשה ל-OpenAI...")

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const answer = completion.choices[0]?.message?.content || ""
    console.log("✅ תשובה נוצרה בהצלחה, אורך:", answer.length)

    return { answer, usedFallback: false }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה:", error)

    if (error instanceof Error && error.message.includes("maximum context")) {
      console.log("🔄 ניסיון חוזר עם פחות מסמכים...")
      const reducedDocuments = documents.slice(0, 1)
      return await generateAnswer(question, reducedDocuments, language)
    }

    throw new Error(`שגיאה ביצירת תשובה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`)
  }
}

// תשובת fallback מקוצרת
async function generateFallbackAnswer(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean }> {
  try {
    console.log("🔄 יוצר תשובת fallback...")

    const systemPrompt =
      language === "he"
        ? `תן תשובה קצרה ומועילה. ציין שהמידע אינו מבוסס על מסמכים רשמיים של פיקוד העורף.`
        : `Provide a brief, helpful answer. Mention that information is not based on official Home Front Command documents.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const answer = completion.choices[0]?.message?.content || ""
    console.log("✅ תשובת fallback נוצרה בהצלחה")

    return { answer, usedFallback: true }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובת fallback:", error)
    throw error
  }
}

// הפונקציה הראשית
export async function processRAGQuery(question: string): Promise<{
  answer: string
  sources: Array<{
    title: string
    file_name: string
    similarity: number
  }>
  usedFallback: boolean
  error?: string
}> {
  try {
    console.log("🚀 מתחיל עיבוד שאלה:", question)

    const language = detectLanguage(question)
    console.log("🌐 שפה שזוהתה:", language)

    const embedding = await createEmbedding(question)
    const documents = await searchSimilarDocuments(embedding, language)
    const { answer, usedFallback } = await generateAnswer(question, documents, language)

    const sources = documents.map((doc) => ({
      title: doc.title,
      file_name: doc.file_name,
      similarity: Math.round(doc.similarity * 100),
    }))

    console.log("✅ עיבוד הושלם בהצלחה")

    return {
      answer,
      sources,
      usedFallback,
    }
  } catch (error) {
    console.error("❌ שגיאה כללית בעיבוד:", error)

    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.",
      sources: [],
      usedFallback: true,
      error: error instanceof Error ? error.message : JSON.stringify(error),
    }
  }
}

// ניהול שיחות - יצירת session חדש
export async function createChatSession(): Promise<string> {
  try {
    console.log("🆕 יוצר chat session חדש...")

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("❌ שגיאה ביצירת session:", error)
      throw error
    }

    console.log("✅ Session נוצר בהצלחה:", data.id)
    return data.id
  } catch (error) {
    console.error("❌ שגיאה ביצירת סשן:", error)
    throw error
  }
}

export async function saveChatMessage(
  sessionId: string,
  message: string,
  isUser: boolean,
  sources?: Array<{ title: string; file_name: string; similarity: number }>,
): Promise<void> {
  try {
    console.log(`💾 שומר הודעה: ${isUser ? "משתמש" : "בוט"} - ${message.substring(0, 50)}...`)
    console.log(`📊 מקורות לשמירה:`, sources?.length || 0)

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      content: message,
      role: isUser ? "user" : "assistant",
      sources: sources || [],
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ שגיאה בשמירת הודעה:", error)
      throw error
    }

    console.log("✅ הודעה נשמרה בהצלחה")
  } catch (error) {
    console.error("❌ שגיאה בשמירת הודעה:", error)
    throw error
  }
}

export async function getChatHistory(sessionId: string): Promise<
  Array<{
    id: string
    content: string
    role: string
    sources: Array<{ title: string; file_name: string; similarity: number }>
    created_at: string
  }>
> {
  try {
    console.log("📚 טוען היסטוריית צ'אט עבור session:", sessionId)

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ שגיאה בטעינת היסטוריה:", error)
      throw error
    }

    console.log(`✅ נטענו ${data?.length || 0} הודעות`)
    return data || []
  } catch (error) {
    console.error("❌ שגיאה בטעינת היסטוריה:", error)
    return []
  }
}
