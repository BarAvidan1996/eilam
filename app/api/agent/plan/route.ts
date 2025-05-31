import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Schema for the plan
const PlanSchema = z.object({
  analysis: z.string().describe("ניתוח המצב והבנת הצרכים"),
  tools: z.array(
    z.object({
      id: z.enum(["rag_chat", "find_shelters", "recommend_equipment"]).describe("מזהה הכלי"),
      name: z.string().describe("שם הכלי בעברית"),
      priority: z.number().min(1).max(10).describe("עדיפות (1 = הכי דחוף)"),
      reasoning: z.string().describe("הסבר למה הכלי הזה נחוץ"),
      parameters: z.record(z.any()).describe("פרמטרים לכלי"),
    }),
  ),
  needsClarification: z.boolean().describe("האם נדרשות הבהרות נוספות"),
  clarificationQuestions: z.array(z.string()).describe("שאלות הבהרה אם נדרש"),
})

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
      name: "הוראות חירום",
      priority: 1,
      reasoning: "מזהה מצב חירום - צריך הוראות מיידיות מפיקוד העורף",
      parameters: {
        query: "מה לעשות באזעקה עם ילדים",
      },
    })

    // Extract location for shelter search
    let location = "תל אביב" // default
    if (promptLower.includes("תל אביב")) location = "תל אביב"
    if (promptLower.includes("ירושלים")) location = "ירושלים"
    if (promptLower.includes("חיפה")) location = "חיפה"

    tools.push({
      id: "find_shelters",
      name: "חיפוש מקלטים קרובים",
      priority: 2,
      reasoning: `מחפש מקלטים קרובים באזור ${location}`,
      parameters: {
        location: location,
        radius: 2000,
        maxResults: 10,
      },
    })
  }

  // Check for equipment requests
  if (
    promptLower.includes("ציוד") ||
    promptLower.includes("מה צריך") ||
    promptLower.includes("רשימה") ||
    promptLower.includes("הכנה")
  ) {
    let familyProfile = "משפחה כללית"
    if (promptLower.includes("ילד")) familyProfile = "משפחה עם ילדים"
    if (promptLower.includes("תינוק")) familyProfile = "משפחה עם תינוק"

    tools.push({
      id: "recommend_equipment",
      name: "המלצות ציוד חירום",
      priority: 3,
      reasoning: "ממליץ על ציוד חירום מותאם למשפחה",
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
      reasoning: "מחפש מידע רלוונטי בהתבסס על השאלה",
      parameters: {
        query: prompt,
      },
    })
  }

  return {
    analysis: `זוהה מצב שדורש תגובה מיידית. מתכנן ${tools.length} פעולות לטיפול במצב.`,
    tools,
    needsClarification: false,
    clarificationQuestions: [],
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
      // Try AI generation first
      const { object: plan } = await generateObject({
        model: openai("gpt-4o"),
        schema: PlanSchema,
        prompt: `
אתה סוכן AI מומחה לחירום ובטיחות בישראל. המשתמש פנה אליך עם הבקשה הבאה:

"${prompt}"

עליך לנתח את המצב ולתכנן רצף פעולות מתאים. יש לך 3 כלים זמינים:

1. **rag_chat** - עונה על שאלות כלליות על חירום, בטיחות, נהלים
   פרמטרים: { "query": "השאלה או הנושא" }

2. **find_shelters** - מחפש מקלטים לפי מיקום
   פרמטרים: { "location": "שם המקום", "radius": 2000, "maxResults": 10 }

3. **recommend_equipment** - ממליץ על ציוד חירום
   פרמטרים: { "familyProfile": "תיאור המשפחה", "duration": 72 }

דוגמאות:
- אזעקה בתל אביב → rag_chat + find_shelters
- בקשת ציוד → recommend_equipment
- שאלה כללית → rag_chat

חשוב: תן תשובה מדויקת בעברית עם פרמטרים ספציפיים.
`,
        temperature: 0.1,
      })

      console.log("✅ תוכנית AI נוצרה:", plan)

      return NextResponse.json({
        ...plan,
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
      console.warn("⚠️ AI generation failed, using fallback:", aiError)

      // Use fallback plan
      const fallbackPlan = createFallbackPlan(prompt)

      console.log("🔄 תוכנית fallback נוצרה:", fallbackPlan)

      return NextResponse.json({
        ...fallbackPlan,
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
