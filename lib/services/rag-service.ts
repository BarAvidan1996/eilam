import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
console.log("🔴 [RAG Service] Loaded from: lib/services/rag-service.ts")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// זיהוי שפה פשוט
function detectLanguage(text: string): "he" | "en" {
  const hebrewPattern = /[\u0590-\u05FF]/
  return hebrewPattern.test(text) ? "he" : "en"
}

// יצירת embedding לשאלה
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

// חיפוש מסמכים דומים
async function searchSimilarDocuments(embedding: number[], language: string, matchThreshold = 0.7, matchCount = 5) {
  try {
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_language: language,
    })

    if (error) {
      console.error("Error searching documents:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in searchSimilarDocuments:", error)
    return []
  }
}

// Step-back prompting template
const STEPBACK_PROMPT = `
אתה עוזר חכם של פיקוד העורף בישראל. תפקידך לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

לפני מתן התשובה, קח צעד אחורה וחשב מה המידע המרכזי הנדרש כדי לענות על השאלה בצורה מדויקת ובטוחה.

חשיבה מופשטת:
- על מה השאלה הזו עוסקת ביסודה?
- איזה סוג תשובה צריך לתת (פרוצדורלית, עובדתית, מבוססת בטיחות)?

השתמש רק במידע הבא כדי לענות בעברית ברורה וידידותית לציבור:

הקשר רלוונטי:
{context}

שאלה:
{question}

תשובה:
`

// Fallback prompt
const FALLBACK_PROMPT = `
אתה עוזר חכם של פיקוד העורף. ענה על השאלה הבאה בהתבסס על הידע הכללי שלך:

שאלה: {question}

תשובה:
`

// יצירת תשובה עם Step-back prompting
async function generateAnswer(question: string, documents: any[], useStepback = true): Promise<string> {
  try {
    if (documents.length === 0) {
      // Fallback - תשובה כללית
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: FALLBACK_PROMPT.replace("{question}", question),
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      })

      const answer = response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
      return answer + "\n\n(הערה: תשובה זו ניתנה באופן כללי לפי הבנת המערכת, ללא הסתמכות על מסמך מאומת.)"
    }

    // יצירת הקשר מהמסמכים
    const context = documents.map((doc, index) => `מסמך ${index + 1}:\n${doc.plain_text}`).join("\n\n---\n\n")

    const prompt = useStepback ? STEPBACK_PROMPT : STEPBACK_PROMPT
    const finalPrompt = prompt.replace("{context}", context).replace("{question}", question)

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || "מצטער, לא הצלחתי לייצר תשובה."
  } catch (error) {
    console.error("Error generating answer:", error)
    throw new Error("Failed to generate answer")
  }
}

// הפונקציה הראשית של RAG
export async function processRAGQuery(question: string) {
  try {
      console.log("🔴 [RAG Service] Executing processRAGQuery from: lib/services/rag-service.ts")
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
