import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"
import { shelterSearchService } from "@/lib/services/shelter-search-service"

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

        // Enhanced RAG with context
        const ragResult = await processRAGQuery(parameters.query.trim(), {
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
          maxResults: parameters.maxResults || 3,
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

        // Enhanced equipment recommendations with context
        const equipmentQuery = `המלץ על ציוד חירום עבור ${parameters.familyProfile || "משפחה כללית"} למשך ${parameters.duration || 72} שעות`

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
          },
          timestamp: new Date().toISOString(),
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
