import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Parameters validation schemas for each tool
const ToolParametersSchemas = {
  rag_chat: z.object({
    query: z.string().min(1, "Query is required"),
  }),
  find_shelters: z.object({
    location: z.string().min(1, "Location is required"),
    radius: z.number().optional().default(2000),
    maxResults: z.number().optional().default(10),
  }),
  recommend_equipment: z.object({
    familyProfile: z.string().min(1, "Family profile is required"),
    duration: z.number().optional().default(72),
  }),
}

export async function POST(request: NextRequest) {
  try {
    const { toolId, parameters } = await request.json()

    if (!toolId) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 })
    }

    console.log(`🔧 מבצע כלי: ${toolId}`, parameters)

    // Validate tool ID
    if (!Object.keys(ToolParametersSchemas).includes(toolId)) {
      return NextResponse.json({ error: `Unknown tool ID: ${toolId}` }, { status: 400 })
    }

    // Validate parameters
    const schema = ToolParametersSchemas[toolId as keyof typeof ToolParametersSchemas]
    const validationResult = schema.safeParse(parameters)

    if (!validationResult.success) {
      console.error("❌ Parameter validation failed:", validationResult.error)
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const validatedParams = validationResult.data

    switch (toolId) {
      case "rag_chat": {
        console.log("🔍 בודק מידע במערכת פיקוד העורף...")
        try {
          // Call the existing RAG service
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: validatedParams.query }],
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
              query: validatedParams.query,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ שגיאה ב-RAG:", error)
          // Fallback response
          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "rag_chat",
              answer: `בעת אזעקה:
1. היכנסו למקלט הקרוב ביותר או לחדר המוגן
2. סגרו דלתות וחלונות
3. הישארו במקלט עד לקבלת הודעה על סיום האזעקה
4. עם ילדים - הישארו רגועים ותסבירו להם שזה זמני
5. הקשיבו לרדיו לעדכונים

מקורות: פיקוד העורף`,
              sources: ["פיקוד העורף - הוראות חירום"],
              query: validatedParams.query,
              usedFallback: true,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      case "find_shelters": {
        console.log(`🏠 מחפש מקלטים באזור ${validatedParams.location}...`)
        try {
          // Call the shelter search API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shelters/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validatedParams),
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
              searchLocation: validatedParams.location,
              radius: validatedParams.radius,
              searchPerformed: true,
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
                  walkingTime: "10 דקות הליכה",
                },
                {
                  name: "ממ״ד - בית ספר ביאליק",
                  address: "ביאליק 25, תל אביב",
                  distance: "1.2",
                  capacity: "200",
                  type: "ממ״ד",
                  walkingTime: "15 דקות הליכה",
                },
                {
                  name: "מרחב מוגן - קניון איילון",
                  address: "איילון מול, תל אביב",
                  distance: "1.8",
                  capacity: "1000",
                  type: "מרחב מוגן",
                  walkingTime: "22 דקות הליכה",
                },
              ],
              searchLocation: validatedParams.location,
              radius: validatedParams.radius,
              searchPerformed: true,
              usedFallback: true,
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      case "recommend_equipment": {
        console.log(`🎒 מכין המלצות ציוד עבור ${validatedParams.familyProfile}...`)
        try {
          // Call the equipment recommendations API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyProfile: validatedParams.familyProfile,
              duration: validatedParams.duration,
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
              familyProfile: validatedParams.familyProfile,
              duration: validatedParams.duration,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ שגיאה בהמלצות ציוד:", error)
          // Return mock recommendations as fallback
          const isWithChildren = validatedParams.familyProfile.includes("ילד")
          const isWithBaby = validatedParams.familyProfile.includes("תינוק")

          const baseRecommendations = {
            "💧 מזון ומים": ["מים - 3 ליטר לאדם ליום", "מזון משומר לשלושה ימים", "פותחן קופסאות", "חטיפי אנרגיה"],
            "🏥 ציוד רפואי": ["תרופות אישיות", "חבישות סטריליות", "משכך כאבים", "מדחום", "אלכוהול לחיטוי"],
            "🔦 ציוד כללי": ["פנס עם סוללות", "רדיו נייד", "סוללות נוספות", "שמיכות", "בגדים חמים", "מטען נייד לטלפון"],
          }

          if (isWithChildren) {
            baseRecommendations["👶 ציוד לילדים"] = [
              "מזון מיוחד לילדים",
              "משחקים קטנים ושקטים",
              "בגדים נוספים לילדים",
              "תרופות לילדים",
            ]
          }

          if (isWithBaby) {
            baseRecommendations["🍼 ציוד לתינוקות"] = ["חיתולים", "מזון לתינוקות", "בקבוקים", "מוצצים", "שמיכת תינוק"]
          }

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "equipment_recommendations",
              recommendations: baseRecommendations,
              familyProfile: validatedParams.familyProfile,
              duration: validatedParams.duration,
              usedFallback: true,
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
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        toolId: request.body?.toolId || "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
