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
      missingFields: z.array(z.string()).optional().describe("שדות חסרים שצריך לבקש מהמשתמש"),
    }),
  ),
  needsClarification: z.boolean().describe("האם נדרשות הבהרות נוספות"),
  clarificationQuestions: z.array(z.string()).describe("שאלות הבהרה אם נדרש"),
})

// Enhanced location extraction function
function extractLocationFromPrompt(prompt: string): string {
  console.log("📍 === EXTRACTING LOCATION ===")
  console.log("📍 Input prompt:", prompt)

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
      console.log(`📍 Found city: ${city}`)

      // Try to extract street address in the same city
      const streetPatterns = [
        new RegExp(`רחוב\\s+([א-ת\\s]+)\\s*\\d*[,\\s]*${city}`, "i"),
        new RegExp(`([א-ת\\s]+)\\s*\\d+[,\\s]*${city}`, "i"),
        /רחוב\s+([א-ת\\s]+)\s*\d*/i,
        /ב?רחוב\s+([א-ת\\s]+)/i,
      ]

      for (const pattern of streetPatterns) {
        const match = pattern.exec(prompt)
        if (match && match[1]) {
          const street = match[1].trim()
          console.log(`📍 Found street: ${street}`)

          // Extract house number if exists
          const numberMatch = prompt.match(new RegExp(`${street}\\s*(\\d+)`, "i"))
          const houseNumber = numberMatch ? ` ${numberMatch[1]}` : ""
          const fullAddress = `רחוב ${street}${houseNumber}, ${city}`

          console.log(`📍 Full address: ${fullAddress}`)
          return fullAddress
        }
      }

      console.log(`📍 Using city only: ${city}`)
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
      const address = `רחוב ${street} ${number}`.trim()

      console.log(`📍 Found street without city: ${address}`)
      return address
    }
  }

  console.log("📍 No location found")
  return "מיקום לא זוהה" // Don't default to Tel Aviv
}

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
    promptLower.includes("לאן") ||
    promptLower.includes("ללא מקלט") ||
    promptLower.includes("בלי מקלט")
  ) {
    console.log("🔄 Detected emergency/shelter request")

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
    console.log("🔄 Extracted location:", extractedLocation)

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
          location: null,
          radius: 2000,
          maxResults: 10,
        },
        missingFields: ["location"],
      })
    }
  }

  // Check for equipment requests
  if (
    promptLower.includes("ציוד") ||
    promptLower.includes("מה צריך") ||
    promptLower.includes("רשימה") ||
    promptLower.includes("הכנה") ||
    promptLower.includes("לקחת")
  ) {
    console.log("🔄 Detected equipment request")

    // Enhanced family/medical profile detection
    let familyProfile = null
    const missingFields = []

    // Medical conditions
    if (promptLower.includes("סכרת")) {
      familyProfile = "אדם עם סכרת"
    } else if (promptLower.includes("לחץ דם")) {
      familyProfile = "אדם עם לחץ דם גבוה"
    } else if (promptLower.includes("אסתמה")) {
      familyProfile = "אדם עם אסתמה"
    } else if (promptLower.includes("חולה")) {
      familyProfile = "אדם עם מצב רפואי מיוחד"
    }
    // Family composition
    else if (promptLower.includes("ילד")) {
      const childCount = prompt.match(/(\d+)\s*ילד/i)
      familyProfile = childCount ? `משפחה עם ${childCount[1]} ילדים` : "משפחה עם ילדים"
    } else if (promptLower.includes("תינוק")) {
      familyProfile = "משפחה עם תינוק"
    } else if (promptLower.includes("קשיש")) {
      familyProfile = "משפחה עם קשישים"
    } else {
      familyProfile = null
      missingFields.push("familyProfile")
    }

    console.log("🔄 Family profile:", familyProfile)

    tools.push({
      id: "recommend_equipment",
      name: "המלצות ציוד חירום",
      priority: familyProfile?.includes("סכרת") || familyProfile?.includes("רפואי") ? 1 : 3,
      reasoning: familyProfile
        ? `🎒 ממליץ על ציוד חירום מותאם ל${familyProfile}`
        : "🎒 ממליץ על ציוד חירום - נדרש מידע על המשפחה",
      parameters: {
        familyProfile: familyProfile,
        duration: 72,
      },
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    })
  }

  // If no specific tools identified, add general RAG
  if (tools.length === 0) {
    console.log("🔄 No specific tools identified - adding general RAG")

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

  // Check if any tool has missing fields
  const needsClarification =
    tools.some((tool) => tool.missingFields && tool.missingFields.length > 0) ||
    (extractedLocation === "מיקום לא זוהה" && tools.some((t) => t.id === "find_shelters"))

  // Generate clarification questions
  const clarificationQuestions = []

  // Add location question if needed
  if (extractedLocation === "מיקום לא זוהה" && tools.some((t) => t.id === "find_shelters")) {
    clarificationQuestions.push("איפה אתה נמצא כרגע? (כתובת מדויקת או עיר)")
  }

  // Add family profile question if needed
  if (tools.some((t) => t.id === "recommend_equipment" && t.missingFields?.includes("familyProfile"))) {
    clarificationQuestions.push("האם יש לך צרכים מיוחדים או מצב רפואי שצריך להתחשב בו?")
  }

  const plan = {
    analysis: `זוהה מצב חירום${locationInfo}. מתכנן ${tools.length} פעולות לטיפול מיידי במצב.`,
    tools,
    needsClarification,
    clarificationQuestions,
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
    if (openaiKey) {
      console.log("🤖 OpenAI API Key length:", openaiKey.length)
      console.log("🤖 OpenAI API Key prefix:", openaiKey.substring(0, 10) + "...")
    }

    try {
      console.log("🤖 === ATTEMPTING AI GENERATION ===")
      console.log("🤖 Model: gpt-4o")
      console.log("🤖 Mode: auto")
      console.log("🤖 Temperature: 0.1")

      // Try AI generation first with enhanced prompt
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

הוראות חשובות:
1. חלץ פרמטרים מדויקים מהטקסט - אל תשתמש בערכי ברירת מחדל אלא אם חסר מידע לחלוטין
2. אם חסר מידע קריטי (כמו מיקום), סמן את השדה כ-null והוסף את שם השדה ל-missingFields
3. הוסף שאלות הבהרה ספציפיות לכל מידע חסר

דוגמאות:
- "אני חולה סכרת ללא מקלט בבניין. מה הציוד שאני צריך לקחת למקלט, ואיפה המקלט הקרוב אליי?"
  → tools: [
    { 
      id: "recommend_equipment", 
      parameters: { familyProfile: "אדם עם סכרת", duration: 72 }, 
      priority: 1,
      reasoning: "🎒 ממליץ על ציוד חירום מותאם לאדם עם סכרת"
    },
    { 
      id: "find_shelters", 
      parameters: { location: null, radius: 2000, maxResults: 10 }, 
      priority: 2,
      reasoning: "🏠 מחפש מקלטים קרובים - נדרש מיקום מדויק",
      missingFields: ["location"]
    }
  ]
  → needsClarification: true
  → clarificationQuestions: ["איפה אתה נמצא כרגע?"]

- "יש לי תינוק בן שנה, אני גרה ברחוב ההגנה 5 חולון. הייתה אזעקה עכשיו"
  → tools: [
    { 
      id: "rag_chat", 
      parameters: { query: "מה לעשות באזעקה עם תינוק" }, 
      priority: 1,
      reasoning: "🚨 מזהה מצב חירום עם תינוק - צריך הוראות מיידיות"
    },
    { 
      id: "find_shelters", 
      parameters: { location: "רחוב ההגנה 5, חולון", radius: 2000, maxResults: 10 }, 
      priority: 2,
      reasoning: "🏠 מחפש מקלטים קרובים ברחוב ההגנה 5, חולון"
    },
    { 
      id: "recommend_equipment", 
      parameters: { familyProfile: "משפחה עם תינוק בן שנה", duration: 72 }, 
      priority: 3,
      reasoning: "🎒 ממליץ על ציוד חירום מותאם למשפחה עם תינוק"
    }
  ]
  → needsClarification: false

חשוב: זהה צרכים מיוחדים כמו מחלות, גיל, וכו'. תן עדיפות גבוהה לציוד רפואי. חלץ מידע מדויק מהטקסט.
`,
      })

      const endTime = Date.now()
      console.log(`✅ AI generation successful in ${endTime - startTime}ms`)
      console.log("🔍 AI plan raw:", JSON.stringify(plan, null, 2))

      // Validate tool IDs
      const validToolIds = ["rag_chat", "find_shelters", "recommend_equipment"]
      const validatedTools = plan.tools.filter((tool) => {
        const isValid = validToolIds.includes(tool.id)
        console.log(`🔍 Tool validation: ${tool.id} - ${isValid ? "VALID" : "INVALID"}`)
        return isValid
      })

      if (validatedTools.length !== plan.tools.length) {
        console.warn(
          "⚠️ Invalid tools filtered out:",
          plan.tools.filter((tool) => !validToolIds.includes(tool.id)),
        )
      }

      const validatedPlan = {
        ...plan,
        tools: validatedTools,
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
      console.error("❌ Error details:", aiError)

      if (aiError?.cause) {
        console.error("❌ Error cause:", aiError.cause)
      }

      if (aiError?.stack) {
        console.error("❌ Error stack:", aiError.stack)
      }

      // Check specific error types
      if (aiError?.message?.includes("API key")) {
        console.error("❌ API KEY ISSUE DETECTED")
      }

      if (aiError?.message?.includes("quota")) {
        console.error("❌ QUOTA ISSUE DETECTED")
      }

      if (aiError?.message?.includes("network")) {
        console.error("❌ NETWORK ISSUE DETECTED")
      }

      console.log("🔄 === FALLING BACK TO MANUAL PLAN ===")

      // Use enhanced fallback plan
      const fallbackPlan = createFallbackPlan(prompt)

      return NextResponse.json({
        ...fallbackPlan,
        source: "fallback",
        error: aiError?.message || "AI generation failed",
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
