import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define available tools
const AVAILABLE_TOOLS = [
  {
    id: "rag_chat",
    name: "חיפוש במידע פיקוד העורף",
    description: "עונה על שאלות כלליות על חירום, בטיחות, נהלים והוראות",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "השאלה או הנושא לחיפוש",
        required: true,
      },
    ],
  },
  {
    id: "find_shelters",
    name: "חיפוש מקלטים",
    description: "מחפש מקלטים קרובים לפי מיקום או כתובת",
    parameters: [
      {
        name: "location",
        type: "string",
        description: "כתובת, עיר או מיקום לחיפוש",
        required: true,
      },
      {
        name: "radius",
        type: "number",
        description: "רדיוס חיפוש בקילומטרים (ברירת מחדל: 2)",
        required: false,
        default: 2,
      },
    ],
  },
  {
    id: "recommend_equipment",
    name: "המלצות ציוד חירום",
    description: "ממליץ על ציוד חירום מותאם אישית לפי הרכב המשפחה",
    parameters: [
      {
        name: "familyProfile",
        type: "string",
        description: "תיאור המשפחה (מספר מבוגרים, ילדים, צרכים מיוחדים וכו')",
        required: true,
      },
      {
        name: "duration",
        type: "number",
        description: "משך זמן החירום הצפוי בשעות (ברירת מחדל: 72)",
        required: false,
        default: 72,
      },
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🤖 Agent מתכנן עבור:", prompt)

    // Create planning prompt
    const planningPrompt = `
אתה סוכן AI חכם של פיקוד העורף. תפקידך לנתח בקשות של משתמשים ולתכנן איזה כלים להפעיל.

הכלים הזמינים:
${AVAILABLE_TOOLS.map(
  (tool) => `
- ${tool.name} (${tool.id}): ${tool.description}
  פרמטרים: ${tool.parameters.map((p) => `${p.name} (${p.type}${p.required ? ", חובה" : ", אופציונלי"})`).join(", ")}
`,
).join("")}

חשוב: 
1. נתח את הבקשה ובחר רק את הכלים הרלוונטיים
2. הצע ערכים ספציפיים לפרמטרים בהתבסס על הבקשה
3. סדר את הכלים לפי עדיפות (דחוף ביותר קודם)
4. אם הבקשה לא ברורה, בקש הבהרות

בקשת המשתמש: "${prompt}"

החזר תשובה בפורמט JSON הבא:
{
  "analysis": "ניתוח קצר של הבקשה",
  "tools": [
    {
      "id": "tool_id",
      "name": "שם הכלי", 
      "priority": 1,
      "reasoning": "למה הכלי הזה נחוץ",
      "parameters": {
        "param_name": "suggested_value"
      }
    }
  ],
  "needsClarification": false,
  "clarificationQuestions": []
}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "אתה מתכנן חכם שמנתח בקשות ומחזיר תוכניות פעולה מובנות.",
        },
        {
          role: "user",
          content: planningPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content

    // Parse JSON response
    const jsonMatch = content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not parse planning response")
    }

    const plan = JSON.parse(jsonMatch[0])

    // Add tool definitions to response
    plan.availableTools = AVAILABLE_TOOLS

    console.log("📋 תוכנית נוצרה:", plan)

    return NextResponse.json(plan)
  } catch (error) {
    console.error("❌ שגיאה בתכנון:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}
