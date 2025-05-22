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

    // Call OpenAI API to extract structured data
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `אתה מומחה בחילוץ מידע מטקסט. תפקידך הוא לחלץ מידע מובנה מתיאור של משק בית לצורך הכנת רשימת ציוד חירום.
          
חלץ את המידע הבא:
1. מספר מבוגרים
2. מספר ילדים וגילאיהם (אם צוין)
3. מספר תינוקות (גיל 0-2)
4. מספר קשישים
5. מספר וסוגי חיות מחמד
6. צרכים מיוחדים (רפואיים, מוגבלויות, אלרגיות וכו')
7. משך זמן בשעות (אם לא צוין, השתמש ב-48 שעות כברירת מחדל)
8. מיקום (עיר/אזור)
9. פרטי מגורים (דירה/בית, קומה, מעלית וכו')

אם מידע מסוים לא צוין בטקסט, השתמש בערכי ברירת מחדל הגיוניים ורשום אילו שדות משתמשים בערכי ברירת מחדל.

הקפד להפריד צרכים מיוחדים בפסיקים ורווחים, למשל: "אלרגיה לבוטנים, אסטמה" ולא "אלרגיה לבוטניםאסטמה".

החזר את התשובה בפורמט JSON הבא:
{
  "adults": מספר,
  "children": מספר,
  "children_ages": [גילאים] או null,
  "babies": מספר,
  "elderly": מספר,
  "pets": מספר,
  "pet_types": [סוגים] או null,
  "special_needs": "תיאור הצרכים המיוחדים" או null,
  "duration_hours": מספר,
  "location": "מיקום" או null,
  "housing_details": "פרטי מגורים" או null,
  "using_defaults": ["שמות השדות שמשתמשים בערכי ברירת מחדל"]
}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content

    // Parse the JSON response
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      const data = JSON.parse(jsonString)

      return NextResponse.json(data)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      console.log("Raw response:", content)

      // Fallback to regex extraction if JSON parsing fails
      const fallbackData = {
        adults: extractNumber(prompt, /(\d+)\s*(מבוגרים|בוגרים|הורים|אנשים)/) || 2,
        children: extractNumber(prompt, /(\d+)\s*(ילדים|ילד)/) || 0,
        children_ages: extractAges(prompt) || null,
        babies: extractNumber(prompt, /(\d+)\s*(תינוקות|תינוק)/) || 0,
        elderly: extractNumber(prompt, /(\d+)\s*(קשישים|קשיש|מבוגרים|זקנים)/) || 0,
        pets: extractNumber(prompt, /(\d+)\s*(חיות מחמד|חיית מחמד|כלבים|חתולים)/) || 0,
        pet_types: extractPetTypes(prompt) || null,
        special_needs: extractSpecialNeeds(prompt) || null,
        duration_hours: extractNumber(prompt, /(\d+)\s*(שעות|ימים)/) || 48,
        location: null,
        housing_details: null,
        using_defaults: ["duration_hours"],
      }

      return NextResponse.json(fallbackData)
    }
  } catch (error) {
    console.error("Error extracting data:", error)
    return NextResponse.json({ error: "Failed to extract data" }, { status: 500 })
  }
}

// Helper functions for fallback extraction
function extractNumber(text, regex) {
  const match = text.match(regex)
  return match ? Number.parseInt(match[1]) : null
}

function extractAges(text) {
  const ageMatches = text.match(/ילדים בגילאי (\d+)[,\s-]*(\d+)/) || text.match(/ילד בן (\d+)/)
  if (ageMatches) {
    if (ageMatches[2]) {
      return [Number.parseInt(ageMatches[1]), Number.parseInt(ageMatches[2])]
    } else {
      return [Number.parseInt(ageMatches[1])]
    }
  }
  return null
}

function extractPetTypes(text) {
  const petTypes = []
  if (text.match(/כלב|כלבים/)) petTypes.push("כלב")
  if (text.match(/חתול|חתולים/)) petTypes.push("חתול")
  if (text.match(/תוכי|ציפור|ציפורים/)) petTypes.push("ציפור")
  return petTypes.length > 0 ? petTypes : null
}

function extractSpecialNeeds(text) {
  const specialNeeds = []
  if (text.match(/אלרגי|אלרגיה/)) {
    const allergyMatch = text.match(/אלרגי[הת]?\s+ל([א-ת\s]+)/)
    if (allergyMatch) specialNeeds.push(`אלרגיה ל${allergyMatch[1].trim()}`)
  }
  if (text.match(/אסטמה/)) specialNeeds.push("אסטמה")
  if (text.match(/סוכרת/)) specialNeeds.push("סוכרת")
  if (text.match(/לחץ דם/)) specialNeeds.push("לחץ דם גבוה")
  if (text.match(/כיסא גלגלים|ניידות|מוגבלות/)) specialNeeds.push("מוגבלות ניידות")

  return specialNeeds.length > 0 ? specialNeeds.join(", ") : null
}
