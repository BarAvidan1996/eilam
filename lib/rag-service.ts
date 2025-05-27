import OpenAI from "openai"
import { estimateTokens } from "./token-estimator"

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
