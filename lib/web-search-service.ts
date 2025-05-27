import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface WebSearchResult {
  title: string
  content: string
  url: string
  score: number
}

export async function searchWebViaTavily(query: string): Promise<{
  success: boolean
  results: WebSearchResult[]
}> {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.warn("⚠️ אין TAVILY_API_KEY - מדלג על חיפוש אינטרנטי")
      return { success: false, results: [] }
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 3,
        include_domains: ["oref.org.il", "gov.il"],
      }),
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

    return { success: true, results }
  } catch (err) {
    console.error("❌ שגיאה ב-searchWebViaTavily:", err)
    return { success: false, results: [] }
  }
}

export async function generateAnswerFromWeb(
  question: string,
  results: WebSearchResult[],
  language: "he" | "en",
): Promise<string> {
  const context = results.map((r, i) => `(${i + 1}) ${r.title}\n${r.content.slice(0, 300)}\nURL: ${r.url}`).join("\n\n")

  const prompt =
    language === "he"
      ? `ענה על השאלה על בסיס המידע הבא מהאינטרנט. ציין מקורות.\n\n${context}\n\nשאלה: ${question}`
      : `Answer the question based on the following web data. Include sources.\n\n${context}\n\nQuestion: ${question}`

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
      ? "\n\n🌐 (תשובה זו מבוססת על מידע מהאינטרנט ולא ממסמכים פנימיים)"
      : "\n\n🌐 (This answer is based on web information, not internal documents)")
  )
}
