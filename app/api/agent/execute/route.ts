import { type NextRequest, NextResponse } from "next/server"
import { processRAGQuery } from "@/lib/rag-service-hybrid"

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
          }
        } catch (error) {
          console.error("RAG error:", error)
          result = {
            type: "rag_chat",
            answer: "מצטער, לא הצלחתי לקבל מידע כרגע. אנא פנה לפיקוד העורף ישירות.",
            sources: [],
          }
        }
        break

      case "find_shelters":
        // Mock data for now - will connect to real shelter search later
        result = {
          type: "shelter_search",
          shelters: [
            {
              name: "מקלט ציבורי - בית ספר אלון",
              address: "רחוב אלון 15, תל אביב",
              distance: 0.3,
              capacity: 200,
              type: "מקלט ציבורי",
              coordinates: { lat: 32.0853, lng: 34.7818 },
            },
            {
              name: "מקלט ציבורי - מרכז קהילתי",
              address: "רחוב דיזנגוף 45, תל אביב",
              distance: 0.7,
              capacity: 150,
              type: "מקלט ציבורי",
              coordinates: { lat: 32.0853, lng: 34.7818 },
            },
            {
              name: "מרחב מוגן - קניון",
              address: "רחוב בן יהודה 120, תל אביב",
              distance: 1.2,
              capacity: 500,
              type: "מרחב מוגן",
              coordinates: { lat: 32.0853, lng: 34.7818 },
            },
          ],
          searchLocation: parameters.location,
          radius: parameters.radius || 2,
        }
        break

      case "recommend_equipment":
        try {
          // Call the existing equipment recommendation API
          const equipmentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyProfile: parameters.familyProfile,
              duration: parameters.duration || 72,
            }),
          })

          if (!equipmentResponse.ok) {
            throw new Error("Equipment API failed")
          }

          const equipmentData = await equipmentResponse.json()
          result = {
            type: "equipment_recommendations",
            recommendations: equipmentData.recommendations || equipmentData,
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
