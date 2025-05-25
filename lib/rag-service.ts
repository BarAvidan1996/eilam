import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

console.log("💥 [processRAGQuery] TEST: זו הגרסה הנכונה של הפונקציה!")

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

// בדיקה סמנטית עם GPT אם התשובה מספקת - תמיד מתבצעת!
async function isAnswerInsufficientByGPT(question: string, answer: string, language: "he" | "en"): Promise<boolean> {
  console.log("🧠 [isAnswerInsufficientByGPT] *** התחלת בדיקת איכות התשובה עם GPT ***")
  try {
    console.log("🔍 [isAnswerInsufficientByGPT] שאלה:", question)
    console.log("📄 [isAnswerInsufficientByGPT] תשובה לבדיקה:", answer.substring(0, 200) + "...")

    const prompt =
      language === "he"
        ? `שאלה: "${question}"\nתשובה: "${answer}"\n\nהאם התשובה מספקת, ישירה וברורה? ענה רק ב"כן" או "לא".`
        : `Question: "${question}"\nAnswer: "${answer}"\n\nIs the answer direct, accurate and sufficient? Answer only "yes" or "no".`

    console.log("📤 [isAnswerInsufficientByGPT] שולח בקשה לGPT לבדיקת איכות...")
    console.log("🔧 [isAnswerInsufficientByGPT] משתמש במודל: gpt-4o")

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 5,
      temperature: 0,
    })

    const reply = result.choices[0]?.message?.content?.toLowerCase().trim()
    console.log("📥 [isAnswerInsufficientByGPT] תגובת GPT RAW:", `"${result.choices[0]?.message?.content}"`)
    console.log("📥 [isAnswerInsufficientByGPT] תגובת GPT מעובדת:", `"${reply}"`)

    const isInsufficient = reply === "no" || reply === "לא"
    console.log(
      `🎯 [isAnswerInsufficientByGPT] *** הערכה סופית: "${reply}" - ${isInsufficient ? "❌ לא מספקת - עובר לWeb Search" : "✅ מספקת - ממשיך עם התשובה"} ***`,
    )

    return isInsufficient
  } catch (error) {
    console.error("❌ [isAnswerInsufficientByGPT] שגיאה בבדיקת איכות התשובה:", error)
    console.log("⚠️ [isAnswerInsufficientByGPT] בגלל שגיאה, ממשיך עם התשובה הקיימת (לא עובר לWeb Search)")
    return false
  }
}

// חיפוש באינטרנט עם OpenAI Web Search
async function searchWebWithOpenAI(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean; usedWebSearch: boolean }> {
  try {
    console.log("🔍 [searchWebWithOpenAI] *** מתחיל חיפוש באינטרנט עם OpenAI Web Search ***")
    console.log("🌐 [searchWebWithOpenAI] עובר לחיפוש ברשת לקבלת מידע עדכני")

    const systemPrompt =
      language === "he"
        ? "אתה עוזר AI של פיקוד העורף. חפש באינטרנט ותן תשובה מדויקת, עדכנית ואמינה בעברית. ציין מקורות אם אפשר."
        : "You are an AI assistant for Home Front Command. Search the web and return an accurate, up-to-date and reliable answer in English. Cite sources when possible."

    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || "לא נמצאה תשובה עדכנית באינטרנט."

    // הוספת הערה על מקור המידע
    const webNote =
      language === "he"
        ? "\n\n📍 הערה: מידע זה נאסף מהאינטרנט ולא מבוסס על מסמכים רשמיים של פיקוד העורף."
        : "\n\n📍 Note: This information was gathered from the internet and is not based on official Home Front Command documents."

    const finalAnswer = content + webNote

    console.log("🌐 [searchWebWithOpenAI] *** תשובה מבוססת אינטרנט נוצרה בהצלחה ***")
    console.log("📄 [searchWebWithOpenAI] מחזיר תשובה מחיפוש ברשת")

    return {
      answer: finalAnswer,
      usedFallback: true,
      usedWebSearch: true,
    }
  } catch (error) {
    console.error("❌ [searchWebWithOpenAI] שגיאה בחיפוש ברשת:", error)

    // fallback לתשובה כללית אם גם Web Search נכשל
    return await generateFallbackAnswer(question, language)
  }
}

