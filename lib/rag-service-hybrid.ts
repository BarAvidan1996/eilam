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

// Utility: estimate tokens - IMPROVED
function estimateTokens(text: string): number {
  // Hebrew tends to use more tokens per character than English
  const multiplier = /[\u0590-\u05FF]/.test(text) ? 0.4 : 0.25
  return Math.ceil(text.length * multiplier)
}

// Utility: truncate by sentence - IMPROVED
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  // Try to find a sentence break
  const lastStop = Math.max(
    text.lastIndexOf(".", maxLength - 10),
    text.lastIndexOf("!", maxLength - 10),
    text.lastIndexOf("?", maxLength - 10),
  )

  if (lastStop > maxLength * 0.5) {
    return text.slice(0, lastStop + 1)
  }

  // If no good sentence break, just truncate with ellipsis
  return text.slice(0, maxLength) + "..."
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

// Step 3: Generate answer from documents - IMPROVED TOKEN MANAGEMENT
async function generateAnswerFromDocs(question: string, docs: any[], lang: "he" | "en") {
  console.log("🤖 generateAnswerFromDocs - התחלה")
  console.log("  - שאלה:", question)
  console.log("  - מסמכים:", docs.length)

  if (docs.length === 0) {
    console.log("❌ אין מסמכים - מחזיר null")
    return null
  }

  // IMPROVED: Better token management
  const MAX_CONTEXT_TOKENS = 6000 // Leave room for the prompt and completion
  let context = ""
  let contextTokens = 0

  // Sort documents by similarity (highest first)
  const sortedDocs = [...docs].sort((a, b) => b.similarity - a.similarity)

  for (const doc of sortedDocs) {
    // Estimate tokens for this document
    const docTitle = `מקור: ${doc.title}\n`
    const docTitleTokens = estimateTokens(docTitle)

    // Calculate how much content we can include
    const maxContentTokens = MAX_CONTEXT_TOKENS - contextTokens - docTitleTokens - 20 // buffer

    if (maxContentTokens <= 0) break // Stop if we're out of token budget

    // Truncate content to fit token budget
    const truncatedContent = truncateText(doc.plain_text, maxContentTokens * 4) // Convert tokens to chars
    const contentText = `תוכן: ${truncatedContent}\n\n`

    context += docTitle + contentText
    contextTokens += docTitleTokens + estimateTokens(contentText)

    // Stop if we're getting close to the limit
    if (contextTokens > MAX_CONTEXT_TOKENS * 0.9) break
  }

  console.log("📊 הקשר:", context.substring(0, 200) + "...")
  console.log("📊 אומדן טוקנים:", contextTokens)

  const prompt =
    lang === "he"
      ? `אתה עוזר חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

לפני מתן התשובה, קח צעד אחורה וחשב מה המידע המרכזי הנדרש כדי לענות על השאלה בצורה מדויקת ובטוחה.

חשיבה מופשטת:
- על מה השאלה הזו עוסקת ביסודה?
- איזה סוג תשובה צריך לתת (פרוצדורלית, עובדתית, מבוססת בטיחות)?

תשתמש קודם כל במידע של ההקשר הרלוונטי כדי לענות בעברית ברורה וידידותית לציבור, אך אם לא נמצא שם מידע מספר עלייך להשתמש בידע הכללי שלך.

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
  console.log("📊 אומדן טוקנים סופי:", totalTokens)

  if (totalTokens > 7500) {
    console.warn("⚠️ אזהרה: חריגת טוקנים אפשרית, מקצר את הפרומפט")
    // Use GPT-4o instead which has higher token limit
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      })

      const answer = res.choices[0]?.message?.content || ""
      console.log("✅ תשובה התקבלה (gpt-4o):", answer.substring(0, 200) + "...")
      return answer
    } catch (err) {
      console.error("❌ שגיאה עם gpt-4o:", err)
      throw err
    }
  }

  console.log("🔄 שולח בקשה ל-OpenAI (gpt-4)...")

  try {
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
  } catch (err) {
    console.error("❌ שגיאה עם gpt-4, מנסה gpt-4o:", err)

    // Fallback to gpt-4o with more aggressive truncation
    const shorterContext = truncateText(context, context.length * 0.6)
    const shorterPrompt = prompt.replace(context, shorterContext)

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: shorterPrompt }],
      temperature: 0.1,
      max_tokens: 500,
    })

    const answer = res.choices[0]?.message?.content || ""
    console.log("✅ תשובה התקבלה (gpt-4o fallback):", answer.substring(0, 200) + "...")
    return answer
  }
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
    model: "gpt-4o", // Use gpt-4o for fallback (higher token limit)
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
אתה עוזר חכם של פיקוד העורף.
מטרתך היא להחליט אם השאלה של המשתמש דורשת מידע עדכני מהאינטרנט או שאפשר להשיב עליה ממסמכי הדרכה קיימים.


שאלות שדורשות אינטרנט (כתוב: tavily):
- שאלות על מצב נוכחי, אירועים אחרונים, זמנים ספציפיים
- מידע שמתעדכן בזמן אמת (למשל "מה קורה עכשיו?")
- זמנים או תאריכים ("איזה אזעקות היו היום?")
- "מתי הייתה האזעקה האחרונה?"
- "מה המצב היום בעזה?"
- שאלות על חדשות, עדכונים, תאריכים

שאלות שלא דורשות אינטרנט (כתוב: documents):
- הוראות כלליות, נהלים, הדרכות
- "מה עושים באזעקה?"
- "איך מתכוננים לרעידת אדמה?"
- "מה זה מקלט?"
- "יש אזעקה ואני לא יודעת לאן ללכת"
- "איך מוצאים מקלט?"
- "מה לעשות במצב חירום?"
- שאלות על הכנה, ציוד, נהלים, הוראות בטיחות

כלל זהב: אם השאלה מתחילה ב"יש", "איך", "מה לעשות", "לאן", "איפה" (ללא זמן ספציפי) - זה documents

שאלה: ${question}

החלטה (רק tavily או documents):`

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0,
  })

  const content = res.choices[0]?.message?.content?.toLowerCase().trim()
  const decision = content?.includes("tavily") ? "tavily" : "documents"

  console.log("🧭 Router החליט:", decision, "עבור תוכן:", content)
  return decision
}

