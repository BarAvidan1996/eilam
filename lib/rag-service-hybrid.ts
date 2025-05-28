import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { searchWebViaTavily, generateAnswerFromWeb } from "./web-search-service"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// Utility: detect language
export function detectLanguage(text: string): "he" | "en" {
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// Utility: estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Utility: truncate by sentence
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const lastStop = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"))
  return lastStop > maxLength * 0.7 ? text.slice(0, lastStop + 1) : text.slice(0, maxLength) + "..."
}

// Step 1: Create embedding
export async function createEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: "text-embedding-ada-002", input: text })
  return res.data[0].embedding
}

// Step 2: Search in internal documents (Supabase RAG)
export async function searchSimilarDocuments(embedding: number[], language: "he" | "en", limit = 3) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.8,
    match_count: limit,
    filter_language: language,
  })
  if (error) throw error
  return data || []
}

// Step 3: Generate answer from documents
async function generateAnswerFromDocs(question: string, docs: any[], lang: "he" | "en") {
  console.log("🤖 generateAnswerFromDocs - התחלה")
  console.log("  - שאלה:", question)
  console.log("  - מסמכים:", docs.length)

  if (docs.length === 0) {
    console.log("❌ אין מסמכים - מחזיר null")
    return null
  }

  let context = ""
  let len = 0
  for (const doc of docs) {
    const txt = `מקור: ${doc.title}\nתוכן: ${doc.plain_text}\n\n`
    if (len + txt.length > 2000) {
      const short = truncateText(doc.plain_text, 2000 - len - doc.title.length - 20)
      context += `מקור: ${doc.title}\nתוכן: ${short}\n\n`
      break
    }
    context += txt
    len += txt.length
  }

  console.log("📊 הקשר:", context.substring(0, 200) + "...")

  const prompt =
    lang === "he"
      ? `אתה עוזר חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

לפני מתן התשובה, קח צעד אחורה וחשב מה המידע המרכזי הנדרש כדי לענות על השאלה בצורה מדויקת ובטוחה.

חשיבה מופשטת:
- על מה השאלה הזו עוסקת ביסודה?
- איזה סוג תשובה צריך לתת (פרוצדורלית, עובדתית, מבוססת בטיחות)?

השתמש רק במידע הבא כדי לענות בעברית ברורה וידידותית לציבור:

הקשר רלוונטי:
{context}

שאלה:
{question}

תשובה:`
      : `You are an AI assistant. Use only the following information.
${context}
Question: ${question}
Answer in English with sources.`

  console.log("📝 פרומפט סופי:", prompt.substring(0, 200) + "...")

  const totalTokens = estimateTokens(prompt)
  if (totalTokens > 3500) throw new Error("Too many tokens")

  console.log("🔄 שולח בקשה ל-OpenAI...")

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    })

    return res.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// Fallback prompt
const FALLBACK_PROMPT =
  "אתה עוזר חכם של פיקוד העורף. ענה על השאלה הבאה בהתבסס על הידע הכללי שלך:\n\nשאלה: {question}\n\nתשובה:"

// Fallback general GPT-only
async function generateFallbackAnswer(question: string, lang: "he" | "en") {
  console.log("🔄 generateFallbackAnswer - התחלה")

  const prompt =
    lang === "he"
      ? `אתה עוזר חכם של פיקוד העורף בישראל. ענה על השאלה הבאה בהתבסס על הידע הכללי שלך:

שאלה: ${question}

תשובה:`
      : `You are a Home Front Command assistant. Answer the following question based on your general knowledge:

Question: ${question}

Answer:`

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
  })

  const answer = res.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  const fallbackNote =
    lang === "he"
      ? "\n\n(הערה: תשובה זו ניתנה באופן כללי לפי הבנת המערכת, ללא הסתמכות על מסמך מאומת.)"
      : "\n\n(Note: This answer was provided generally based on the system's understanding, without reliance on verified documents.)"

  console.log("✅ Fallback answer generated")
  return answer + fallbackNote
}

// Step 5: Router - decide between 'documents' and 'tavily'
async function routeQuery(question: string): Promise<"documents" | "tavily"> {
  console.log("🧭 Router - מחליט על מסלול עבור:", question)

  const prompt = `
אתה עוזר של פיקוד העורף. האם השאלה הבאה דורשת מידע עדכני מהאינטרנט (כמו חדשות, מצב נוכחי, אירועים אחרונים) או שניתן לענות עליה ממסמכי הדרכה קיימים?

דוגמאות לשאלות שדורשות אינטרנט:
- "מה המצב הנוכחי בעזה?"
- "מתי הייתה האזעקה האחרונה?"
- "מה החדשות היום?"

דוגמאות לשאלות שלא דורשות אינטרנט:
- "מה עושים באזעקה?"
- "איך מתכוננים לרעידת אדמה?"
- "מה זה מקלט?"

אם השאלה דורשת מידע עדכני מהאינטרנט, כתוב רק: tavily
אם השאלה לא דורשת מידע עדכני, כתוב רק: documents

שאלה:
${question}`

  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0,
  })

  const content = res.choices[0]?.message?.content?.toLowerCase().trim()
  const decision = content?.includes("tavily") ? "tavily" : "documents"

  console.log("🧭 Router החליט:", decision, "עבור תוכן:", content)
  return decision
}

// Step 6: Hybrid process
export async function processRAGQuery(question: string) {
  try {
    console.log("Processing RAG query:", question)

    // שלב 1: זיהוי שפה
    const language = detectLanguage(question)
    console.log("Detected language:", language)

    // שלב 2: יצירת embedding
    const embedding = await createEmbedding(question)
    console.log("Created embedding, length:", embedding.length)

    // שלב 3: חיפוש מסמכים דומים
    const documents = await searchSimilarDocuments(embedding, language)
    console.log("Found documents:", documents.length)

    // שלב 4: יצירת תשובה
    const answer = await generateAnswer(question, documents, true)

    return {
      answer,
      sources: documents.map((doc) => ({
        title: doc.title,
        file_name: doc.file_name,
        similarity: doc.similarity,
      })),
      language,
      documentsFound: documents.length,
    }
  } catch (error) {
    console.error("Error in processRAGQuery:", error)
    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.",
      sources: [],
      language: "he",
      documentsFound: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ניהול סשנים
export async function createChatSession(userId: string, title?: string) {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        title: title || "שיחה חדשה",
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating chat session:", error)
    throw error
  }
}

// שמירת הודעה
export async function saveChatMessage(sessionId: string, role: "user" | "assistant", content: string) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving chat message:", error)
    throw error
  }
}

// טעינת היסטוריית שיחה
export async function getChatHistory(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting chat history:", error)
    return []
  }
}

// טעינת סשנים של משתמש
export async function getUserChatSessions(userId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting user chat sessions:", error)
    return []
  }
}

async function generateAnswer(question: string, documents: any[], useWebSearch: boolean) {
  if (useWebSearch) {
    const route = await routeQuery(question)

    if (route === "tavily") {
      console.log("Route: Tavily")
      const webResults = await searchWebViaTavily(question)
      return await generateAnswerFromWeb(question, webResults)
    } else {
      console.log("Route: Documents")
      return await generateAnswerFromDocs(question, documents, detectLanguage(question))
    }
  } else {
    console.log("Use documents only")
    return await generateAnswerFromDocs(question, documents, detectLanguage(question))
  }
}
