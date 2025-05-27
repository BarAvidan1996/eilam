import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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
      match_threshold: 0.8,
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
