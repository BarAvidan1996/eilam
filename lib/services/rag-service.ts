import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface ChatMessage {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
}

export interface RAGDocument {
  id: string
  title: string
  plain_text: string
  embedding: number[]
  language: string
  summary: string
  keywords: string[]
}

// יצירת embedding לשאלת המשתמש
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw new Error("Failed to create embedding")
  }
}

// זיהוי שפה
function detectLanguage(text: string): string {
  // זיהוי פשוט לעברית/אנגלית
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// חיפוש מסמכים רלוונטיים באמצעות similarity search
async function searchRelevantDocuments(query: string, language: string, limit = 5): Promise<RAGDocument[]> {
  try {
    // יצירת embedding לשאלה
    const queryEmbedding = await createEmbedding(query)

    // חיפוש מסמכים דומים בבסיס הנתונים
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      filter_language: language,
    })

    if (error) {
      console.error("Error searching documents:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in searchRelevantDocuments:", error)
    return []
  }
}

// יצירת תשובה באמצעות GPT עם הקשר רלוונטי
async function generateAnswer(question: string, context: string, language: string): Promise<string> {
  const systemPrompt =
    language === "he"
      ? `אתה עוזר חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

השתמש רק במידע שסופק להלן. אם המידע לא מכיל תשובה ברורה, אל תעשה הנחות - השב במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."

הוראות:
- התשובה שלך חייבת להיות בעברית ברורה, נכונה ושוטפת, המתאימה לציבור הרחב.
- אם ההקשר כולל הוראות בטיחות, הצג אותן בצורה ברורה ושלבית.
- אל תסתמך על ידע כללי ואל תכלול תוכן שאינו קיים בהקשר שסופק.`
      : `You are a smart assistant for the Home Front Command in Israel. Your role is to provide accurate, reliable, and up-to-date answers to questions related to emergency situations in Israel.

Use only the information provided below. If the information does not contain a clear answer, do not make assumptions – explicitly respond: "No answer found based on the given information."

Instructions:
- Your answer must be in clear, correct, and fluent English, suitable for the general public.
- If the context includes safety instructions, present them in a clear step-by-step manner.
- Do not rely on general knowledge or include any content not present in the provided context.`

  const userPrompt = `הקשר רלוונטי:
${context}

שאלה:
${question}

תשובה:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 800,
    })

    return response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// שיטת Step-Back לשיפור התשובות
async function generateStepBackAnswer(question: string, context: string, language: string): Promise<string> {
  const stepBackPrompt =
    language === "he"
      ? `לפני מענה על השאלה, קח צעד אחורה ונתח בקצרה איזה מידע מרכזי נדרש כדי לענות על השאלה בצורה מדויקת ובטוחה.

חשוב באופן מופשט, ואז השתמש בהקשר שנמצא כדי לענות בעברית.

חשיבה צעד אחורה:
על מה השאלה הזו עוסקת ביסודה?
איזה סוג תשובה צריך לתת (פרוצדורלית, עובדתית, מבוססת בטיחות)?

לאחר מכן, השתמש רק בהקשר הבא כדי לענות בעברית שוטפת וידידותית לציבור:`
      : `Before answering the question, take a step back and briefly analyze what key information is required to answer the question accurately and safely.

Think abstractly, and then use the retrieved context to answer in English.

Step-back reasoning:
What is this question fundamentally about?
What kind of answer should be given (procedural, factual, safety-based)?

Then, use only the following context to answer in fluent, public-friendly English:`

  const userPrompt = `${stepBackPrompt}

הקשר:
${context}

שאלה:
${question}

תשובה:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.1,
      max_tokens: 800,
    })

    return response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating step-back answer:", error)
    throw new Error("Failed to generate step-back answer")
  }
}

// יצירת סשן צ'אט חדש
export async function createChatSession(userId: string, title?: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        title: title || "שיחה חדשה",
      })
      .select("id")
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error("Error creating chat session:", error)
    throw new Error("Failed to create chat session")
  }
}

