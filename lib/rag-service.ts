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
  limit = 3, // הקטנתי מ-5 ל-3 כדי לחסוך טוקנים
): Promise<
  Array<{
    plain_text: string
    title: string
    file_name: string
    storage_path: string
    similarity: number
  }>
> {
  try {
    console.log(`🔍 מחפש מסמכים בשפה: ${language}, limit: ${limit}`)
    console.log("📊 Embedding length:", embedding.length)

    const { data: functions, error: functionsError } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.8, // העליתי את הסף לקבל מסמכים רלוונטיים יותר
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
        storage_path: doc.storage_path,
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
    storage_path: string
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
    const maxContextLength = 2000 // מקסימום תווים להקשר
    let context = ""
    let currentLength = 0

    for (const doc of documents) {
      const docText = `מקור: ${doc.title}\nתוכן: ${doc.plain_text}\n\n`

      if (currentLength + docText.length > maxContextLength) {
        // אם המסמך גדול מדי, חותכים אותו
        const remainingSpace = maxContextLength - currentLength
        if (remainingSpace > 200) {
          // רק אם יש מספיק מקום למשהו משמעותי
          const truncatedText = truncateText(doc.plain_text, remainingSpace - doc.title.length - 20)
          context += `מקור: ${doc.title}\nתוכן: ${truncatedText}\n\n`
        }
        break
      }

      context += docText
      currentLength += docText.length
    }

    console.log(`📊 אורך הקשר סופי: ${context.length} תווים (${estimateTokens(context)} טוקנים משוערים)`)

    // Step-back prompting מקוצר
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

    // חישוב טוקנים משוער
    const totalTokens = estimateTokens(systemPrompt + userPrompt)
    console.log(`📊 טוקנים משוערים לבקשה: ${totalTokens}`)

    if (totalTokens > 3500) {
      // השארתי מרווח בטיחות
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
      max_tokens: 800, // הקטנתי מ-1000 ל-800
    })

    const answer = completion.choices[0]?.message?.content || ""
    console.log("✅ תשובה נוצרה בהצלחה, אורך:", answer.length)

    return { answer, usedFallback: false }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה:", error)

    // אם זו שגיאת טוקנים, ננסה עם פחות מסמכים
    if (error instanceof Error && error.message.includes("maximum context")) {
      console.log("🔄 ניסיון חוזר עם פחות מסמכים...")
      const reducedDocuments = documents.slice(0, 1) // רק המסמך הכי רלוונטי
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
      max_tokens: 300, // הקטנתי מ-500 ל-300
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
    storage_path: string
    similarity: number
  }>
  usedFallback: boolean
  error?: string
}> {
  try {
    console.log("🚀 מתחיל עיבוד שאלה:", question)

    // זיהוי שפה
    const language = detectLanguage(question)
    console.log("🌐 שפה שזוהתה:", language)

    // יצירת embedding
    const embedding = await createEmbedding(question)

    // חיפוש מסמכים
    const documents = await searchSimilarDocuments(embedding, language)

    // יצירת תשובה
    const { answer, usedFallback } = await generateAnswer(question, documents, language)

    // הכנת מקורות
    const sources = documents.map((doc) => ({
      title: doc.title,
      file_name: doc.file_name,
      storage_path: doc.storage_path,
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

// ניהול שיחות - יצירת session חדש עם user_id
export async function createChatSession(userId?: string): Promise<string> {
  try {
    console.log("🆕 יוצר chat session חדש עבור user:", userId)

    const sessionData: any = {
      created_at: new Date().toISOString(),
    }

    // אם יש user_id, נוסיף אותו
    if (userId) {
      sessionData.user_id = userId
      console.log("👤 מוסיף user_id לsession:", userId)
    }

    const { data, error } = await supabase.from("chat_sessions").insert(sessionData).select("id").single()

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
  sources?: Array<{ title: string; file_name: string; storage_path: string; similarity: number }>,
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
    sources: Array<{ title: string; file_name: string; storage_path: string; similarity: number }>
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
