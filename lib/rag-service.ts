import OpenAI from "openai"
import { estimateTokens } from "./token-estimator"
// הוסף את הייבוא בתחילת הקובץ
import { searchWeb, generateWebAnswer } from "./web-search-service"
import { detectLanguage } from "./language-detector"
import { createEmbedding, searchSimilarDocuments } from "./vector-search"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// יצירת תשובה עם prompt מחוזק ושימוש במידע בלבד
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

    // הכנת הקשר מחוזק - רק 3 המסמכים הכי דומים, 400 תווים לכל אחד
    const context = documents
      .slice(0, 3)
      .map((doc, index) => `(${index + 1}) מקור: ${doc.title}\nתוכן: ${doc.plain_text.slice(0, 400)}`)
      .join("\n\n")

    console.log(`📊 אורך הקשר סופי: ${context.length} תווים`)

    // Prompt מחוזק שדורש שימוש במידע בלבד
    const STEPBACK_PROMPT =
      language === "he"
        ? `אתה עוזר חכם של פיקוד העורף בישראל. אתה חייב לענות **רק** על בסיס המידע הבא.

אם אין מידע רלוונטי בשום קטע, ענה "לא נמצא מידע מדויק בקבצים, נא לפנות לאתר פיקוד העורף."

הקשר:
${context}

שאלה:
${question}

תשובה:`
        : `You are a smart assistant for the Israeli Home Front Command. You must answer **only** based on the following information.

If there is no relevant information in any section, answer "No accurate information found in files, please refer to the Home Front Command website."

Context:
${context}

Question:
${question}

Answer:`

    // חישוב טוקנים משוער
    const totalTokens = estimateTokens(STEPBACK_PROMPT)
    console.log(`📊 טוקנים משוערים לבקשה: ${totalTokens}`)

    if (totalTokens > 3500) {
      console.log("⚠️ יותר מדי טוקנים, עובר ל-fallback")
      return await generateFallbackAnswer(question, language)
    }

    console.log("🔄 שולח בקשה ל-OpenAI...")

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: STEPBACK_PROMPT }],
      temperature: 0.2, // הקטנתי מ-0.3 ל-0.2 לדיוק גבוה יותר
      max_tokens: 600,
    })

    const answer = completion.choices[0]?.message?.content || ""
    console.log("✅ תשובה נוצרה בהצלחה, אורך:", answer.length)

    return { answer, usedFallback: false }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה:", error)

    // אם זו שגיאת טוקנים, ננסה עם פחות מסמכים
    if (error instanceof Error && error.message.includes("maximum context")) {
      console.log("🔄 ניסיון חוזר עם מסמך אחד בלבד...")
      const reducedDocuments = documents.slice(0, 1)
      return await generateAnswer(question, reducedDocuments, language)
    }

    throw new Error(`שגיאה ביצירת תשובה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`)
  }
}

// תשובת fallback עם תווית ברורה
async function generateFallbackAnswer(
  question: string,
  language: "he" | "en",
): Promise<{ answer: string; usedFallback: boolean }> {
  try {
    console.log("🔄 יוצר תשובת fallback...")

    const systemPrompt =
      language === "he"
        ? `תן תשובה קצרה ומועילה בנושא חירום וביטחון. היה זהיר ומדויק.`
        : `Provide a brief, helpful answer about emergency and security topics. Be careful and accurate.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_tokens: 250,
    })

    const baseAnswer = completion.choices[0]?.message?.content || ""

    // הוספת תווית ברורה לתשובת fallback
    const labeledAnswer =
      language === "he"
        ? `${baseAnswer}\n\n⚠️ (הערה: תשובה זו נכתבה ללא מידע שנשלף ממסמכים של פיקוד העורף)`
        : `${baseAnswer}\n\n⚠️ (Note: This answer was written without information extracted from Home Front Command documents)`

    console.log("✅ תשובת fallback נוצרה בהצלחה")

    return { answer: labeledAnswer, usedFallback: true }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובת fallback:", error)
    throw error
  }
}

// הוסף את פונקציית הערכת איכות התשובה
async function evaluateAnswerQuality(question: string, answer: string): Promise<boolean> {
  try {
    const prompt = `
שאלה:
${question}

תשובה מוצעת:
${answer}

האם התשובה מספקת מענה מדויק, ברור ורלוונטי לשאלה?
ענה רק "כן" או "לא". אין צורך בנימוק.
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // גרסה חסכונית
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0,
    })

    const content = response.choices?.[0]?.message?.content?.toLowerCase() || ""
    const isGoodQuality = content.includes("כן")

    console.log(`🔍 הערכת איכות התשובה: ${isGoodQuality ? "טובה" : "לא מספקת"}`)
    return isGoodQuality
  } catch (error) {
    console.error("❌ שגיאה בהערכת איכות התשובה:", error)
    return false // במקרה של שגיאה, נניח שהתשובה לא טובה
  }
}

