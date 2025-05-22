import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // חילוץ עובדות מהפרומפט באמצעות OpenAI
    const extractedFacts = await extractFacts(prompt)

    // המרת העובדות למבנה נתונים מובנה
    const structuredData = await convertFactsToStructuredData(extractedFacts, prompt)

    return NextResponse.json(structuredData)
  } catch (error) {
    console.error("Error extracting data:", error)
    // במקרה של שגיאה, החזר ערכי ברירת מחדל עם סימון שכולם ערכי ברירת מחדל
    return NextResponse.json({
      adults: 2,
      children: 0,
      children_ages: [],
      babies: 0,
      elderly: 0,
      pets: 0,
      pet_types: [],
      special_needs: "",
      duration_hours: 72,
      location: "",
      using_defaults: ["adults", "children", "babies", "elderly", "pets", "duration_hours", "special_needs"],
    })
  }
}

// פונקציה לחילוץ עובדות מהפרומפט באמצעות OpenAI
async function extractFacts(prompt: string) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      throw new Error("OpenAI API key is missing")
    }

    const factExtractionPrompt = `
חלץ את העובדות והפרטים האישיים החשובים מהטקסט הבא, כדי לעזור בבניית רשימת ציוד חירום מותאמת אישית.

התמקד בפרטים הבאים והחזר אותם בנקודות או במשפטים קצרים בלבד:
- מספר מבוגרים (גיל 18-65)
- מספר ילדים (גיל 2-12) וגילאיהם
- מספר תינוקות (מתחת לגיל 2)
- מספר קשישים (מעל גיל 65)
- חיות מחמד (סוג וכמות)
- מצבים רפואיים או צרכים מיוחדים (אלרגיות, אסטמה, מוגבלויות וכו')
- משך זמן בשעות שהציוד צריך להספיק
- מיקום מגורים (דירה, בית פרטי, קומה וכו')

אל תסיק או תייצר מידע חדש שלא מופיע בטקסט המקורי.

טקסט המשתמש: ${prompt}
`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "אתה מחלץ עובדות חשובות מתוך תיאורים אישיים עבור היערכות לחירום.",
          },
          {
            role: "user",
            content: factExtractionPrompt,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const facts = data.choices[0].message.content.trim()

    console.log("Extracted facts:", facts)
    return facts
  } catch (error) {
    console.error("Error extracting facts:", error)
    throw error
  }
}

// פונקציה להמרת העובדות למבנה נתונים מובנה
async function convertFactsToStructuredData(facts: string, originalPrompt: string) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      throw new Error("OpenAI API key is missing")
    }

    const structuringPrompt = `
המר את העובדות הבאות למבנה JSON מובנה לפי הפורמט המוגדר.

העובדות שחולצו:
${facts}

הטקסט המקורי:
${originalPrompt}

החזר JSON בפורמט הבא בדיוק, ללא הסברים נוספים:
{
  "adults": מספר המבוגרים (ברירת מחדל 2 אם לא צוין),
  "children": מספר הילדים (ברירת מחדל 0 אם לא צוין),
  "children_ages": [גילאי הילדים] (מערך ריק אם לא צוין),
  "babies": מספר התינוקות (ברירת מחדל 0 אם לא צוין),
  "elderly": מספר הקשישים (ברירת מחדל 0 אם לא צוין),
  "pets": מספר חיות המחמד (ברירת מחדל 0 אם לא צוין),
  "pet_types": ["סוגי חיות המחמד"] (מערך ריק אם לא צוין),
  "special_needs": "תיאור הצרכים המיוחדים" (ריק אם לא צוין),
  "duration_hours": משך הזמן בשעות (ברירת מחדל 72 אם לא צוין),
  "location": "תיאור המיקום" (ריק אם לא צוין),
  "using_defaults": ["רשימת השדות שמשתמשים בערכי ברירת מחדל"]
}

חשוב: בשדה "using_defaults", כלול את שמות כל השדות שבהם השתמשת בערך ברירת מחדל כי המידע לא הופיע בטקסט המקורי.
`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "אתה מומחה בהמרת מידע טקסטואלי למבנה JSON מובנה.",
          },
          {
            role: "user",
            content: structuringPrompt,
          },
        ],
        temperature: 0,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const jsonString = data.choices[0].message.content.trim()

    // ניקוי ה-JSON במקרה שיש טקסט נוסף לפני או אחרי
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    const cleanJsonString = jsonMatch ? jsonMatch[0] : jsonString

    console.log("Structured data JSON:", cleanJsonString)

    try {
      const structuredData = JSON.parse(cleanJsonString)
      return structuredData
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Raw JSON string:", cleanJsonString)
      throw new Error("Failed to parse structured data JSON")
    }
  } catch (error) {
    console.error("Error converting facts to structured data:", error)
    throw error
  }
}
