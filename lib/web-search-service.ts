import OpenAI from "openai"
import type { TimeEntity } from "./time-entity-extractor"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface WebSearchResult {
  title: string
  content: string
  url: string
  score: number
}

export async function searchWebViaTavily(
  query: string,
  timeEntity?: TimeEntity,
): Promise<{
  success: boolean
  results: WebSearchResult[]
}> {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.warn("⚠️ אין TAVILY_API_KEY - מדלג על חיפוש אינטרנטי")
      return { success: false, results: [] }
    }

    console.log("🌐 מבצע חיפוש Tavily:", query)
    console.log("🕐 ישויות זמן:", timeEntity)

    // בניית payload עם ישויות זמן
    const payload: any = {
      query,
      topic: "general",
      search_depth: "basic",
      chunks_per_source: 3,
      max_results: 3,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_image_descriptions: false,
      include_domains: ["oref.org.il", "news.walla.co.il", "ynet.co.il", "mako.co.il"],
      exclude_domains: [],
    }

    // הוספת פרמטרי זמן בהתבסס על ישויות שחולצו
    if (timeEntity) {
      if (timeEntity.days) {
        payload.days = timeEntity.days
        console.log(`🕐 מחפש ב-${timeEntity.days} ימים אחרונים`)
      }

      if (timeEntity.timeRange) {
        payload.time_range = timeEntity.timeRange
        console.log(`🕐 מחפש בטווח זמן: ${timeEntity.timeRange}`)
      }

      if (timeEntity.isRecent && !timeEntity.days) {
        payload.days = 7 // ברירת מחדל לחיפוש עדכני
        console.log("🕐 חיפוש עדכני - 7 ימים אחרונים")
      }
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Tavily error ${response.status}`)
    }

    const data = await response.json()
    const results = (data.results || []).map((r: any) => ({
      title: r.title || "",
      content: r.content || "",
      url: r.url || "",
      score: r.score || 0,
    }))

    console.log("✅ Tavily החזיר תוצאות:", results.length)
    return { success: true, results }
  } catch (err) {
    console.error("❌ שגיאה ב-Tavily:", err)
    return { success: false, results: [] }
  }
}

export async function generateAnswerFromWeb(
  question: string,
  results: WebSearchResult[],
  language: "he" | "en",
): Promise<string> {
  const context = results.map((r, i) => `(${i + 1}) ${r.title}\n${r.content.slice(0, 300)}\nURL: ${r.url}`).join("\n\n")

  const now = new Date()
  const currentDate = now.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const prompt =
    language === "he"
      ? `ענה על השאלה על בסיס המידע הבא מהאינטרנט. ציין מקורות ותאריכים מדויקים.

התאריך הנוכחי: ${currentDate}

מידע מהאינטרנט:
${context}

שאלה: ${question}

תשובה מפורטת עם תאריכים מדויקים:`
      : `Answer the question based on the following web data. Include sources and exact dates.

Current date: ${currentDate}

Web information:
${context}

Question: ${question}

Detailed answer with exact dates:`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.3,
  })

  const answer = response.choices[0]?.message?.content || ""

  return (
    answer +
    (language === "he"
      ? `\n\n🌐 (מידע זה נמצא באמצעות חיפוש אינטרנטי נכון ל-${currentDate})`
      : `\n\n🌐 (This information was retrieved from web search as of ${currentDate})`)
  )
}
