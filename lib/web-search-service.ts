import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// חיפוש אינטרנטי באמצעות Tavily API
export async function searchWeb(query: string): Promise<{
  results: Array<{
    title: string
    content: string
    url: string
    score: number
  }>
  success: boolean
}> {
  try {
    console.log("🌐 מבצע חיפוש אינטרנטי עבור:", query)

    // אם אין Tavily API key, נחזיר תוצאות ריקות
    if (!process.env.TAVILY_API_KEY) {
      console.log("⚠️ אין Tavily API key, מדלג על חיפוש אינטרנטי")
      return { results: [], success: false }
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: query + " פיקוד העורף ישראל", // הוספת קונטקסט ישראלי
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 3,
        include_domains: ["oref.org.il", "gov.il"], // העדפה לאתרים רשמיים
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    const data = await response.json()

    const results =
      data.results?.map((result: any) => ({
        title: result.title || "",
        content: result.content || "",
        url: result.url || "",
        score: result.score || 0,
      })) || []

    console.log(`✅ נמצאו ${results.length} תוצאות חיפוש`)
    return { results, success: true }
  } catch (error) {
    console.error("❌ שגיאה בחיפוש אינטרנטי:", error)
    return { results: [], success: false }
  }
}

// יצירת תשובה מתוצאות חיפוש אינטרנטי
export async function generateWebAnswer(
  question: string,
  searchResults: Array<{
    title: string
    content: string
    url: string
    score: number
  }>,
  language: "he" | "en",
): Promise<string> {
  try {
    console.log("🤖 יוצר תשובה מתוצאות חיפוש אינטרנטי")

    if (searchResults.length === 0) {
      return language === "he"
        ? "לא נמצא מידע רלוונטי בחיפוש האינטרנטי. נא לפנות לאתר פיקוד העורף."
        : "No relevant information found in web search. Please refer to the Home Front Command website."
    }

    // הכנת הקשר מתוצאות החיפוש
    const context = searchResults
      .slice(0, 3)
      .map(
        (result, index) =>
          `(${index + 1}) מקור: ${result.title}\nתוכן: ${result.content.slice(0, 300)}\nקישור: ${result.url}`,
      )
      .join("\n\n")

    const prompt =
      language === "he"
        ? `אתה עוזר של פיקוד העורף. ענה על השאלה בהתבסס על המידע הבא מחיפוש אינטרנטי.
היה מדויק וציין מקורות. אם המידע לא מספיק, ציין זאת.

מידע מחיפוש אינטרנטי:
${context}

שאלה:
${question}

תשובה:`
        : `You are a Home Front Command assistant. Answer the question based on the following web search information.
Be accurate and cite sources. If the information is insufficient, mention it.

Web search information:
${context}

Question:
${question}

Answer:`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    })

    const answer = completion.choices[0]?.message?.content || ""

    // הוספת תווית שמציינת שזו תשובה מחיפוש אינטרנטי
    const labeledAnswer =
      language === "he"
        ? `${answer}\n\n🌐 (מידע זה נמצא בחיפוש אינטרנטי ולא במסמכים הפנימיים)`
        : `${answer}\n\n🌐 (This information was found through web search, not internal documents)`

    console.log("✅ תשובה מחיפוש אינטרנטי נוצרה בהצלחה")
    return labeledAnswer
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה מחיפוש אינטרנטי:", error)
    throw error
  }
}
