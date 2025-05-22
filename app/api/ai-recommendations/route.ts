import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Extract data from the prompt first
    const extractResponse = await fetch(new URL("/api/extract-data", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!extractResponse.ok) {
      console.error("Error extracting data:", await extractResponse.text())
      return NextResponse.json({ error: "Failed to extract data from prompt" }, { status: 500 })
    }

    const extractedData = await extractResponse.json()
    console.log("Extracted data:", extractedData)

    // Prepare the system prompt with instructions for the AI
    const systemPrompt = `
    אתה מומחה לציוד חירום ובטיחות. תפקידך הוא ליצור רשימת ציוד מותאמת אישית למצבי חירום.

    הנחיות חשובות:
    1. כלול את כל פריטי הציוד הבסיסיים המומלצים על ידי פיקוד העורף לכל משק בית.
    2. הוסף פריטים ייחודיים המתאימים למאפיינים הספציפיים של משק הבית (כמו ילדים, תינוקות, חיות מחמד, קשישים, אנשים עם צרכים מיוחדים).
    3. התאם את הכמויות המומלצות לפי מספר האנשים במשק הבית.
    4. סווג כל פריט לקטגוריה מתאימה ורמת חשיבות.
    5. הוסף מידע שימושי כמו הוראות שימוש, חיי מדף, וכמות מומלצת לאדם.

    קטגוריות אפשריות:
    - water_food: מים ומזון
    - medical: ציוד רפואי
    - hygiene: היגיינה
    - lighting_energy: תאורה ואנרגיה
    - communication: תקשורת
    - documents_money: מסמכים וכסף
    - children: ציוד לילדים
    - pets: ציוד לחיות מחמד
    - elderly: ציוד לקשישים
    - special_needs: ציוד לאנשים עם צרכים מיוחדים
    - other: ציוד כללי

    רמות חשיבות:
    5 - הכרחי (חיוני לשרידות)
    4 - חשוב מאוד
    3 - חשוב
    2 - מומלץ
    1 - אופציונלי

    החזר תשובה בפורמט JSON בלבד עם שני שדות:
    1. profile: פרופיל משק הבית (מספר מבוגרים, ילדים, תינוקות, חיות מחמד, צרכים מיוחדים, משך זמן מומלץ בשעות)
    2. items: מערך של פריטי ציוד מומלצים

    דוגמה לפריט:
    {
      "id": "unique_id",
      "name": "שם הפריט",
      "category": "קטגוריה",
      "quantity": מספר,
      "unit": "יחידת מידה",
      "importance": מספר (1-5),
      "description": "תיאור קצר",
      "shelf_life": "חיי מדף",
      "usage_instructions": "הוראות שימוש",
      "recommended_quantity_per_person": "כמות מומלצת לאדם",
      "obtained": false,
      "expiryDate": null,
      "aiSuggestedExpiryDate": "YYYY-MM-DD או null",
      "sendExpiryReminder": false
    }
    `

    // Prepare the user prompt with extracted data
    const userPrompt = `
    אני צריך רשימת ציוד חירום מותאמת אישית למשק הבית הבא:
    
    ${prompt}
    
    מידע שחולץ מהתיאור:
    - מבוגרים: ${extractedData.adults}
    - ילדים: ${extractedData.children}
    - תינוקות: ${extractedData.babies}
    - קשישים: ${extractedData.elderly}
    - חיות מחמד: ${extractedData.pets}
    - צרכים מיוחדים: ${extractedData.special_needs}
    - משך זמן מומלץ: ${extractedData.duration_hours} שעות
    
    אנא צור רשימת ציוד מותאמת אישית שתכלול את כל הפריטים הבסיסיים המומלצים על ידי פיקוד העורף, וגם פריטים ייחודיים המתאימים למאפיינים הספציפיים של משק הבית הזה.
    `

    // Generate recommendations using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    // Parse the response
    let recommendations
    try {
      recommendations = JSON.parse(text)
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", text)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Add unique IDs to items if not present
    if (recommendations.items) {
      recommendations.items = recommendations.items.map((item, index) => ({
        ...item,
        id: item.id || `ai_item_${index}`,
      }))
    }

    // Add the "using_defaults" information to the profile
    recommendations.profile = {
      ...recommendations.profile,
      using_defaults: extractedData.using_defaults,
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Error in AI recommendations route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