// בניית הקשר מהמסמכים
function buildContextFromDocuments(
  documents: Array<{
    plain_text: string
    title: string
    file_name: string
    storage_path: string
    similarity: number
  }>,
): string {
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
  return context
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
  console.log("🤖 [generateAnswer] *** 1. התחלת הפונקציה ***")
  try {
    console.log("🤖 [generateAnswer] *** 2. נכנס ל-try block ***")
    console.log("🤖 [generateAnswer] *** 3. שאלה:", question, "***")
    console.log("📚 [generateAnswer] *** 4. מסמכים שנמצאו:", documents.length, "***")

    // 🧪 שלב 1: אם אין כלל מסמכים → מיד עובר ל־Web Search
    console.log("🤖 [generateAnswer] *** 5. בודק אם אין מסמכים כלל ***")
    if (documents.length === 0) {
      console.log("⚠️ [generateAnswer] *** 6. לא נמצאו מסמכים כלל, מפעיל Web Search ***")
      const webSearchResult = await searchWebWithOpenAI(question, language)
      console.log("🤖 [generateAnswer] *** 7. Web Search result:", webSearchResult, "***")
      return webSearchResult
    }

    console.log("🧱 [generateAnswer] *** 8. בונה הקשר מהמסמכים ***")

    // 🧱 שלב 2: בניית הקשר מהמסמכים
    console.log("🤖 [generateAnswer] *** 9. קורא ל-buildContextFromDocuments ***")
    const context = buildContextFromDocuments(documents)
    console.log("🤖 [generateAnswer] *** 10. buildContextFromDocuments הושלם ***")

    console.log(
      `📊 [generateAnswer] *** 11. אורך הקשר: ${context.length} תווים (${estimateTokens(context)} טוקנים משוערים) ***`,
    )

    console.log("🤖 [generateAnswer] *** 12. מכין system prompt ***")
    const systemPrompt =
      language === "he"
        ? `אתה עוזר AI של פיקוד העורף. השתמש רק במידע המסופק. אם אין מספיק מידע, ציין זאת במפורש.`
        : `You are an AI assistant for Home Front Command. Use only the provided information. If there's insufficient information, state this explicitly.`

    console.log("🤖 [generateAnswer] *** 13. מכין user prompt ***")
    const userPrompt =
      language === "he"
        ? `שאלה: ${question}\n\nמידע:\n${context}\n\nענה בצורה מדויקת. אם אין מספיק מידע, אמור זאת.`
        : `Question: ${question}\n\nInformation:\n${context}\n\nAnswer accurately. If there's insufficient information, say so.`

    console.log("🤖 [generateAnswer] *** 14. מחשב טוקנים ***")
    const totalTokens = estimateTokens(systemPrompt + userPrompt)
    console.log(`📊 [generateAnswer] *** 15. טוקנים משוערים לבקשה: ${totalTokens} ***`)

    console.log("🤖 [generateAnswer] *** 16. בודק אם יותר מדי טוקנים ***")
    if (totalTokens > 3500) {
      console.log("⚠️ [generateAnswer] *** 17. יותר מדי טוקנים, עובר ל-Web Search ***")
      return await searchWebWithOpenAI(question, language)
    }

    console.log("🔄 [generateAnswer] *** 18. שולח בקשה ל-OpenAI... ***")

    console.log("🤖 [generateAnswer] *** 19. קורא ל-openai.chat.completions.create ***")
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })
    console.log("🤖 [generateAnswer] *** 20. openai.chat.completions.create הושלם ***")

    console.log("🤖 [generateAnswer] *** 21. מחלץ תשובה מהתגובה ***")
    const answer = completion.choices[0]?.message?.content || ""
    console.log("✅ [generateAnswer] *** 22. תשובה ראשונית נוצרה! ***")
    console.log("📝 [generateAnswer] *** 23. תשובה:", answer.substring(0, 200) + "... ***")
    console.log("🧪 [generateAnswer] *** 24. האם יש בכלל תשובה לבדוק?", answer?.length, "תווים ***")

    // בדיקה אם התשובה ריקה
    console.log("🤖 [generateAnswer] *** 25. בודק אם התשובה ריקה ***")
    if (answer.trim().length === 0) {
      console.log("⚠️ [generateAnswer] *** 26. תשובה ריקה – מפעיל Web Search ישירות ***")
      return await searchWebWithOpenAI(question, language)
    }

    // 🧠 שלב 3: בדיקה עם GPT האם התשובה מספקת - תמיד מתבצעת!
    console.log("🔍 [generateAnswer] *** 27. מתחיל בדיקת איכות התשובה - תמיד מתבצעת! ***")

    console.log("🤖 [generateAnswer] *** 28. קורא ל-isAnswerInsufficientByGPT ***")
    const isBadAnswer = await isAnswerInsufficientByGPT(question, answer, language)
    console.log("🤖 [generateAnswer] *** 29. isAnswerInsufficientByGPT הושלם ***")

    console.log("🎯 [generateAnswer] *** 30. תוצאת בדיקת איכות:", isBadAnswer ? "❌ לא מספקת" : "✅ מספקת", "***")

    console.log("🤖 [generateAnswer] *** 31. בודק אם התשובה לא מספקת ***")
    if (isBadAnswer) {
      console.log("🔍 [generateAnswer] *** 32. התשובה לא מספקת לפי GPT – עובר ל־Web Search ***")
      return await searchWebWithOpenAI(question, language)
    }

    console.log("✅ [generateAnswer] *** 33. התשובה נבדקה ונמצאה מספקת - משתמש בתשובה מהמסמכים ***")

    console.log("🤖 [generateAnswer] *** 34. מחזיר תשובה סופית ***")
    return {
      answer,
      usedFallback: false,
      usedWebSearch: false,
    }
  } catch (error) {
    console.error("❌ [generateAnswer] *** 35. שגיאה ביצירת תשובה:", error, "***")

    if (error instanceof Error && error.message.includes("maximum context")) {
      console.log("🔄 [generateAnswer] *** 36: ניסיון חוזר עם פחות מסמכים... ***")
      const reducedDocuments = documents.slice(0, 1)
      return await generateAnswer(question, language)
    }

    // אם יש שגיאה, ננסה Web Search
    console.log("🔄 [generateAnswer] *** 37: שגיאה ביצירת תשובה, עובר ל-Web Search... ***")
    return await searchWebWithOpenAI(question, language)
  }
}

