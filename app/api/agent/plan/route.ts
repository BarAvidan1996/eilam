import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Enhanced Schema with more flexible validation
const PlanSchema = z.object({
  analysis: z.string().describe("ניתוח המצב והבנת הצרכים"),
  tools: z.array(
    z.object({
      id: z.string().describe("מזהה הכלי (rag_chat, find_shelters, recommend_equipment)"),
      name: z.string().describe("שם הכלי בעברית"),
      priority: z.number().min(1).max(10).describe("עדיפות (1 = הכי דחוף)"),
      reasoning: z.string().describe("הסבר למה הכלי הזה נחוץ"),
      parameters: z.record(z.any()).describe("פרמטרים לכלי"),
    }),
  ),
  needsClarification: z.boolean().describe("האם נדרשות הבהרות נוספות"),
  clarificationQuestions: z.array(z.string()).describe("שאלות הבהרה אם נדרש"),
})

// Enhanced location extraction function
function extractLocationFromPrompt(prompt: string): string {
  const promptLower = prompt.toLowerCase()

  // Israeli cities - comprehensive list
  const cities = [
    "תל אביב",
    "ירושלים",
    "חיפה",
    "באר שבע",
    "ראשון לציון",
    "פתח תקווה",
    "אשדוד",
    "נתניה",
    "בני ברק",
    "חולון",
    "רמת גן",
    "בת ים",
    "אשקלון",
    "הרצליה",
    "כפר סבא",
    "רעננה",
    "הוד השרון",
    "רמלה",
    "לוד",
    "מודיעין",
    "קריית גת",
    "קריית מלאכי",
    "יבנה",
    "גדרה",
    "נס ציונה",
    "רחובות",
  ]

  // Try to find city names
  for (const city of cities) {
    if (promptLower.includes(city)) {
      // Try to extract street address in the same city
      const streetPatterns = [
        new RegExp(`רחוב\\s+([א-ת\\s]+)\\s*\\d*[,\\s]*${city}`, "i"),
        new RegExp(`([א-ת\\s]+)\\s*\\d+[,\\s]*${city}`, "i"),
        /רחוב\s+([א-ת\s]+)\s*\d*/i,
        /ב?רחוב\s+([א-ת\s]+)/i,
      ]

      for (const pattern of streetPatterns) {
        const match = pattern.exec(prompt)
        if (match && match[1]) {
          const street = match[1].trim()
          // Extract house number if exists
          const numberMatch = prompt.match(new RegExp(`${street}\\s*(\\d+)`, "i"))
          const houseNumber = numberMatch ? ` ${numberMatch[1]}` : ""
          return `רחוב ${street}${houseNumber}, ${city}`
        }
      }

      return city
    }
  }

  // Try to extract street without city
  const streetPatterns = [/רחוב\s+([א-ת\\s]+)\s*(\d+)/i, /ב?רחוב\s+([א-ת\\s]+)/i, /([א-ת\\s]+)\s+(\d+)/i]

  for (const pattern of streetPatterns) {
    const match = pattern.exec(prompt)
    if (match && match[1]) {
      const street = match[1].trim()
      const number = match[2] || ""
      return `רחוב ${street} ${number}`.trim()
    }
  }

  return "מיקום לא זוהה" // Don't default to Tel Aviv
}

