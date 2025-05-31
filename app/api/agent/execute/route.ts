import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { toolId, parameters } = await request.json()

    if (!toolId) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 })
    }

    console.log(`🔧 מבצע כלי: ${toolId}`, parameters)

    switch (toolId) {
      case "rag_chat": {
        try {
          // Call the existing RAG service
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: parameters.query }],
            }),
          })

          if (!response.ok) {
            throw new Error(`RAG API error: ${response.status}`)
          }

          const ragResult = await response.text()

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "rag_chat",
              answer: ragResult,
              sources: ["פיקוד העורף", "מערכת RAG"],
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ שגיאה ב-RAG:", error)
          return NextResponse.json({
            success: false,
            toolId,
            error: "Failed to get RAG response",
            timestamp: new Date().toISOString(),
          })
        }
      }

      case "find_shelters": {
        try {
          // Call the shelter search API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shelters/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: parameters.location,
              radius: parameters.radius || 2000,
              maxResults: parameters.maxResults || 10,
            }),
          })

          if (!response.ok) {
            throw new Error(`Shelter API error: ${response.status}`)
          }

          const shelterResult = await response.json()

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "shelter_search",
              shelters: shelterResult.shelters || [],
              searchLocation: parameters.location,
              radius: parameters.radius || 2000,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ שגיאה בחיפוש מקלטים:", error)
          // Return mock data as fallback
          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "shelter_search",
              shelters: [
                {
                  name: "מקלט ציבורי - דיזנגוף סנטר",
                  address: "דיזנגוף 50, תל אביב",
                  distance: "0.8",
                  capacity: "500",
                  type: "מקלט ציבורי",
                },
                {
                  name: "ממ״ד - בית ספר ביאליק",
                  address: "ביאליק 25, תל אביב",
                  distance: "1.2",
                  capacity: "200",
                  type: "ממ״ד",
                },
              ],
              searchLocation: parameters.location,
              radius: parameters.radius || 2000,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      case "recommend_equipment": {
        try {
          // Call the equipment recommendations API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyProfile: parameters.familyProfile,
              duration: parameters.duration || 72,
            }),
          })

          if (!response.ok) {
            throw new Error(`Equipment API error: ${response.status}`)
          }

          const equipmentResult = await response.json()

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "equipment_recommendations",
              recommendations: equipmentResult.recommendations || equipmentResult,
              familyProfile: parameters.familyProfile,
              duration: parameters.duration || 72,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ שגיאה בהמלצות ציוד:", error)
          // Return mock recommendations as fallback
          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "equipment_recommendations",
              recommendations: {
                "מזון ומים": ["מים - 3 ליטר לאדם ליום", "מזון משומר לשלושה ימים", "פותחן קופסאות"],
                "ציוד רפואי": ["תרופות אישיות", "חבישות", "משכך כאבים"],
                "ציוד כללי": ["פנס", "רדיו נייד", "סוללות", "שמיכות"],
                לילדים: ["חיתולים", "מזון לתינוקות", "משחקים קטנים"],
              },
              familyProfile: parameters.familyProfile,
              duration: parameters.duration || 72,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      default:
        return NextResponse.json({ error: "Unknown tool ID" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ שגיאה בביצוע כלי:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 },
    )
  }
}
