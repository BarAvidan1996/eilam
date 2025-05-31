import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Define available tools
    const availableTools = [
      {
        id: "rag_chat",
        name: "חיפוש מידע בפיקוד העורף",
        description: "מחפש מידע רלוונטי במאגר המידע של פיקוד העורף ומקורות נוספים",
        parameters: {
          query: "שאלה או נושא לחיפוש",
        },
      },
      {
        id: "find_shelters",
        name: "חיפוש מקלטים",
        description: "מחפש מקלטים קרובים למיקום מסוים",
        parameters: {
          location: "כתובת או שם מקום",
          radius: "רדיוס חיפוש במטרים (מספר)",
        },
      },
      {
        id: "recommend_equipment",
        name: "המלצות ציוד חירום",
        description: "מספק המלצות מותאמות אישית לציוד חירום",
        parameters: {
          familyProfile: "תיאור המשפחה והצרכים המיוחדים",
          duration: "משך זמן בשעות (מספר)",
        },
      },
    ]

    // Create a prompt for the AI to analyze the user's request
    const systemPrompt = `
    אתה עוזר AI מומחה לחירום בישראל שמנתח בקשות משתמשים ומתכנן פעולות.
    
    תפקידך:
    1. לנתח את בקשת המשתמש ולהבין מה הוא צריך
    2. לבחור את הכלים המתאימים מהרשימה הזמינה
    3. לקבוע סדר עדיפויות לכלים (1 = הכי חשוב)
    4. להסביר למה כל כלי נבחר
    5. להציע פרמטרים מתאימים לכל כלי
    
    כלים זמינים:
    ${availableTools.map((tool) => `- ${tool.id}: ${tool.description}`).join("\n")}
    
    אם חסר מידע חיוני, ציין זאת וכתוב שאלות הבהרה.
    
    הפלט שלך חייב להיות ב-JSON בפורמט הבא:
    {
      "analysis": "ניתוח קצר של הבקשה",
      "needsClarification": boolean,
      "clarificationQuestions": ["שאלה 1", "שאלה 2"],
      "tools": [
        {
          "id": "tool_id",
          "name": "שם הכלי",
          "priority": number,
          "reasoning": "הסבר למה הכלי נבחר",
          "parameters": {
            "param1": "ערך1",
            "param2": "ערך2"
          }
        }
      ]
    }
    `

    // Call OpenAI to analyze the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    })

    // Parse the response
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("Empty response from OpenAI")
    }

    let planData
    try {
      planData = JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse OpenAI response:", content)
      throw new Error("Invalid response format from AI")
    }

    // Add available tools to the response
    planData.availableTools = availableTools

    return NextResponse.json(planData)
  } catch (error) {
    console.error("Error in agent planning:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
