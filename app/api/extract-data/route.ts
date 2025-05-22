import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create a detailed prompt for OpenAI
    const detailedPrompt = `
חלץ מידע מהטקסט הבא:

"${prompt}"

אני צריך לחלץ את המידע הבא:
1. מספר המבוגרים
2. מספר הילדים
3. גילאי הילדים (אם צוינו)
4. מספר התינוקות
5. מספר הקשישים
6. מספר חיות המחמד
7. סוגי חיות המחמד (אם צוינו)
8. צרכים מיוחדים (כגון מוגבלויות, אלרגיות, מחלות כרוניות)
9. משך הזמן בשעות שעבורו נדרשת ההיערכות
10. מיקום המגורים (אם צוין)
11. פרטים נוספים על תנאי המגורים (קומה, גודל דירה, מחסן וכו')

החזר את התשובה בפורמט JSON הבא:
{
  "adults": מספר המבוגרים (ברירת מחדל: 2 אם לא צוין),
  "children": מספר הילדים (ברירת מחדל: 0 אם לא צוין),
  "children_ages": [גילאי הילדים] (מערך ריק אם לא צוין),
  "babies": מספר התינוקות (ברירת מחדל: 0 אם לא צוין),
  "elderly": מספר הקשישים (ברירת מחדל: 0 אם לא צוין),
  "pets": מספר חיות המחמד (ברירת מחדל: 0 אם לא צוין),
  "pet_types": ["סוגי חיות המחמד"] (מערך ריק אם לא צוין),
  "special_needs": "תיאור הצרכים המיוחדים" (ברירת מחדל: "לא צוין" אם לא צוין),
  "duration_hours": משך הזמן בשעות (ברירת מחדל: 72 אם לא צוין),
  "location": "מיקום המגורים" (ברירת מחדל: "לא צוין" אם לא צוין),
  "housing_details": "פרטים על תנאי המגורים" (ברירת מחדל: "לא צוין" אם לא צוין),
  "using_defaults": ["רשימת השדות שבהם נעשה שימוש בערכי ברירת מחדל"]
}

חשוב: אם אתה משתמש בערך ברירת מחדל עבור שדה כלשהו, הוסף את שם השדה למערך "using_defaults".
אם יש צרכים מיוחדים מרובים, הפרד אותם עם פסיקים ורווחים, לדוגמה: "אלרגיה לבוטנים, אסטמה".
`

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "אתה מומחה בחילוץ מידע מטקסט. אתה מחזיר תמיד תשובות בפורמט JSON בלבד.",
        },
        {
          role: "user",
          content: detailedPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content

    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      const extractedData = JSON.parse(jsonString)

      return NextResponse.json(extractedData)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      console.log("Raw response:", content)
      return NextResponse.json({ error: "Failed to parse extracted data" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error extracting data:", error)
    return NextResponse.json({ error: "Failed to extract data from prompt" }, { status: 500 })
  }
}