// תשובת fallback מקוצרת
async function generateFallbackAnswer(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean; usedWebSearch?: boolean }> {
  try {
    console.log("🔄 [generateFallbackAnswer] יוצר תשובת fallback...")

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
    console.log("✅ [generateFallbackAnswer] תשובת fallback נוצרה בהצלחה")

    return { answer, usedFallback: true, usedWebSearch: false }
  } catch (error) {
    console.error("❌ [generateFallbackAnswer] שגיאה ביצירת תשובת fallback:", error)
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
    sourceType: "official" | "web" | "ai_generated"
  }>
  usedFallback: boolean
  usedWebSearch?: boolean
  error?: string
}> {
  try {
    console.log("🚀 [processRAGQuery] *** 1. מתחיל עיבוד שאלה ***")
    console.log("🚀 [processRAGQuery] *** 2. שאלה:", question, "***")

    // זיהוי שפה
    console.log("🌐 [processRAGQuery] *** 3. מזהה שפה ***")
    const language = detectLanguage(question)
    console.log("🌐 [processRAGQuery] *** 4. שפה שזוהתה:", language, "***")

    // יצירת embedding
    console.log("🔄 [processRAGQuery] *** 5. יוצר embedding ***")
    const embedding = await createEmbedding(question)
    console.log("✅ [processRAGQuery] *** 6. embedding נוצר בהצלחה ***")

    // חיפוש מסמכים
    console.log("🔍 [processRAGQuery] *** 7. מחפש מסמכים ***")
    const documents = await searchSimilarDocuments(embedding, language)
    console.log("✅ [processRAGQuery] *** 8. מסמכים נמצאו:", documents.length, "***")

    // יצירת תשובה - כאן קורה הקסם!
    console.log("🤖 [processRAGQuery] *** 9. קורא ל-generateAnswer - כאן תתבצע בדיקת האיכות ***")
    const { answer, usedFallback, usedWebSearch } = await generateAnswer(question, documents, language)
    console.log("✅ [processRAGQuery] *** 10. generateAnswer הושלם ***")

    console.log("📊 [processRAGQuery] *** 11. תוצאות generateAnswer ***")
    console.log("  - usedFallback:", usedFallback)
    console.log("  - usedWebSearch:", usedWebSearch)
    console.log("  - answer length:", answer.length)

    // הכנת מקורות
    console.log("📄 [processRAGQuery] *** 12. מכין מקורות רגילים... ***")
    let sources: Array<{
      title: string
      file_name: string
      storage_path: string
      similarity: number
      sourceType: "official" | "web" | "ai_generated"
    }> = []

    if (usedWebSearch) {
      console.log("🌐 [processRAGQuery] מכין מקורות לweb search...")
      sources = [
        {
          title: "מידע מהאינטרנט",
          file_name: "web_search",
          storage_path: "",
          similarity: 0,
          sourceType: "web",
        },
      ]
    } else if (usedFallback) {
      console.log("🤖 [processRAGQuery] מכין מקורות לfallback...")
      sources = [
        {
          title: "תשובה מבוססת AI",
          file_name: "ai_generated",
          storage_path: "",
          similarity: 0,
          sourceType: "ai_generated",
        },
      ]
    } else {
      console.log("📄 [processRAGQuery] מכין מקורות רגילים...")
      sources = documents.map((doc) => ({
        title: doc.title,
        file_name: doc.file_name,
        storage_path: doc.storage_path,
        similarity: doc.similarity, // שומר על הערך המקורי
        sourceType: "official" as const,
      }))
    }

    console.log("✅ [processRAGQuery] *** 13. עיבוד הושלם בהצלחה ***")

    return {
      answer,
      sources,
      usedFallback,
      usedWebSearch,
    }
  } catch (error) {
    console.error("❌ [processRAGQuery] שגיאה כללית בעיבוד:", error)

    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.",
      sources: [],
      usedFallback: true,
      usedWebSearch: false,
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
  sources?: Array<{
    title: string
    file_name: string
    storage_path: string
    similarity: number
    sourceType?: "official" | "web" | "ai_generated"
  }>,
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
    sources: Array<{
      title: string
      file_name: string
      storage_path: string
      similarity: number
      sourceType?: "official" | "web" | "ai_generated"
    }>
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
