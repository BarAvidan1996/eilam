import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// זיהוי שפה פשוט
function detectLanguage(text: string): string {
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// יצירת embedding באמצעות Supabase Edge Function או OpenAI
async function createEmbedding(text: string): Promise<number[]> {
  try {
    // נשתמש ב-OpenAI API ישירות
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw new Error("Failed to create embedding")
  }
}

// חיפוש מסמכים רלוונטיים
async function searchRelevantDocuments(query: string, language: string, limit = 3) {
  try {
    console.log("Creating embedding for query:", query)
    const embedding = await createEmbedding(query)
    console.log("Embedding created, searching documents...")

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

    console.log("Found documents:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error in searchRelevantDocuments:", error)
    return []
  }
}

// יצירת תשובה באמצעות OpenAI
async function generateAnswer(question: string, context: string, language: string): Promise<string> {
  const systemPrompt =
    language === "he"
      ? `אתה עוזר חירום חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות ואמינות לשאלות הקשורות למצבי חירום.

השתמש רק במידע שסופק להלן. אם המידע לא מכיל תשובה ברורה, אל תמציא - ענה במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."

הוראות:
- התשובה חייבת להיות בעברית ברורה, נכונה ושוטפת, המתאימה לציבור הרחב
- אם ההקשר כולל הוראות בטיחות, הצג אותן בצורה ברורה ושלבית
- אל תסתמך על ידע כללי או תכלול תוכן שלא קיים בהקשר הנתון`
      : `You are a smart emergency assistant for the Home Front Command in Israel. Your role is to provide accurate and reliable answers to emergency-related questions.

Use only the information provided below. If the information does not contain a clear answer, do not make assumptions – explicitly respond: "No answer found in the provided information."

Instructions:
- Your answer must be in clear, correct, and fluent English, suitable for the general public
- If the context includes safety instructions, present them in a clear step-by-step manner
- Do not rely on general knowledge or include any content not present in the provided context`

  const userPrompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// הפונקציה הראשית לענות על שאלות
export async function answerQuestion(question: string): Promise<{
  answer: string
  sources: string[]
  method: string
}> {
  try {
    console.log("Processing question:", question)
    const language = detectLanguage(question)
    console.log("Detected language:", language)

    const documents = await searchRelevantDocuments(question, language)

    if (documents.length === 0) {
      console.log("No documents found")
      return {
        answer:
          language === "he"
            ? "מצטער, לא נמצאו מסמכים רלוונטיים לשאלתך במאגר המידע של פיקוד העורף. אנא נסה לנסח את השאלה בצורה אחרת או פנה ישירות לפיקוד העורף."
            : "Sorry, no relevant documents found for your question in the Home Front Command database. Please try rephrasing your question or contact the Home Front Command directly.",
        sources: [],
        method: "no_documents",
      }
    }

    console.log("Building context from documents...")
    const context = documents
      .map((doc) => `${doc.title || "ללא כותרת"}\n${doc.plain_text || doc.summary || ""}`)
      .join("\n\n---\n\n")

    console.log("Generating answer...")
    const answer = await generateAnswer(question, context, language)

    return {
      answer,
      sources: documents.map((doc) => doc.title || doc.file_name || "מסמך ללא שם"),
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
