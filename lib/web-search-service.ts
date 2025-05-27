interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  success: boolean
  results: TavilySearchResult[]
  error?: string
}

// חיפוש אינטרנטי עם Tavily
export async function searchWeb(question: string): Promise<TavilyResponse> {
  try {
    console.log("🌐 מבצע חיפוש אינטרנטי עם Tavily:", question)

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: `${question} site:oref.org.il OR site:gov.il OR פיקוד העורף ישראל`,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 5,
        include_domains: ["oref.org.il", "gov.il", "idf.il"],
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    const data = await response.json()

    console.log(`✅ נמצאו ${data.results?.length || 0} תוצאות מהאינטרנט`)

    return {
      success: true,
      results: data.results || [],
    }
  } catch (error) {
    console.error("❌ שגיאה בחיפוש אינטרנטי:", error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "שגיאה לא ידועה",
    }
  }
}

// יצירת תשובה מתוצאות חיפוש אינטרנטי
export async function generateWebAnswer(
  question: string,
  searchResults: TavilySearchResult[],
  language: "he" | "en",
): Promise<string> {
  try {
    console.log("🤖 יוצר תשובה מתוצאות חיפוש אינטרנטי...")

    const context = searchResults
      .slice(0, 3)
      .map((result, index) => `(${index + 1}) מקור: ${result.title}\nתוכן: ${result.content.slice(0, 400)}`)
      .join("\n\n")

    const prompt =
      language === "he"
        ? `על בסיס המידע הבא מאתרים רשמיים, ענה על השאלה בעברית:

${context}

שאלה: ${question}

תשובה (ציין שהמידע מבוסס על מקורות אינטרנטיים רשמיים):`
        : `Based on the following information from official websites, answer the question in English:

${context}

Question: ${question}

Answer (mention that the information is based on official online sources):`

    const response = await fetch("/api/openai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4",
        temperature: 0.3,
        max_tokens: 600,
      }),
    })

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || ""

    // הוספת תווית מקור אינטרנטי
    const labeledAnswer =
      language === "he"
        ? `${answer}\n\n🌐 (מידע זה נשלף מאתרים רשמיים באינטרנט)`
        : `${answer}\n\n🌐 (This information was retrieved from official websites)`

    console.log("✅ תשובה מחיפוש אינטרנטי נוצרה בהצלחה")
    return labeledAnswer
  } catch (error) {
    console.error("❌ שגיאה ביצירת תשובה מחיפוש אינטרנטי:", error)
    throw error
  }
}
