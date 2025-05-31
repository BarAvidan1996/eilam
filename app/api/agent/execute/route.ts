import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"
import { shelterSearchService } from "@/lib/services/shelter-search-service"

export async function POST(request: NextRequest) {
  try {
    const { toolId, parameters } = await request.json()

    if (!toolId || !parameters) {
      return NextResponse.json({ error: "Tool ID and parameters are required" }, { status: 400 })
    }

    console.log(`🔧 מבצע כלי: ${toolId}`, parameters)

    let result

    switch (toolId) {
      case "rag_chat":
        result = await executeRAGChat(parameters)
        break

      case "find_shelters":
        result = await executeFindShelters(parameters)
        break

      case "recommend_equipment":
        result = await executeRecommendEquipment(parameters)
        break

      default:
        return NextResponse.json({ error: `Unknown tool: ${toolId}` }, { status: 400 })
    }

    console.log(`✅ כלי ${toolId} הושלם בהצלחה`)

    return NextResponse.json({
      success: true,
      toolId,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ שגיאה בביצוע כלי:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Execute RAG Chat
async function executeRAGChat(parameters: { query: string }) {
  const { query } = parameters

  const ragResult = await processRAGQuery(query)

  return {
    type: "rag_chat",
    answer: ragResult.answer,
    sources: ragResult.sources,
    usedFallback: ragResult.usedFallback,
    usedWebSearch: ragResult.usedWebSearch,
  }
}

// Execute Shelter Search
async function executeFindShelters(parameters: {
  location?: string
  address?: string
  radius?: number
  maxDuration?: number
}) {
  const { location, address, radius = 1000, maxDuration = 60 } = parameters

  try {
    const searchParams: any = { radius, maxDuration }

    if (address) {
      searchParams.address = address
    } else if (location === "current") {
      // אם המשתמש ביקש מיקום נוכחי, נחזיר הוראות לקבלת מיקום
      return {
        type: "shelter_search",
        needsLocation: true,
        message: "נדרש מיקום נוכחי. אנא אפשר גישה למיקום או הזן כתובת ספציפית.",
        searchParams: { radius, maxDuration },
      }
    } else {
      throw new Error("נדרשת כתובת או מיקום לחיפוש מקלטים")
    }

    const result = await shelterSearchService.searchShelters(searchParams)

    return {
      type: "shelter_search",
      searchLocation: result.searchLocation,
      shelters: result.shelters.slice(0, 10), // מגביל ל-10 תוצאות
      totalFound: result.totalFound,
      searchRadius: result.searchRadius,
      searchPerformed: true,
    }
  } catch (error) {
    console.error("Error in shelter search:", error)
    return {
      type: "shelter_search",
      error: error instanceof Error ? error.message : "שגיאה בחיפוש מקלטים",
      searchPerformed: false,
    }
  }
}

// Execute Equipment Recommendations
async function executeRecommendEquipment(parameters: { familyProfile: string; duration?: number }) {
  const { familyProfile, duration = 72 } = parameters

  // Call the existing AI recommendations API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ai-recommendations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: familyProfile,
        extractedData: {
          duration_hours: duration,
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error("Failed to get equipment recommendations")
  }

  const data = await response.json()

  return {
    type: "equipment_recommendations",
    familyProfile,
    duration,
    recommendations: data,
  }
}
