import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Simplified Schema - more flexible
const PlanSchema = z.object({
  analysis: z.string(),
  tools: z.array(
    z.object({
      id: z.enum(["rag_chat", "find_shelters", "recommend_equipment"]),
      name: z.string(),
      priority: z.number(),
      reasoning: z.string(),
      parameters: z.object({
        query: z.string().optional(),
        location: z.string().nullable().optional(),
        radius: z.number().optional(),
        maxResults: z.number().optional(),
        familyProfile: z.string().nullable().optional(),
        duration: z.number().optional(),
      }),
      missingFields: z.array(z.string()).optional(),
    }),
  ),
  needsClarification: z.boolean(),
  clarificationQuestions: z.array(z.string()),
})

// Enhanced fallback function with better medical condition detection
function createFallbackPlan(prompt: string) {
  console.log("🔄 === CREATING FALLBACK PLAN ===")
  console.log("🔄 Input prompt:", prompt)

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
    console.log("🔄 Detected emergency/shelter request")

    // Add RAG chat for emergency instructions
    let emergencyQuery = "מה לעשות באזעקה - הוראות מיידיות"
    if (promptLower.includes("לילה") || promptLower.includes("באמצע הלילה")) {
      emergencyQuery = "מה לעשות באזעקה באמצע הלילה - הוראות מיידיות לשעות הלילה"
    }

    tools.push({
      id: "rag_chat",
      name: "הוראות חירום מיידיות",
      priority: 1,
      reasoning: "🚨 מזהה מצב חירום - צריך הוראות מיידיות מפיקוד העורף",
      parameters: {
        query: emergencyQuery,
      },
    })

    // Add shelter search - let AI extract location
    tools.push({
      id: "find_shelters",
      name: "חיפוש מקלטים קרובים",
      priority: 2,
      reasoning: "🏠 מחפש מקלטים קרובים",
      parameters: {
        location: null,
        radius: 2000,
        maxResults: 10,
      },
      missingFields: ["location"],
    })
  }

  // Check for equipment requests
  if (
    promptLower.includes("ציוד") ||
    promptLower.includes("מה צריך") ||
    promptLower.includes("מוכן") ||
    promptLower.includes("קומה")
  ) {
    console.log("🔄 Detected equipment request")

    let familyProfile = null
    if (promptLower.includes("קומה רביעית") || promptLower.includes("קומה 4")) {
      familyProfile = "אדם הגר בקומה רביעית"
    } else if (promptLower.includes("ילד")) {
      familyProfile = "משפחה עם ילדים"
    }

    tools.push({
      id: "recommend_equipment",
      name: "המלצות ציוד חירום",
      priority: 3,
      reasoning: familyProfile ? `🎒 ממליץ על ציוד חירום מותאם ל${familyProfile}` : "🎒 ממליץ על ציוד חירום",
      parameters: {
        familyProfile: familyProfile,
        duration: 72,
      },
      missingFields: familyProfile ? undefined : ["familyProfile"],
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

  const plan = {
    analysis: `זוהה מצב חירום. מתכנן ${tools.length} פעולות לטיפול מיידי במצב.`,
    tools,
    needsClarification: tools.some((tool) => tool.missingFields && tool.missingFields.length > 0),
    clarificationQuestions: tools.some((t) => t.missingFields?.includes("location"))
      ? ["איפה אתה נמצא כרגע? (כתובת מדויקת או עיר)"]
      : [],
  }

  console.log("🔄 Fallback plan created:", JSON.stringify(plan, null, 2))
  return plan
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    console.log("🤖 === PLAN API START ===")
    console.log("🤖 Input prompt:", prompt)

    if (!prompt) {
      console.error("❌ No prompt provided")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if we have OpenAI API key (server-side only)
    const openaiKey = process.env.OPENAI_API_KEY
    console.log("🤖 OpenAI API Key available:", !!openaiKey)

    if (!openaiKey) {
      console.warn("⚠️ No OpenAI API key found - using fallback")
      const fallbackPlan = createFallbackPlan(prompt)
      return NextResponse.json({
        ...fallbackPlan,
        source: "fallback",
        reason: "No API key",
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

    try {
      console.log("🤖 === ATTEMPTING AI GENERATION ===")
      console.log("🤖 Model: gpt-4o")
      console.log("🤖 Mode: auto")
      console.log("🤖 Temperature: 0.1")

      // Try AI generation first with simplified prompt
      const startTime = Date.now()

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

**חשוב מאוד:** אם המשתמש מזכיר כתובת (רחוב + מספר + עיר), חלץ אותה במדויק ושים ב-location.
דוגמאות לכתובות:
- "אחד העם 10, תל אביב" → location: "אחד העם 10, תל אביב"
- "רחוב הרצל 25 חיפה" → location: "הרצל 25, חיפה"
- "דיזנגוף 100 תל אביב" → location: "דיזנגוף 100, תל אביב"

אם יש רק עיר, השתמש בעיר. אם אין מיקום כלל, השתמש ב-null.

דוגמה:
Input: "אני נמצא עכשיו בכתובת אחד העם 10, תל אביב. איפה המקלט הקרוב ביותר?"

Output:
{
  "analysis": "זוהה בקשה לחיפוש מקלט קרוב לכתובת אחד העם 10, תל אביב",
  "tools": [
    {
      "id": "find_shelters",
      "name": "חיפוש מקלטים קרובים",
      "priority": 1,
      "reasoning": "🏠 מחפש מקלטים קרובים לכתובת אחד העם 10, תל אביב",
      "parameters": {
        "location": "אחד העם 10, תל אביב",
        "radius": 1000,
        "maxResults": 5
      }
    }
  ],
  "needsClarification": false,
  "clarificationQuestions": []
}

זהה גם צרכים מיוחדים:
- "קומה רביעית" → familyProfile: "אדם הגר בקומה רביעית"
- "אזעקה בלילה" → query: "מה לעשות באזעקה באמצע הלילה"
- "עם ילדים" → familyProfile: "משפחה עם ילדים"
`,
      })

      const endTime = Date.now()
      console.log(`✅ AI generation successful in ${endTime - startTime}ms`)
      console.log("🔍 AI plan raw:", JSON.stringify(plan, null, 2))

      // Validate and clean the plan
      const validatedPlan = {
        ...plan,
        tools: plan.tools.map((tool) => ({
          ...tool,
          parameters: {
            ...tool.parameters,
            // Ensure all required fields exist
            ...(tool.id === "rag_chat" && { query: tool.parameters.query || prompt }),
            ...(tool.id === "find_shelters" && {
              location: tool.parameters.location,
              radius: tool.parameters.radius || 2000,
              maxResults: tool.parameters.maxResults || 10,
            }),
            ...(tool.id === "recommend_equipment" && {
              familyProfile: tool.parameters.familyProfile,
              duration: tool.parameters.duration || 72,
            }),
          },
        })),
      }

      console.log("✅ AI plan validated:", JSON.stringify(validatedPlan, null, 2))

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
      console.error("❌ === AI GENERATION FAILED ===")
      console.error("❌ Error type:", aiError?.constructor?.name)
      console.error("❌ Error message:", aiError?.message)

      // More specific error handling
      let errorReason = "Unknown error"
      if (aiError?.message?.includes("API key")) {
        errorReason = "Invalid API key"
      } else if (aiError?.message?.includes("quota")) {
        errorReason = "API quota exceeded"
      } else if (aiError?.message?.includes("network")) {
        errorReason = "Network error"
      } else if (aiError?.message?.includes("schema")) {
        errorReason = "Schema validation failed"
      }

      console.log("🔄 === FALLING BACK TO MANUAL PLAN ===")
      console.log("🔄 Reason:", errorReason)

      // Use enhanced fallback plan
      const fallbackPlan = createFallbackPlan(prompt)

      return NextResponse.json({
        ...fallbackPlan,
        source: "fallback",
        error: aiError?.message || "AI generation failed",
        reason: errorReason,
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
    console.error("❌ === PLAN API CRITICAL ERROR ===")
    console.error("❌ Error:", error)
    console.error("❌ Stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create plan",
      },
      { status: 500 },
    )
  }
}
