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
    console.log("🌐 מבצע חיפוש אינטרנטי עם OpenAI Search:", query)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      web_search_options: {
        search_context_size: "low",
        user_location: {
          type: "approximate",
          approximate: {
            country: "IL",
            city: "Tel Aviv",
            region: "Tel Aviv",
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `אתה עוזר AI של פיקוד העורף הישראלי. 
          
תפקידך:
1. לחפש מידע עדכני ומדויק באינטרנט
2. לענות בעברית בצורה ברורה ומועילה
3. להתמקד במידע רלוונטי לחירום והיערכות בישראל
4. לציין אם המידע עדכני או לא

הנחיות:
- תן תשובה מפורטת ומעשית
- אם השאלה קשורה לפיקוד העורף או חירום בישראל, חפש מידע ספציפי
- ציין תאריכים אם רלוונטי
- אם לא מוצא מידע עדכני, ציין זאת בבירור`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const answer = completion.choices[0]?.message?.content || ""

    console.log("✅ קיבלתי תגובה מ-OpenAI Search")
    console.log("📊 Usage:", completion.usage)
    console.log("🔍 Model used:", completion.model)

    // יצירת תוצאה מדומה בפורמט של Tavily
    const mockResult: WebSearchResult = {
      title: "מידע עדכני מהאינטרנט - OpenAI Search",
      content: answer,
      url: "https://openai-search-result",
      score: 1.0,
    }

    return {
      success: true,
      results: [mockResult],
    }
  } catch (err) {
    console.error("❌ שגיאה ב-OpenAI Search:", err)
    return { success: false, results: [] }
  }
}

export async function generateAnswerFromWeb(
  question: string,
  results: WebSearchResult[],
  language: "he" | "en",
): Promise<string> {
  // עם OpenAI Search, התשובה כבר מוכנה ומעוצבת
  const answer = results[0]?.content || ""

  // הוספת תווית מקור אינטרנטי
  const webNote =
    language === "he"
      ? "\n\n🌐 (מידע זה נמצא באמצעות חיפוש אינטרנטי עדכני)"
      : "\n\n🌐 (This information was retrieved from current web search)"

  return answer + webNote
}
