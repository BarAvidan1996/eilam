import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"
import { shelterSearchService } from "@/lib/services/shelter-search-service"

export async function POST(request: NextRequest) {
  try {
    const { toolId, parameters } = await request.json()

    console.log(`🔧 מבצע כלי: ${toolId}`, parameters)

    let result: any

    switch (toolId) {
      case "rag_chat":
        try {
          const ragResult = await processRAGQuery(parameters.query)
          result = {
            type: "rag_chat",
            answer: ragResult.answer,
            sources: ragResult.sources || [],
            usedFallback: ragResult.usedFallback,
            usedWebSearch: ragResult.usedWebSearch,
          }
        } catch (error) {
          console.error("RAG error:", error)
          result = {
            type: "rag_chat",
            answer: "מצטער, לא הצלחתי לקבל מידע כרגע. אנא פנה לפיקוד העורף ישירות.",
            sources: [],
            usedFallback: true,
          }
        }
        break

      case "find_shelters":
        try {
          // Parse location from parameters
          let location: { lat: number; lng: number }

          if (parameters.location && typeof parameters.location === "object") {
            location = parameters.location
          } else if (parameters.location && typeof parameters.location === "string") {
            // If location is a string, try to geocode it
            location = await geocodeAddress(parameters.location)
          } else {
            throw new Error("Location parameter is required")
          }

          const radius = parameters.radius || 2000 // Default 2km
          const maxResults = parameters.maxResults || 10

          console.log(`🏠 חיפוש מקלטים ב-${location.lat},${location.lng} ברדיוס ${radius}m`)

          // Search for shelters using the service
          const shelters = await shelterSearchService.searchShelters({
            location,
            radius,
            maxResults,
          })

          result = {
            type: "shelter_search",
            shelters,
            searchLocation: location,
            radius,
            searchPerformed: true,
            timestamp: new Date().toISOString(),
          }
        } catch (error) {
          console.error("Shelter search error:", error)
          result = {
            type: "shelter_search",
            shelters: [],
            error: error instanceof Error ? error.message : "Failed to search shelters",
            searchPerformed: false,
          }
        }
        break

      case "recommend_equipment":
        try {
          // Call the existing equipment recommendation API
          const equipmentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: parameters.familyProfile,
              extractedData: {
                duration_hours: parameters.duration || 72,
              },
            }),
          })

          if (!equipmentResponse.ok) {
            throw new Error("Equipment API failed")
          }

          const equipmentData = await equipmentResponse.json()
          result = {
            type: "equipment_recommendations",
            recommendations: equipmentData,
            familyProfile: parameters.familyProfile,
            duration: parameters.duration || 72,
          }
        } catch (error) {
          console.error("Equipment recommendation error:", error)
          result = {
            type: "equipment_recommendations",
            recommendations: {
              error: "לא הצלחתי לקבל המלצות ציוד כרגע",
              basic_items: [
                "מים - 3 ליטר לאדם ליום",
                "מזון יבש לכמה ימים",
                "פנס וסוללות",
                "רדיו נייד",
                "ערכת עזרה ראשונה",
                "תרופות אישיות",
              ],
            },
          }
        }
        break

      default:
        throw new Error(`Unknown tool: ${toolId}`)
    }

    console.log(`✅ כלי ${toolId} הושלם בהצלחה`)

    return NextResponse.json({
      success: true,
      toolId,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`❌ שגיאה בביצוע כלי:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
        toolId: request.body?.toolId || "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to geocode address to coordinates
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || process.env.GOOGLE_MAPS_API

  if (!apiKey) {
    // Fallback to Tel Aviv coordinates if no API key
    console.warn("No Google Maps API key - using Tel Aviv coordinates")
    return { lat: 32.0853, lng: 34.7818 }
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
    url.searchParams.set("address", address)
    url.searchParams.set("key", apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    } else {
      throw new Error(`Geocoding failed: ${data.status}`)
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    // Fallback to Tel Aviv coordinates
    return { lat: 32.0853, lng: 34.7818 }
  }
}