// Step 6: Hybrid process - IMPROVED ERROR HANDLING
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

  try {
    // First determine if we should use web search or documents
    const route = await routeQuery(question)
    console.log("📍 מסלול שנבחר:", route)

    if (route === "documents") {
      console.log("📚 מעבד דרך מסמכים פנימיים")

      try {
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

        try {
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
        } catch (docError) {
          console.error("❌ שגיאה בייצור תשובה ממסמכים:", docError)
          console.log("⚠️ עובר ל-fallback כללי")
          const fallbackAnswer = await generateFallbackAnswer(question, language)
          return {
            answer: fallbackAnswer,
            sources: [],
            usedFallback: true,
            usedWebSearch: false,
            error: docError instanceof Error ? docError.message : JSON.stringify(docError),
          }
        }
      } catch (embeddingError) {
        console.error("❌ שגיאה ביצירת embedding:", embeddingError)
        console.log("⚠️ עובר ל-fallback כללי")
        const fallbackAnswer = await generateFallbackAnswer(question, language)
        return {
          answer: fallbackAnswer,
          sources: [],
          usedFallback: true,
          usedWebSearch: false,
          error: embeddingError instanceof Error ? embeddingError.message : JSON.stringify(embeddingError),
        }
      }
    } else {
      console.log("🌐 מעבד דרך חיפוש אינטרנטי")
      return await processViaTavily(question, language)
    }
  } catch (err) {
    console.error("❌ שגיאה כללית בתהליך RAG:", err)

    // Last resort fallback
    try {
      const fallbackAnswer = await generateFallbackAnswer(question, language)
      return {
        answer: fallbackAnswer,
        sources: [],
        usedFallback: true,
        usedWebSearch: false,
        error: err instanceof Error ? err.message : JSON.stringify(err),
      }
    } catch (fallbackError) {
      // If even the fallback fails, return a static message
      return {
        answer:
          language === "he"
            ? "מצטער, לא הצלחתי למצוא תשובה מהימנה לשאלה זו. מומלץ לבדוק באתר פיקוד העורף או לפנות לרשות מוסמכת."
            : "Sorry, I couldn't find a reliable answer. Please check the Home Front Command website.",
        sources: [],
        usedFallback: true,
        usedWebSearch: false,
        error: `Original error: ${err instanceof Error ? err.message : JSON.stringify(err)}. Fallback error: ${
          fallbackError instanceof Error ? fallbackError.message : JSON.stringify(fallbackError)
        }`,
      }
    }
  }
}

// Step 7: Tavily-based Web Answer
async function processViaTavily(question: string, language: "he" | "en") {
  console.log("🌐 processViaTavily - התחלה")

  const searchResults = await searchWebViaTavily(question)
  if (!searchResults.success || searchResults.results.length === 0) {
    console.log("⚠️ Tavily לא מצא תוצאות, מנסה חיפוש כללי")

    // ננסה חיפוש כללי יותר
    const generalQuery = question.replace(/מתי|איפה|כמה/, "").trim()
    const retryResults = await searchWebViaTavily(generalQuery)

    if (retryResults.success && retryResults.results.length > 0) {
      console.log("✅ חיפוש כללי הצליח")
      const webAnswer = await generateAnswerFromWeb(question, retryResults.results, language)
      return {
        answer: webAnswer + "\n\n(מידע זה מבוסס על חיפוש כללי)",
        sources: retryResults.results.map((res) => ({
          title: res.title,
          file_name: `web_result_${res.url}`,
          storage_path: res.url,
          similarity: res.score,
        })),
        usedFallback: false,
        usedWebSearch: true,
      }
    }

    console.log("⚠️ גם חיפוש כללי נכשל, עובר ל-fallback")
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
