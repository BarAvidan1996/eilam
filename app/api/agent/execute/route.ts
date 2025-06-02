import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"
import { shelterSearchService } from "@/lib/services/shelter-search-service"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Schema for structured equipment recommendations
const EquipmentRecommendationSchema = z.object({
  personalizedAnalysis: z.string(),
  categories: z.array(
    z.object({
      name: z.string(),
      priority: z.enum(["critical", "important", "recommended"]),
      items: z.array(
        z.object({
          name: z.string(),
          quantity: z.string(),
          reason: z.string(),
          specificToProfile: z.boolean(),
        }),
      ),
    }),
  ),
  specialConsiderations: z.array(z.string()),
  storageAdvice: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const { toolId, parameters, sessionId, planContext } = await request.json()

    console.log("🔧 === TOOL EXECUTION START ===")
    console.log("🔧 Tool ID:", toolId)
    console.log("🔧 Parameters:", JSON.stringify(parameters, null, 2))
    console.log("🔧 Session ID:", sessionId)
    console.log("🔧 Plan Context:", planContext)

    // Basic validation
    if (!toolId || typeof toolId !== "string") {
      throw new Error("Missing or invalid tool ID")
    }

    if (!parameters || typeof parameters !== "object") {
      throw new Error("Missing or invalid parameters")
    }

    let result: any

    switch (toolId) {
      case "rag_chat":
        console.log("🔧 Executing RAG chat...")

        // Validation
        if (!parameters.query || typeof parameters.query !== "string" || parameters.query.trim().length === 0) {
          throw new Error("Missing or invalid query for RAG chat")
        }

        // Enhanced RAG with context - BUILD CONTEXTUAL QUERY
        let contextualQuery = parameters.query.trim()

        // Add context from plan if available
        if (planContext?.analysis) {
          contextualQuery = `הקשר: ${planContext.analysis}\n\nשאלה ספציפית: ${parameters.query.trim()}`
        }

        // Add session context if available
        if (sessionId) {
          contextualQuery = `[מזהה שיחה: ${sessionId}] ${contextualQuery}`
        }

        console.log("🔧 Contextual query:", contextualQuery)

        const ragResult = await processRAGQuery(contextualQuery, {
          sessionId,
          planContext,
          toolParameters: parameters,
          enhancedPrompt: true,
        })

        result = {
          success: true,
          toolId,
          result: {
            type: "rag_chat",
            answer: ragResult.answer,
            sources: ragResult.sources?.map((s) => s.title) || [],
            usedFallback: ragResult.usedFallback,
            usedWebSearch: ragResult.usedWebSearch,
          },
          timestamp: new Date().toISOString(),
        }
        break

      case "find_shelters":
        console.log("🔧 Executing shelter search...")

        // Validation
        if (!parameters.location && (!parameters.lat || !parameters.lng)) {
          throw new Error("Missing location or coordinates for shelter search")
        }

        if (parameters.radius && (typeof parameters.radius !== "number" || parameters.radius <= 0)) {
          throw new Error("Invalid radius - must be a positive number")
        }

        if (parameters.maxResults && (typeof parameters.maxResults !== "number" || parameters.maxResults <= 0)) {
          throw new Error("Invalid maxResults - must be a positive number")
        }

        let coordinates = null

        if (parameters.lat && parameters.lng) {
          coordinates = { lat: parameters.lat, lng: parameters.lng }
        } else if (parameters.location) {
          coordinates = await shelterSearchService.geocodeAddress(parameters.location)
        }

        if (!coordinates) {
          throw new Error("לא ניתן לקבוע מיקום לחיפוש מקלטים")
        }

        const shelters = await shelterSearchService.searchShelters({
          location: coordinates,
          radius: parameters.radius || 1000,
          maxResults: parameters.maxResults || 5,
        })

        result = {
          success: true,
          toolId,
          result: {
            type: "shelter_search",
            shelters,
            coordinates,
            searchLocation: parameters.location,
          },
          timestamp: new Date().toISOString(),
        }
        break

      case "recommend_equipment":
        console.log("🔧 Executing equipment recommendations...")

        // Validation
        if (
          !parameters.familyProfile ||
          typeof parameters.familyProfile !== "string" ||
          parameters.familyProfile.trim().length === 0
        ) {
          throw new Error("Missing or invalid family profile for equipment recommendations")
        }

        if (parameters.duration && (typeof parameters.duration !== "number" || parameters.duration <= 0)) {
          throw new Error("Invalid duration - must be a positive number")
        }

        console.log("🔧 Generating personalized equipment recommendations...")

        try {
          // Use structured AI generation for personalized equipment recommendations
          const { object: equipmentRecommendations } = await generateObject({
            model: openai("gpt-4o"),
            schema: EquipmentRecommendationSchema,
            temperature: 0.1,
            prompt: `
אתה מומחה לחירום ובטיחות בישראל. עליך לתת המלצות ציוד חירום מותאמות אישית.

פרופיל המשפחה/אדם: ${parameters.familyProfile}
משך זמן: ${parameters.duration || 72} שעות
הקשר נוסף: ${planContext?.analysis || "מצב חירום כללי"}

עליך לנתח את הפרופיל הספציפי ולתת המלצות מותאמות אישית. 

דוגמאות לפרופילים מיוחדים:
- "אדם הגר בקומה רביעית" → צריך ציוד לירידה מהירה, חבל חירום, נעליים חזקות
- "משפחה עם ילדים" → חיתולים, מזון לילדים, משחקים להרגעה, תרופות ילדים
- "אדם עם סכרת" → מד סוכר, אינסולין, חטיפי סוכר, מזון מתאים
- "אדם מבוגר" → תרופות קבועות, משקפיים נוספים, מקל הליכה
- "בעל חיות מחמד" → מזון לחיות, רצועה, כלוב נשיאה

חלק את ההמלצות לקטגוריות עם עדיפויות:
- critical: חיוני להישרדות
- important: חשוב לנוחות ובטיחות  
- recommended: מומלץ אך לא הכרחי

עבור כל פריט, הסבר למה הוא רלוונטי לפרופיל הספציפי.

תן גם עצות אחסון מותאמות לפרופיל (למשל, אדם בקומה רביעית צריך תיק נשיאה קל).
`,
          })

          result = {
            success: true,
            toolId,
            result: {
              type: "equipment_recommendations",
              recommendations: equipmentRecommendations,
              familyProfile: parameters.familyProfile,
              duration: parameters.duration,
              isPersonalized: true,
            },
            timestamp: new Date().toISOString(),
          }
        } catch (aiError) {
          console.error("❌ AI equipment generation failed, falling back to RAG:", aiError)

          // Fallback to enhanced RAG query
          let equipmentQuery = `המלץ על ציוד חירום מותאם אישית עבור ${parameters.familyProfile} למשך ${parameters.duration || 72} שעות. 
          
חשוב: תן המלצות ספציפיות לפרופיל הזה, לא רשימה גנרית. 
הסבר למה כל פריט רלוונטי לפרופיל הספציפי.
חלק לקטגוריות: חיוני, חשוב, מומלץ.`

          // Add context from plan if available
          if (planContext?.analysis) {
            equipmentQuery = `הקשר: ${planContext.analysis}\n\nבקשה ספציפית: ${equipmentQuery}`
          }

          console.log("🔧 Equipment contextual query:", equipmentQuery)

          const equipmentResult = await processRAGQuery(equipmentQuery, {
            sessionId,
            planContext,
            toolParameters: parameters,
            enhancedPrompt: true,
            specificContext: "equipment_recommendations",
          })

          result = {
            success: true,
            toolId,
            result: {
              type: "equipment_recommendations",
              recommendations: equipmentResult.answer,
              sources: equipmentResult.sources?.map((s) => s.title) || [],
              familyProfile: parameters.familyProfile,
              duration: parameters.duration,
              isPersonalized: false,
              usedFallback: true,
            },
            timestamp: new Date().toISOString(),
          }
        }
        break

      default:
        throw new Error(`Unknown tool: ${toolId}`)
    }

    console.log("✅ Tool execution completed:", result.success)
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Tool execution failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