// החלף את הפונקציה processRAGQuery הקיימת בזו החדשה
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
  try {
    console.log("🚀 מתחיל עיבוד שאלה עם שכבת החלטה חכמה:", question)

    // זיהוי שפה
    const language = detectLanguage(question)
    console.log("🌐 שפה שזוהתה:", language)

    // שלב 1: ניסיון RAG רגיל
    console.log("📚 שלב 1: חיפוש במסמכים פנימיים...")

    const embedding = await createEmbedding(question)
    const documents = await searchSimilarDocuments(embedding, language)

    // אם לא נמצאו מסמכים כלל - עבור ישר לחיפוש אינטרנטי
    if (documents.length === 0) {
      console.log("⚠️ לא נמצאו מסמכים רלוונטיים, עובר לחיפוש אינטרנטי...")
      return await performWebSearchFallback(question, language)
    }

    // שלב 2: יצירת תשובה מהמסמכים
    console.log("🤖 שלב 2: יצירת תשובה מהמסמכים...")
    const { answer: ragAnswer, usedFallback } = await generateAnswer(question, documents, language)

    // אם השתמשנו ב-fallback כבר בשלב הזה, לא נבדוק איכות
    if (usedFallback) {
      console.log("⚠️ נעשה שימוש ב-fallback פנימי, מחזיר תשובה...")
      return {
        answer: ragAnswer,
        sources: [],
        usedFallback: true,
        usedWebSearch: false,
      }
    }

    // שלב 3: הערכת איכות התשובה
    console.log("🔍 שלב 3: הערכת איכות התשובה...")
    const isQualityGood = await evaluateAnswerQuality(question, ragAnswer)

    if (isQualityGood) {
      // התשובה טובה - מחזירים אותה עם המקורות
      console.log("✅ התשובה איכותית, מחזיר תשובה מהמסמכים")

      const sources = documents.map((doc) => ({
        title: doc.title,
        file_name: doc.file_name,
        storage_path: doc.storage_path,
        similarity: Math.round(doc.similarity * 100),
      }))

      return {
        answer: ragAnswer,
        sources,
        usedFallback: false,
        usedWebSearch: false,
      }
    } else {
      // התשובה לא מספקת - עובר לחיפוש אינטרנטי
      console.log("⚠️ התשובה לא מספקת, עובר לחיפוש אינטרנטי...")
      return await performWebSearchFallback(question, language)
    }
  } catch (error) {
    console.error("❌ שגיאה כללית בעיבוד:", error)

    // במקרה של שגיאה, ננסה חיפוש אינטרנטי כ-fallback אחרון
    try {
      console.log("🔄 ניסיון fallback עם חיפוש אינטרנטי...")
      const language = detectLanguage(question)
      return await performWebSearchFallback(question, language)
    } catch (fallbackError) {
      console.error("❌ גם חיפוש אינטרנטי נכשל:", fallbackError)

      return {
        answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב או פנה לאתר פיקוד העורף.",
        sources: [],
        usedFallback: true,
        usedWebSearch: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }
    }
  }
}

// פונקציה עזר לביצוע חיפוש אינטרנטי
async function performWebSearchFallback(
  question: string,
  language: "he" | "en",
): Promise<{
  answer: string
  sources: Array<{
    title: string
    file_name: string
    storage_path: string
    similarity: number
  }>
  usedFallback: boolean
  usedWebSearch: boolean
}> {
  try {
    console.log("🌐 מבצע חיפוש אינטרנטי...")

    const searchResults = await searchWeb(question)

    if (searchResults.success && searchResults.results.length > 0) {
      const webAnswer = await generateWebAnswer(question, searchResults.results, language)

      // הוסף מיפוי המקורות מתוצאות החיפוש
      const webSources = searchResults.results.map((res, i) => ({
        title: res.title,
        file_name: `web_result_${i + 1}`,
        storage_path: res.url,
        similarity: Math.round(res.score * 100),
      }))

      return {
        answer: webAnswer,
        sources: webSources, // במקום מערך ריק
        usedFallback: false,
        usedWebSearch: true,
      }
    } else {
      // גם חיפוש אינטרנטי נכשל - fallback סופי
      console.log("⚠️ גם חיפוש אינטרנטי נכשל, משתמש ב-fallback סופי...")
      const { answer } = await generateFallbackAnswer(question, language)

      return {
        answer,
        sources: [],
        usedFallback: true,
        usedWebSearch: false,
      }
    }
  } catch (error) {
    console.error("❌ שגיאה בחיפוש אינטרנטי:", error)

    // fallback סופי
    const { answer } = await generateFallbackAnswer(question, language)

    return {
      answer,
      sources: [],
      usedFallback: true,
      usedWebSearch: false,
    }
  }
}
