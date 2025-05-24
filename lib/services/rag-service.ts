import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// זיהוי שפה פשוט
function detectLanguage(text: string): string {
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// יצירת embedding לטקסט
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw new Error("Failed to create embedding")
  }
}

// חיפוש מסמכים רלוונטיים
async function searchRelevantDocuments(query: string, language: string, limit = 5): Promise<any[]> {
  try {
    const embedding = await createEmbedding(query)

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
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

// יצירת תשובה עם StepBack prompting
async function generateAnswer(question: string, documents: any[], language: string): Promise<string> {
  const context = documents.map((doc) => `${doc.title}\n${doc.plain_text}`).join("\n\n---\n\n")

  const isHebrew = language === "he"

  const prompt = isHebrew
    ? `
אתה עוזר חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

השתמש רק במידע שמופיע למטה. אם המידע לא מכיל תשובה ברורה, אל תעשה השערות - ענה במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."

הוראות:
- התשובה שלך חייבת להיות בעברית ברורה, נכונה ושוטפת, המתאימה לציבור הרחב
- אם ההקשר כולל הוראות בטיחות, הצג אותן בצורה ברורה ושלבית
- אל תסתמך על ידע כללי ואל תכלול תוכן שלא קיים בהקשר שסופק

מידע רלוונטי:
${context}

שאלה:
${question}

תשובה:`
    : `
You are a smart assistant for the Home Front Command in Israel. Your role is to provide accurate, reliable, and up-to-date answers to questions related to emergency situations in Israel.

Use only the information provided below. If the information does not contain a clear answer, do not make assumptions – explicitly respond: "No answer found in the provided information."

Instructions:
- Your answer must be clear and suitable for the general public
- If the context includes safety instructions, present them in a clear step-by-step manner
- Do not rely on general knowledge or include any content not present in the provided context

Relevant information:
${context}

Question:
${question}

Answer:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.0,
    })

    return response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// הפונקציה הראשית של RAG
export async function answerQuestion(question: string): Promise<{
  answer: string
  sources: string[]
  method: string
}> {
  try {
    const language = detectLanguage(question)
    const documents = await searchRelevantDocuments(question, language)

    if (documents.length === 0) {
      return {
        answer:
          language === "he"
            ? "מצטער, לא נמצאו מסמכים רלוונטיים לשאלה שלך. אנא נסה לנסח את השאלה בצורה אחרת."
            : "Sorry, no relevant documents found for your question. Please try rephrasing your question.",
        sources: [],
        method: "no_documents",
      }
    }

    const answer = await generateAnswer(question, documents, language)
    const sources = documents.map((doc) => doc.title || doc.file_name || "מסמך לא ידוע")

    return {
      answer,
      sources,
      method: "stepback",
    }
  } catch (error) {
    console.error("Error in answerQuestion:", error)
    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.",
      sources: [],
      method: "error",
    }
  }
}
