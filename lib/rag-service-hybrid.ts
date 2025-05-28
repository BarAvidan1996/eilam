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

תשתמש קודם כל במידע הבא כדי לענות בעברית ברורה וידידותית לציבור:

הקשר רלוונטי:
${context}

שאלה:
${question}

תשובה:`
      : `You are an AI assistant. Use only the following information.
${context}
Question: ${question}
Answer in English with sources.`

  console.log("📝 פרומפט סופי:", prompt.substring(0, 200) + "...")

  const totalTokens = estimateTokens(prompt)
  if (totalTokens > 3500) throw new Error("Too many tokens")

  console.log("🔄 שולח בקשה ל-OpenAI...")

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
  })

  const answer = res.choices[0]?.message?.content || ""
  console.log("✅ תשובה התקבלה:", answer.substring(0, 200) + "...")
  console.log("🏁 generateAnswerFromDocs - סיום")

  return answer
}

// Step 4: Fallback general GPT-only
async function generateFallbackAnswer(question: string, lang: "he" | "en") {
  console.log("🔄 generateFallbackAnswer - התחלה")

  const prompt =
    lang === "he"
      ? `אתה עוזר חכם של פיקוד העורף. ענה על השאלה הבאה בהתבסס על הידע הכללי שלך:

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

  const answer = res.choices[0]?.message?.content || ""
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
export async function processRAGQuery(question: string): Promise<{
  answer: string
  sources: Array<{
    title: string
    file_name: string
    storage_path: string
    similarity: number
  }>
  usedFallback: boolean
  usedWebSearch: boolean
  error?: string
}> {
  console.log("🚀 processRAGQuery - התחלה עבור:", question)

  const language = detectLanguage(question)
  console.log("🌐 שפה מזוהה:", language)

  const route = await routeQuery(question)
  console.log("📍 מסלול שנבחר:", route)

  try {
    if (route === "documents") {
      console.log("📚 מעבד דרך מסמכים פנימיים")

      const embedding = await createEmbedding(question)
      console.log("🔍 Embedding נוצר, אורך:", embedding.length)

      const documents = await searchSimilarDocuments(embedding, language)
      console.log("📄 מסמכים נמצאו:", documents.length)

      if (documents.length > 0) {
        console.log("📊 מסמכים עם דמיון:")
        documents.forEach((doc, i) => {
          console.log(`  ${i + 1}. ${doc.title} (${Math.round(doc.similarity * 100)}%)`)
        })
      }

      const answer = await generateAnswerFromDocs(question, documents, language)

      if (!answer || answer.length < 20) {
        console.log("⚠️ תשובה חלשה ממסמכים, עובר ל-fallback כללי")
        const fallbackAnswer = await generateFallbackAnswer(question, language)
        return {
          answer: fallbackAnswer,
          sources: [],
          usedFallback: true,
          usedWebSearch: false,
        }
      }

      return {
        answer,
        sources: documents.map((d) => ({
          title: d.title,
          file_name: d.file_name,
          storage_path: d.storage_path,
          similarity: Math.round(d.similarity * 100),
        })),
        usedFallback: false,
        usedWebSearch: false,
      }
    } else {
      console.log("🌐 מעבד דרך חיפוש אינטרנטי")
      return await processViaTavily(question, language)
    }
  } catch (err) {
    console.error("❌ שגיאה כללית בתהליך RAG:", err)
    return {
      answer:
        language === "he"
          ? "מצטער, לא הצלחתי למצוא תשובה מהימנה לשאלה זו. מומלץ לבדוק באתר פיקוד העורף או לפנות לרשות מוסמכת."
          : "Sorry, I couldn't find a reliable answer. Please check the Home Front Command website.",
      sources: [],
      usedFallback: true,
      usedWebSearch: false,
      error: err instanceof Error ? err.message : JSON.stringify(err),
    }
  }
}

// Step 7: Tavily-based Web Answer
async function processViaTavily(question: string, language: "he" | "en") {
  console.log("🌐 processViaTavily - התחלה")

  const searchResults = await searchWebViaTavily(question)
  if (!searchResults.success || searchResults.results.length === 0) {
    console.log("⚠️ Tavily לא מצא תוצאות, עובר ל-fallback כללי")
    const fallbackAnswer = await generateFallbackAnswer(question, language)
    return {
      answer: fallbackAnswer,
      sources: [],
      usedFallback: true,
      usedWebSearch: true,
    }
  }

  console.log("✅ Tavily מצא תוצאות:", searchResults.results.length)

  const webAnswer = await generateAnswerFromWeb(question, searchResults.results, language)
  return {
    answer: webAnswer,
    sources: searchResults.results.map((res) => ({
      title: res.title,
      file_name: `web_result_${res.url}`,
      storage_path: res.url,
      similarity: res.score,
    })),
    usedFallback: false,
    usedWebSearch: true,
  }
}

// Chat management functions
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
