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

// חיפוש מסמכים רלוונטיים באמצעות similarity search
async function searchRelevantDocuments(query: string, language: string, limit = 5) {
  try {
    console.log("Creating embedding for query:", query)
    const embedding = await createEmbedding(query)

    console.log("Searching for similar documents...")
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

    console.log(`Found ${data?.length || 0} relevant documents`)
    return data || []
  } catch (error) {
    console.error("Error in searchRelevantDocuments:", error)
    return []
  }
}

// יצירת תשובה באמצעות OpenAI עם הקשר מהמסמכים
async function generateAnswer(question: string, documents: any[], language: string): Promise<string> {
  if (documents.length === 0) {
    return language === "he"
      ? "מצטער, לא נמצאו מסמכים רלוונטיים לשאלתך במאגר המידע של פיקוד העורף."
      : "Sorry, no relevant documents found for your question in the Home Front Command database."
  }

  // יצירת הקשר מהמסמכים
  const context = documents
    .map((doc) => {
      return `כותרת: ${doc.title}\nתוכן: ${doc.plain_text}\n---`
    })
    .join("\n")

  const systemPrompt =
    language === "he"
      ? `אתה עוזר חירום חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות ואמינות לשאלות הקשורות למצבי חירום.

השתמש רק במידע שסופק להלן ממסמכי פיקוד העורף. אם המידע לא מכיל תשובה ברורה, אל תמציא - ענה במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."

הוראות:
- התשובה חייבת להיות בעברית ברורה, נכונה ושוטפת, המתאימה לציבור הרחב
- אם ההקשר כולל הוראות בטיחות, הצג אותן בצורה ברורה ושלבית
- אל תסתמך על ידע כללי או תכלול תוכן שלא קיים בהקשר הנתון
- ציין מקורות רלוונטיים אם יש כאלה`
      : `You are a smart emergency assistant for the Home Front Command in Israel. Your role is to provide accurate and reliable answers to emergency-related questions.

Use only the information provided below from Home Front Command documents. If the information does not contain a clear answer, do not make assumptions – explicitly respond: "No answer found in the provided information."

Instructions:
- Your answer must be in clear, correct, and fluent English, suitable for the general public
- If the context includes safety instructions, present them in a clear step-by-step manner
- Do not rely on general knowledge or include any content not present in the provided context
- Cite relevant sources if available`

  const userPrompt = `מידע רלוונטי ממסמכי פיקוד העורף:
${context}

שאלה: ${question}

תשובה:`

  try {
    console.log("Generating answer with OpenAI...")
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.1,
    })

    const answer = response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
    console.log("Generated answer:", answer.substring(0, 100) + "...")
    return answer
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// הפונקציה הראשית לענות על שאלות באמצעות RAG
export async function answerQuestion(question: string): Promise<{
  answer: string
  sources: string[]
  method: string
}> {
  try {
    console.log("Starting RAG process for question:", question)

    const language = detectLanguage(question)
    console.log("Detected language:", language)

    const documents = await searchRelevantDocuments(question, language)

    const answer = await generateAnswer(question, documents, language)
    const sources = documents.map((doc) => doc.title || doc.file_name || "מסמך לא ידוע")

    return {
      answer,
      sources,
      method: "rag",
    }
  } catch (error) {
    console.error("Error in answerQuestion:", error)
    return {
      answer: "מצטער, אירעה שגיאה בעיבוד השאלה. אנא נסה שוב.",
      sources: [],
      method: "error",
    }
  }
}