// Fallback function to create plan manually
function createFallbackPlan(prompt: string) {
  const promptLower = prompt.toLowerCase()
  const tools: any[] = []

  // Check for emergency/shelter needs
  if (
    promptLower.includes("אזעקה") ||
    promptLower.includes("מקלט") ||
    promptLower.includes("מקלטים") ||
    promptLower.includes("איפה") ||
    promptLower.includes("לאן")
  ) {
    // Add RAG chat for emergency instructions
    tools.push({
      id: "rag_chat",
      name: "הוראות חירום מיידיות",
      priority: 1,
      reasoning: "🚨 מזהה מצב חירום - צריך הוראות מיידיות מפיקוד העורף",
      parameters: {
        query: "מה לעשות באזעקה - הוראות מיידיות",
      },
    })

    // Extract location for shelter search
    const extractedLocation = extractLocationFromPrompt(prompt)

    if (extractedLocation !== "מיקום לא זוהה") {
      tools.push({
        id: "find_shelters",
        name: "חיפוש מקלטים קרובים",
        priority: 2,
        reasoning: `🏠 מחפש מקלטים קרובים ב${extractedLocation}`,
        parameters: {
          location: extractedLocation,
          radius: 2000,
          maxResults: 10,
        },
      })
    } else {
      // Add shelter search but mark as needing location
      tools.push({
        id: "find_shelters",
        name: "חיפוש מקלטים קרובים",
        priority: 2,
        reasoning: "🏠 מחפש מקלטים קרובים - נדרש מיקום מדויק",
        parameters: {
          location: "נדרש מיקום",
          radius: 2000,
          maxResults: 10,
        },
      })
    }
  }

  // Check for equipment requests
  if (
    promptLower.includes("ציוד") ||
    promptLower.includes("מה צריך") ||
    promptLower.includes("רשימה") ||
    promptLower.includes("הכנה")
  ) {
    let familyProfile = "משפחה כללית"
    if (promptLower.includes("ילד")) {
      const childCount = prompt.match(/(\d+)\s*ילד/i)
      familyProfile = childCount ? `משפחה עם ${childCount[1]} ילדים` : "משפחה עם ילדים"
    }
    if (promptLower.includes("תינוק")) familyProfile = "משפחה עם תינוק"

    tools.push({
      id: "recommend_equipment",
      name: "המלצות ציוד חירום",
      priority: 3,
      reasoning: `🎒 ממליץ על ציוד חירום מותאם ל${familyProfile}`,
      parameters: {
        familyProfile: familyProfile,
        duration: 72,
      },
    })
  }

  // If no specific tools identified, add general RAG
  if (tools.length === 0) {
    tools.push({
      id: "rag_chat",
      name: "מידע כללי על חירום",
      priority: 1,
      reasoning: "🔍 מחפש מידע רלוונטי בהתבסס על השאלה",
      parameters: {
        query: prompt,
      },
    })
  }

  const extractedLocation = extractLocationFromPrompt(prompt)
  const locationInfo = extractedLocation !== "מיקום לא זוהה" ? ` באזור ${extractedLocation}` : ""

  return {
    analysis: `זוהה מצב חירום${locationInfo}. מתכנן ${tools.length} פעולות לטיפול מיידי במצב.`,
    tools,
    needsClarification: extractedLocation === "מיקום לא זוהה" && tools.some((t) => t.id === "find_shelters"),
    clarificationQuestions:
      extractedLocation === "מיקום לא זוהה" && tools.some((t) => t.id === "find_shelters")
        ? ["איפה אתה נמצא כרגע? (כתובת מדויקת או עיר)"]
        : [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🤖 מתכנן פעולות עבור:", prompt)

    try {
      // Try AI generation first with enhanced prompt
      const { object: plan } = await generateObject({
        model: openai("gpt-4o"),
        schema: PlanSchema,
        mode: "auto",
        temperature: 0.1,
        prompt: `
אתה סוכן AI מומחה לחירום ובטיחות בישראל. המשתמש פנה אליך עם הבקשה הבאה:

"${prompt}"

עליך לנתח את המצב ולתכנן רצף פעולות מתאים. יש לך 3 כלים זמינים:

1. **rag_chat** - עונה על שאלות כלליות על חירום, בטיחות, נהלים
   פרמטרים: { "query": "השאלה או הנושא לחיפוש" }

2. **find_shelters** - מחפש מקלטים לפי מיקום
   פרמטרים: { "location": "כתובת מדויקת או עיר", "radius": 2000, "maxResults": 10 }

3. **recommend_equipment** - ממליץ על ציוד חירום
   פרמטרים: { "familyProfile": "תיאור המשפחה", "duration": 72 }

הוראות חשובות לזיהוי מיקום:
- חפש שמות ערים ישראליות: תל אביב, ירושלים, חיפה, באר שבע, ראשון לציון, פתח תקווה, אשדוד, נתניה, וכו'
- חפש כתובות: "רחוב X", "X מספר Y", "בX"
- אם יש כתובת מדויקת, השתמש בה במלואה
- אל תשתמש בברירת מחדל "תל אביב" אם המיקום לא ברור

דוגמאות:
- "אזעקה בראשון לציון ברחוב הרצל 5" → location: "רחוב הרצל 5, ראשון לציון"
- "מקלטים בחיפה" → location: "חיפה"
- "איפה מקלטים?" → needsClarification: true

חשוב: זהה מיקומים בדיוק ואל תניח הנחות!
`,
      })

      console.log("🔍 תוכנית AI שנוצרה:", JSON.stringify(plan, null, 2))

      // Validate tool IDs
      const validToolIds = ["rag_chat", "find_shelters", "recommend_equipment"]
      const validatedTools = plan.tools.filter((tool) => validToolIds.includes(tool.id))

      if (validatedTools.length !== plan.tools.length) {
        console.warn(
          "⚠️ כלים לא תקינים סוננו:",
          plan.tools.filter((tool) => !validToolIds.includes(tool.id)),
        )
      }

      const validatedPlan = {
        ...plan,
        tools: validatedTools,
      }

      console.log("✅ תוכנית AI מאומתת נוצרה:", validatedPlan)

      return NextResponse.json({
        ...validatedPlan,
        source: "ai",
        availableTools: [
          {
            id: "rag_chat",
            name: "חיפוש במידע פיקוד העורף",
            description: "עונה על שאלות כלליות על חירום, בטיחות ונהלים",
          },
          {
            id: "find_shelters",
            name: "חיפוש מקלטים",
            description: "מוצא מקלטים קרובים לפי מיקום",
          },
          {
            id: "recommend_equipment",
            name: "המלצות ציוד",
            description: "ממליץ על ציוד חירום מותאם למשפחה",
          },
        ],
      })
    } catch (aiError) {
      console.warn("⚠️ AI generation failed, using enhanced fallback:", aiError)

      // Use enhanced fallback plan
      const fallbackPlan = createFallbackPlan(prompt)

      console.log("🔄 תוכנית fallback משופרת נוצרה:", fallbackPlan)

      return NextResponse.json({
        ...fallbackPlan,
        source: "fallback",
        availableTools: [
          {
            id: "rag_chat",
            name: "חיפוש במידע פיקוד העורף",
            description: "עונה על שאלות כלליות על חירום, בטיחות ונהלים",
          },
          {
            id: "find_shelters",
            name: "חיפוש מקלטים",
            description: "מוצא מקלטים קרובים לפי מיקום",
          },
          {
            id: "recommend_equipment",
            name: "המלצות ציוד",
            description: "ממליץ על ציוד חירום מותאם למשפחה",
          },
        ],
      })
    }
  } catch (error) {
    console.error("❌ שגיאה ביצירת תוכנית:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create plan",
      },
      { status: 500 },
    )
  }
}
