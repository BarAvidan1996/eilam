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

// Parameters validation schemas for each tool
const ToolParametersSchemas = {
  rag_chat: z.object({
    query: z.string().describe("השאלה או הנושא לחיפוש"),
  }),
  find_shelters: z.object({
    location: z.string().describe("מיקום לחיפוש"),
    radius: z.number().optional().default(2000).describe("רדיוס חיפוש במטרים"),
    maxResults: z.number().optional().default(10).describe("מספר תוצאות מקסימלי"),
  }),
  recommend_equipment: z.object({
    familyProfile: z.string().describe("תיאור המשפחה"),
    duration: z.number().optional().default(72).describe("משך זמן בשעות"),
  }),
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
        query: "מה לעשות באזעקה עם ילדים - הוראות מיידיות",
      },
    })

    // Extract location for shelter search
    let location = "תל אביב" // default
    if (promptLower.includes("תל אביב")) location = "תל אביב"
    if (promptLower.includes("ירושלים")) location = "ירושלים"
    if (promptLower.includes("חיפה")) location = "חיפה"
    if (promptLower.includes("באר שבע")) location = "באר שבע"

    // Try to extract more specific location
    const streetMatch = prompt.match(/רחוב\s+([א-ת\s]+)/i)
    if (streetMatch) {
      location = `${streetMatch[1].trim()}, ${location}`
    }

    tools.push({
      id: "find_shelters",
      name: "חיפוש מקלטים קרובים",
      priority: 2,
      reasoning: `🏠 מחפש מקלטים קרובים באזור ${location} ברדיוס 2 ק"מ`,
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
      // Try AI generation first with enhanced prompt
      const { object: plan } = await generateObject({
        model: openai("gpt-4o"),
        schema: PlanSchema,
        mode: "auto", // Enhanced mode for better schema matching
        temperature: 0.1,
        prompt: `
אתה סוכן AI מומחה לחירום ובטיחות בישראל. המשתמש פנה אליך עם הבקשה הבאה:

"${prompt}"

עליך לנתח את המצב ולתכנן רצף פעולות מתאים. יש לך 3 כלים זמינים:

1. **rag_chat** - עונה על שאלות כלליות על חירום, בטיחות, נהלים
   פרמטרים: { "query": "השאלה או הנושא לחיפוש" }

2. **find_shelters** - מחפש מקלטים לפי מיקום
   פרמטרים: { "location": "שם המקום", "radius": 2000, "maxResults": 10 }

3. **recommend_equipment** - ממליץ על ציוד חירום
   פרמטרים: { "familyProfile": "תיאור המשפחה", "duration": 72 }

כללים חשובים:
- תן עדיפות גבוהה (1-3) לפעולות מיידיות ודחופות
- עדיפות בינונית (4-6) לפעולות חשובות אך לא דחופות  
- עדיפות נמוכה (7-10) לפעולות משלימות
- השתמש רק ב-id הבאים: "rag_chat", "find_shelters", "recommend_equipment"
- אם המיקום לא ברור, השתמש ב"תל אביב" כברירת מחדל
- אם פרטי המשפחה לא ברורים, השתמש ב"משפחה כללית"

דוגמאות לתרחישים:
- אזעקה בתל אביב → rag_chat (הוראות) + find_shelters (מקלטים)
- בקשת ציוד → recommend_equipment
- שאלה כללית → rag_chat

חשוב: תן תשובה מדויקת בעברית עם פרמטרים ספציפיים. וודא שכל השדות הנדרשים קיימים.
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
      console.warn("⚠️ AI generation failed, using fallback:", aiError)

      // Use fallback plan
      const fallbackPlan = createFallbackPlan(prompt)

      console.log("🔄 תוכנית fallback נוצרה:", fallbackPlan)

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
