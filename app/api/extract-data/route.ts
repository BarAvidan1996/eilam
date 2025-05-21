import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // בדיקה אם מפתח ה-API של OpenAI זמין
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    // חילוץ מידע מובנה מהפרומפט
    const structuredData = await extractStructuredData(prompt, openaiApiKey)

    return NextResponse.json(structuredData)
  } catch (error) {
    console.error("Error in data extraction API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// פונקציה לחילוץ מידע מובנה מהפרומפט
async function extractStructuredData(prompt: string, openaiApiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `אתה מערכת לחילוץ מידע מובנה מטקסט. תפקידך לחלץ מידע מדויק על משק בית לצורך הכנת רשימת ציוד חירום.`,
          },
          {
            role: "user",
            content: `
              חלץ את המידע הבא מהטקסט והחזר אותו בפורמט JSON:
              
              1. מספר מבוגרים
              2. מספר ילדים וגילאיהם
              3. מספר תינוקות (מתחת לגיל שנתיים)
              4. מספר קשישים
              5. מספר וסוג חיות מחמד
              6. צרכים מיוחדים או מוגבלויות (כגון אלרגיות, אסטמה, מוגבלות פיזית וכו')
              7. משך זמן בשעות שהציוד צריך להספיק
              8. מיקום המגורים (דירה, בית פרטי וכו')
              
              הטקסט: "${prompt}"
              
              החזר JSON בפורמט הבא:
              {
                "adults": מספר (ברירת מחדל 2 אם לא צוין),
                "children": מספר (ברירת מחדל 0 אם לא צוין),
                "children_ages": [גילאים] (מערך ריק אם לא צוין),
                "babies": מספר (ברירת מחדל 0 אם לא צוין),
                "elderly": מספר (ברירת מחדל 0 אם לא צוין),
                "pets": מספר (ברירת מחדל 0 אם לא צוין),
                "pet_types": ["סוגי חיות"] (מערך ריק אם לא צוין),
                "special_needs": ["צרכים מיוחדים"] (מערך ריק אם לא צוין),
                "duration_hours": מספר (ברירת מחדל 72 אם לא צוין),
                "location": "מיקום" (ריק אם לא צוין)
              }
              
              חשוב: אל תוסיף מידע שלא מופיע בטקסט המקורי. אם מידע מסוים לא מופיע, השתמש בברירת המחדל.
            `,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error("Error extracting structured data:", await response.text())
      return {
        adults: 2,
        children: 0,
        children_ages: [],
        babies: 0,
        elderly: 0,
        pets: 0,
        pet_types: [],
        special_needs: [],
        duration_hours: 72,
        location: "",
      }
    }

    const data = await response.json()
    try {
      const parsedContent = JSON.parse(data.choices[0].message.content)
      console.log("Successfully extracted structured data:", parsedContent)
      return parsedContent
    } catch (error) {
      console.error("Error parsing structured data:", error, "Raw content:", data.choices[0].message.content)
      return {
        adults: 2,
        children: 0,
        children_ages: [],
        babies: 0,
        elderly: 0,
        pets: 0,
        pet_types: [],
        special_needs: [],
        duration_hours: 72,
        location: "",
      }
    }
  } catch (error) {
    console.error("Error in extractStructuredData:", error)
    return {
      adults: 2,
      children: 0,
      children_ages: [],
      babies: 0,
      elderly: 0,
      pets: 0,
      pet_types: [],
      special_needs: [],
      duration_hours: 72,
      location: "",
    }
  }
}