// שמירת הודעה בסשן
export async function saveChatMessage(sessionId: string, role: "user" | "assistant", content: string): Promise<void> {
  try {
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role,
      content,
    })

    if (error) throw error
  } catch (error) {
    console.error("Error saving chat message:", error)
    throw new Error("Failed to save chat message")
  }
}

// קבלת היסטוריית שיחה
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
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

// קבלת כל הסשנים של משתמש
export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
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

// הפונקציה הראשית לענות על שאלות
export async function answerQuestion(
  question: string,
  sessionId?: string,
  userId?: string,
  method: "rag" | "stepback" | "fallback" = "stepback",
): Promise<{
  answer: string
  sources: string[]
  sessionId: string
}> {
  try {
    // זיהוי שפה
    const language = detectLanguage(question)

    // יצירת סשן חדש אם לא קיים
    let currentSessionId = sessionId
    if (!currentSessionId && userId) {
      currentSessionId = await createChatSession(userId)
    }

    // שמירת שאלת המשתמש
    if (currentSessionId) {
      await saveChatMessage(currentSessionId, "user", question)
    }

    // חיפוש מסמכים רלוונטיים
    const relevantDocs = await searchRelevantDocuments(question, language)

    if (relevantDocs.length === 0) {
      // Fallback למידע כללי
      const fallbackAnswer = await generateFallbackAnswer(question, language)

      if (currentSessionId) {
        await saveChatMessage(currentSessionId, "assistant", fallbackAnswer)
      }

      return {
        answer: fallbackAnswer,
        sources: [],
        sessionId: currentSessionId || "",
      }
    }

    // יצירת הקשר מהמסמכים הרלוונטיים
    const context = relevantDocs.map((doc) => `${doc.title}\n${doc.plain_text}`).join("\n\n---\n\n")

    // יצירת תשובה לפי השיטה הנבחרת
    let answer: string
    switch (method) {
      case "stepback":
        answer = await generateStepBackAnswer(question, context, language)
        break
      case "fallback":
        answer = await generateAnswerWithFallback(question, context, language)
        break
      default:
        answer = await generateAnswer(question, context, language)
    }

    // שמירת תשובת המערכת
    if (currentSessionId) {
      await saveChatMessage(currentSessionId, "assistant", answer)
    }

    return {
      answer,
      sources: relevantDocs.map((doc) => doc.title),
      sessionId: currentSessionId || "",
    }
  } catch (error) {
    console.error("Error in answerQuestion:", error)

    const errorMessage = "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב."

    if (sessionId) {
      await saveChatMessage(sessionId, "assistant", errorMessage)
    }

    return {
      answer: errorMessage,
      sources: [],
      sessionId: sessionId || "",
    }
  }
}

// תשובת fallback למקרים שבהם לא נמצאו מסמכים רלוונטיים
async function generateFallbackAnswer(question: string, language: string): Promise<string> {
  const fallbackPrompt =
    language === "he"
      ? `ענה על השאלה הבאה באמצעות הידע הכללי שלך, אך ציין בבירור שהתשובה מבוססת על ידע כללי ולא על מסמכים רשמיים של פיקוד העורף:

שאלה: ${question}

תשובה:`
      : `Answer the following question using your general knowledge, but clearly state that the answer is based on general knowledge and not on official Home Front Command documents:

Question: ${question}

Answer:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: fallbackPrompt }],
      temperature: 0.2,
      max_tokens: 600,
    })

    const answer = response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
    return answer + "\n\n(הערה: תשובה זו מבוססת על ידע כללי ולא על מסמכים רשמיים של פיקוד העורף)"
  } catch (error) {
    console.error("Error generating fallback answer:", error)
    return "מצטער, לא הצלחתי לייצר תשובה. אנא נסה שוב או פנה לאתר פיקוד העורף הרשמי."
  }
}

// תשובה עם fallback מובנה
async function generateAnswerWithFallback(question: string, context: string, language: string): Promise<string> {
  // ניסיון ראשון עם הקשר
  const answer = await generateAnswer(question, context, language)

  // בדיקה אם התשובה קצרה מדי או לא מספקת
  if (answer.length < 50 || answer.includes("לא נמצאה תשובה")) {
    return await generateFallbackAnswer(question, language)
  }

  return answer
}
