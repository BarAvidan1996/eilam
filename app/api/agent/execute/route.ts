import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"

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
async function executeFindShelters(parameters: { location: string; radius?: number }) {
  const { location, radius = 2 } = parameters

  // For now, return mock data - we'll integrate with the real shelter search later
  return {
    type: "shelter_search",
    location,
    radius,
    shelters: [
      {
        id: "1",
        name: "מקלט ציבורי - רחוב הרצל 15",
        address: "רחוב הרצל 15, תל אביב",
        distance: 0.3,
        capacity: 50,
        type: "ציבורי",
      },
      {
        id: "2",
        name: "מקלט בית ספר - בית ספר אלון",
        address: "רחוב אלון 8, תל אביב",
        distance: 0.7,
        capacity: 200,
        type: "בית ספר",
      },
    ],
    searchPerformed: true,
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
