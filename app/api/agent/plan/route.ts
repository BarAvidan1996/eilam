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

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🤖 מתכנן פעולות עבור:", prompt)

    const { object: plan } = await generateObject({
      model: openai("gpt-4o"),
      schema: PlanSchema,
      prompt: `
אתה סוכן AI מומחה לחירום ובטיחות בישראל. המשתמש פנה אליך עם הבקשה הבאה:

"${prompt}"

עליך לנתח את המצב ולתכנן רצף פעולות מתאים. יש לך 3 כלים זמינים:

1. **rag_chat** - עונה על שאלות כלליות על חירום, בטיחות, נהלים
   פרמטרים: { query: string }

2. **find_shelters** - מחפש מקלטים לפי מיקום
   פרמטרים: { location: string, radius?: number }

3. **recommend_equipment** - ממליץ על ציוד חירום
   פרמטרים: { familyProfile: string, duration?: number }

כללים חשובים:
- תן עדיפות גבוהה (1-3) לפעולות מיידיות ודחופות
- עדיפות בינונית (4-6) לפעולות חשובות אך לא דחופות  
- עדיפות נמוכה (7-10) לפעולות משלימות
- אם המיקום לא ברור, בקש הבהרה
- אם פרטי המשפחה לא ברורים להמלצות ציוד, בקש הבהרה

דוגמאות לתרחישים:
- אזעקה + מיקום → rag_chat (הוראות) + find_shelters (מקלטים)
- בקשת ציוד + פרטי משפחה → recommend_equipment
- שאלה כללית → rag_chat בלבד

תן תשובה בעברית, מקצועית ומדויקת.
`,
    })

    console.log("✅ תוכנית נוצרה:", plan)

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
