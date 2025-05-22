import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// פונקציה לחישוב מרחק לוינשטיין (דומה ל-fuzzywuzzy בפייתון)
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null))

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost, // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

// פונקציה לבדיקת התאמה סמנטית בסיסית
function isSemanticMatch(keyword: string, text: string): boolean {
  keyword = keyword.toLowerCase().trim()
  text = text.toLowerCase().trim()

  // בדיקת הכלה פשוטה
  if (text.includes(keyword)) return true

  // בדיקת מרחק לוינשטיין - אם המרחק קטן מספיק ביחס לאורך המילה, יש התאמה
  const distance = levenshteinDistance(keyword, text)
  const maxLength = Math.max(keyword.length, text.length)
  const similarity = 1 - distance / maxLength

  return similarity > 0.7 // סף התאמה של 70%
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    // שימוש ב-OpenAI לחילוץ נתונים מהטקסט
    const systemPrompt = `
    אתה מומחה בחילוץ מידע מטקסט. תפקידך הוא לנתח את התיאור של משק הבית ולחלץ מידע מדויק על:
    1. מספר המבוגרים
    2. מספר הילדים (גילאי 3-18)
    3. מספר התינוקות (גילאי 0-3)
    4. מספר הקשישים (מעל גיל 65)
    5. מספר חיות המחמד
    6. צרכים מיוחדים או מצבים רפואיים
    7. משך זמן בשעות שהציוד אמור להספיק (ברירת מחדל: 72 שעות)
    
    חשוב מאוד: אם המידע לא מוזכר במפורש, אל תנחש. השתמש בחיפוש סמנטי כדי לזהות מידע גם אם הוא מנוסח בצורה שונה.
    
    החזר את התשובה בפורמט JSON בלבד:
    {
      "adults": מספר (או null אם לא מוזכר),
      "children": מספר (או null אם לא מוזכר),
      "babies": מספר (או null אם לא מוזכר),
      "elderly": מספר (או null אם לא מוזכר),
      "pets": מספר (או null אם לא מוזכר),
      "special_needs": תיאור מילולי (או null אם לא מוזכר),
      "duration_hours": מספר שעות (או 72 כברירת מחדל),
      "using_defaults": מערך של שמות השדות שבהם נעשה שימוש בערכי ברירת מחדל
    }
    
    דוגמאות לחילוץ מידע:
    1. "אני גר עם אשתי ושני ילדים בני 5 ו-7, וכלב" -> {"adults": 2, "children": 2, "babies": 0, "elderly": 0, "pets": 1, "special_needs": null, "duration_hours": 72, "using_defaults": ["babies", "elderly", "special_needs", "duration_hours"]}
    2. "משפחה של 4 נפשות עם תינוק בן שנה וסבא שגר איתנו" -> {"adults": 2, "children": 1, "babies": 1, "elderly": 1, "pets": 0, "special_needs": null, "duration_hours": 72, "using_defaults": ["pets", "special_needs", "duration_hours"]}
    3. "אני ובעלי גרים בדירה עם חתול. אני סובלת מאסטמה" -> {"adults": 2, "children": 0, "babies": 0, "elderly": 0, "pets": 1, "special_needs": "אסטמה", "duration_hours": 72, "using_defaults": ["children", "babies", "elderly", "duration_hours"]}
    
    נסה לחלץ מידע גם אם הוא מנוסח בצורה עקיפה, למשל "זוג עם ילד" = 2 מבוגרים ו-1 ילד.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    try {
      // ניסיון לפרסר את התשובה כ-JSON
      const extractedData = JSON.parse(text)

      // וידוא שהשדות הנדרשים קיימים ותקינים
      const validatedData = {
        adults: typeof extractedData.adults === "number" ? extractedData.adults : 2,
        children: typeof extractedData.children === "number" ? extractedData.children : 0,
        babies: typeof extractedData.babies === "number" ? extractedData.babies : 0,
        elderly: typeof extractedData.elderly === "number" ? extractedData.elderly : 0,
        pets: typeof extractedData.pets === "number" ? extractedData.pets : 0,
        special_needs: extractedData.special_needs || null,
        duration_hours: typeof extractedData.duration_hours === "number" ? extractedData.duration_hours : 72,
        using_defaults: Array.isArray(extractedData.using_defaults) ? extractedData.using_defaults : [],
      }

      // אם שדה כלשהו הוחלף בערך ברירת מחדל, נוסיף אותו לרשימת השדות שבהם נעשה שימוש בברירת מחדל
      if (extractedData.adults === null || extractedData.adults === undefined) {
        validatedData.using_defaults.push("adults")
      }
      if (extractedData.children === null || extractedData.children === undefined) {
        validatedData.using_defaults.push("children")
      }
      if (extractedData.babies === null || extractedData.babies === undefined) {
        validatedData.using_defaults.push("babies")
      }
      if (extractedData.elderly === null || extractedData.elderly === undefined) {
        validatedData.using_defaults.push("elderly")
      }
      if (extractedData.pets === null || extractedData.pets === undefined) {
        validatedData.using_defaults.push("pets")
      }
      if (!extractedData.special_needs) {
        validatedData.using_defaults.push("special_needs")
      }
      if (extractedData.duration_hours === null || extractedData.duration_hours === undefined) {
        validatedData.using_defaults.push("duration_hours")
      }

      // הסרת כפילויות מרשימת השדות שבהם נעשה שימוש בברירת מחדל
      validatedData.using_defaults = [...new Set(validatedData.using_defaults)]

      return NextResponse.json(validatedData)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      console.log("Raw response:", text)

      // במקרה של שגיאה, נחזיר ערכי ברירת מחדל
      return NextResponse.json({
        adults: 2,
        children: 0,
        babies: 0,
        elderly: 0,
        pets: 0,
        special_needs: null,
        duration_hours: 72,
        using_defaults: ["adults", "children", "babies", "elderly", "pets", "special_needs", "duration_hours"],
      })
    }
  } catch (error) {
    console.error("Error in extract-data API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
