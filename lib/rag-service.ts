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

// בדיקה אם צריך להשתמש ב-Web Search
function shouldUseWebFallback(documents: any[]): boolean {
  return documents.length === 0 || documents.every((doc) => doc.similarity < 0.7)
}

// בדיקה אם התשובה לא מועילה ונדרש חיפוש ברשת
function isAnswerInsufficientForWebSearch(answer: string): boolean {
  const insufficientPhrases = [
    "לא מספקת מידע מספיק",
    "נדרש לחפש",
    "אין מידע מספיק",
    "לא ניתן לקבוע",
    "מידע עדכני באינטרנט",
    "מקורות אחרים",
    "insufficient information",
    "need to search",
    "cannot determine",
    "up-to-date information",
  ]

  return insufficientPhrases.some((phrase) => answer.toLowerCase().includes(phrase.toLowerCase()))
}

// חיפוש באינטרנט עם OpenAI Web Search
async function searchWebWithOpenAI(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean; usedWebSearch: boolean }> {
  try {
    console.log("🔍 מתחיל חיפוש באינטרנט עם OpenAI Web Search...")
    console.log("🌐 עובר לחיפוש ברשת לקבלת מידע עדכני")

    const systemPrompt =
      language === "he"
        ? "אתה עוזר AI של פיקוד העורף. חפש באינטרנט ותן תשובה מדויקת ועדכנית בעברית. ציין מקורות אם אפשר. התמקד במידע רשמי ואמין."
        : "You are an Israeli Home Front Command AI assistant. Search the web and provide accurate, up-to-date information in English. Cite sources when possible. Focus on official and reliable information."

    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content || "לא נמצאה תשובה מבוססת אינטרנט."

    // הוספת הערה על מקור המידע
    const webNote =
      language === "he"
        ? "\n\n📍 הערה: מידע זה נאסף ממקורות באינטרנט לצורך מענה עדכני ואינו מבוסס על מסמכים רשמיים של פיקוד העורף."
        : "\n\n📍 Note: This information was gathered from internet sources for up-to-date response and is not based on official Home Front Command documents."

    const finalAnswer = content + webNote

    console.log("🌐 תשובה מבוססת אינטרנט נוצרה בהצלחה")
    console.log("📄 מחזיר תשובה מחיפוש ברשת")

    return {
      answer: finalAnswer,
      usedFallback: true,
      usedWebSearch: true,
    }
  } catch (error) {
    console.error("❌ שגיאה בחיפוש ברשת:", error)

    // fallback לתשובה כללית אם גם Web Search נכשל
    return await generateFallbackAnswer(question, language)
  }
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
    storage_path: string
    similarity: number
  }>
> {
  try {
    console.log(`🔍 מחפש מסמכים בשפה: ${language}, limit: ${limit}`)
    console.log("📊 Embedding length:", embedding.length)

    const { data: functions, error: functionsError } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
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
): Promise<{ answer: string; usedFallback: boolean; usedWebSearch?: boolean }> {
  try {
    console.log(`🤖 יוצר תשובה לשאלה: "${question}"`)
    console.log(`📚 מספר מסמכים: ${documents.length}`)

    // בדיקה ראשונית אם צריך להשתמש ב-Web Search
    if (shouldUseWebFallback(documents)) {
      console.log("⚠️ לא נמצאו מסמכים רלוונטיים או שכולם עם דמיון נמוך. עובר לחיפוש ברשת.")
      return await searchWebWithOpenAI(question, language)
    }

    console.log(
      "🧠 משתמש בתשובה מבוססת מסמכים מהקשר:",
      documents.map((d) => d.title),
    )

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
        ? `אתה עוזר AI של פיקוד העורף. השתמש במידע המסופק ותן תשובה קצרה ומדויקת. אם המידע לא מספיק לתשובה מלאה, ציין זאת בבירור. ציין מקורות.`
        : `You are an Israeli Home Front Command AI assistant. Use the provided information for a concise, accurate answer. If the information is insufficient for a complete answer, state this clearly. Cite sources.`

    const userPrompt =
      language === "he"
        ? `רקע: ${stepBackPrompt}

שאלה: ${question}

מידע:
${context}

תן תשובה קצרה ומדויקת בעברית. אם המידע לא מספיק, ציין זאת בבירור.`
        : `Background: ${stepBackPrompt}

Question: ${question}

Information:
${context}

Provide a concise, accurate answer in English. If the information is insufficient, state this clearly.`

    const totalTokens = estimateTokens(systemPrompt + userPrompt)
    console.log(`📊 טוקנים משוערים לבקשה: ${totalTokens}`)

    if (totalTokens > 3500) {
      console.log("⚠️ יותר מדי טוקנים, עובר לחיפוש ברשת")
      return await searchWebWithOpenAI(question, language)
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

    // בדיקה אם התשובה לא מועילה ונדרש חיפוש ברשת
    if (isAnswerInsufficientForWebSearch(answer)) {
      console.log("🔍 התשובה לא מועילה, עובר לחיפוש ברשת לקבלת מידע עדכני")
      return await searchWebWithOpenAI(question, language)
    }

    return { answer, usedFallback: false, usedWebSearch: false }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה:", error)

    if (error instanceof Error && error.message.includes("maximum context")) {
      console.log("🔄 ניסיון חוזר עם פחות מסמכים...")
      const reducedDocuments = documents.slice(0, 1)
      return await generateAnswer(question, reducedDocuments, language)
    }

    // אם יש שגיאה, ננסה Web Search
    console.log("🔄 שגיאה ביצירת תשובה, עובר לחיפוש ברשת...")
    return await searchWebWithOpenAI(question, language)
  }
}

// תשובת fallback מקוצרת
async function generateFallbackAnswer(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean; usedWebSearch?: boolean }> {
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

    return { answer, usedFallback: true, usedWebSearch: false }
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
  usedWebSearch?: boolean
  documentsFound: number
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
    const { answer, usedFallback, usedWebSearch } = await generateAnswer(question, documents, language)

    // הכנת מקורות
    let sources = []

    if (usedWebSearch) {
      // אם השתמשנו ב-Web Search, נוסיף מקור מיוחד
      sources = [
        {
          title: "מידע מהאינטרנט",
          file_name: "web_search",
          storage_path: "",
          similarity: 0,
        },
      ]
    } else {
      // אחרת, נשתמש במקורות הרגילים
      sources = documents.map((doc) => ({
        title: doc.title,
        file_name: doc.file_name,
        storage_path: doc.storage_path,
        similarity: Math.round(doc.similarity * 100),
      }))
    }

    console.log("✅ עיבוד הושלם בהצלחה")

    return {
      answer,
      sources,
      usedFallback,
      usedWebSearch,
      documentsFound: documents.length,
    }
  } catch (error) {
    console.error("❌ שגיאה כללית בעיבוד:", error)

    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.",
      sources: [],
      usedFallback: true,
      usedWebSearch: false,
      documentsFound: 0,
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
