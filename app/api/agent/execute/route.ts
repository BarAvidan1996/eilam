import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { shelterSearchService } from "@/lib/services/shelter-search-service"

// Parameters validation schemas for each tool
const ToolParametersSchemas = {
  rag_chat: z.object({
    query: z.string().min(1, "Query is required"),
  }),
  find_shelters: z.object({
    location: z.string().min(1, "Location is required"),
    radius: z.number().optional().default(2000),
    maxResults: z.number().optional().default(10),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  recommend_equipment: z.object({
    familyProfile: z.string().min(1, "Family profile is required"),
    duration: z.number().optional().default(72),
  }),
}

export async function POST(request: NextRequest) {
  let toolId: string | undefined = undefined
  try {
    const { toolId: reqToolId, parameters } = await request.json()
    toolId = reqToolId

    console.log("🔧 === EXECUTE API START ===")
    console.log("🔧 Tool ID:", toolId)
    console.log("🔧 Raw Parameters:", JSON.stringify(parameters, null, 2))

    if (!toolId) {
      console.error("❌ No tool ID provided")
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 })
    }

    // Validate tool ID
    if (!Object.keys(ToolParametersSchemas).includes(toolId)) {
      console.error("❌ Unknown tool ID:", toolId)
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
    console.log("✅ Validated Parameters:", JSON.stringify(validatedParams, null, 2))

    switch (toolId) {
      case "rag_chat": {
        console.log("🔍 === RAG CHAT EXECUTION ===")
        console.log("🔍 Query:", validatedParams.query)

        try {
          console.log("🔍 Calling RAG API...")
          console.log("🔍 Base URL:", process.env.NEXT_PUBLIC_BASE_URL)

          // Call the existing RAG service
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: validatedParams.query }],
            }),
          })

          console.log("🔍 RAG API Response Status:", response.status)
          console.log("🔍 RAG API Response OK:", response.ok)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("❌ RAG API Error Response:", errorText)
            throw new Error(`RAG API error: ${response.status} - ${errorText}`)
          }

          const ragResult = await response.text()
          console.log("✅ RAG Result:", ragResult.substring(0, 200) + "...")

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
          console.error("❌ RAG Error:", error)
          console.log("🔄 Using RAG fallback...")

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
        console.log("🏠 === SHELTER SEARCH EXECUTION ===")
        console.log("🏠 Location:", validatedParams.location)
        console.log("🏠 Radius:", validatedParams.radius)
        console.log("🏠 Has coordinates:", !!validatedParams.lat && !!validatedParams.lng)

        try {
          let searchLocation: { lat: number; lng: number }

          // Check if we already have coordinates
          if (validatedParams.lat && validatedParams.lng) {
            console.log("✅ Using provided coordinates")
            searchLocation = {
              lat: validatedParams.lat,
              lng: validatedParams.lng,
            }
          } else {
            console.log("🌍 Need to geocode address:", validatedParams.location)

            // Geocode the location
            const geocoded = await shelterSearchService.geocodeAddress(validatedParams.location)

            if (!geocoded) {
              console.error("❌ Geocoding failed for:", validatedParams.location)
              throw new Error(`Could not geocode location: ${validatedParams.location}`)
            }

            console.log("✅ Geocoded to:", geocoded)
            searchLocation = geocoded
          }

          console.log("🔍 Searching shelters with params:", {
            location: searchLocation,
            radius: validatedParams.radius,
            maxResults: validatedParams.maxResults,
          })

          // Search for shelters
          const shelters = await shelterSearchService.searchShelters({
            location: searchLocation,
            radius: validatedParams.radius || 2000,
            maxResults: validatedParams.maxResults || 10,
          })

          console.log("✅ Found shelters:", shelters.length)
          console.log(
            "🏠 Shelter details:",
            shelters.map((s) => ({ name: s.name, distance: s.distance })),
          )

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "shelter_search",
              shelters,
              searchLocation: validatedParams.location,
              coordinates: searchLocation,
              radius: validatedParams.radius,
              searchPerformed: true,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ Shelter search error:", error)
          console.log("🔄 Using shelter search fallback...")

          // Return mock data as fallback
          const mockShelters = [
            {
              name: "מקלט ציבורי - מרכז עזריאלי ראשון לציון",
              address: "דרך בן גוריון 1, ראשון לציון",
              distance: "0.8",
              type: "קניון",
              walkingTime: "10 דקות הליכה",
            },
            {
              name: "ממ״ד - בית ספר רמז",
              address: "רחוב רמז 15, ראשון לציון",
              distance: "1.2",
              type: "בית ספר",
              walkingTime: "15 דקות הליכה",
            },
            {
              name: "מרחב מוגן - מרכז קהילתי הדר",
              address: "רחוב הדר 8, ראשון לציון",
              distance: "1.8",
              type: "מרכז קהילתי",
              walkingTime: "22 דקות הליכה",
            },
          ]

          console.log("🔄 Returning mock shelters:", mockShelters.length)

          return NextResponse.json({
            success: true,
            toolId,
            result: {
              type: "shelter_search",
              shelters: mockShelters,
              searchLocation: validatedParams.location,
              radius: validatedParams.radius,
              searchPerformed: true,
              usedFallback: true,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            timestamp: new Date().toISOString(),
          })
        }
      }

      case "recommend_equipment": {
        console.log("🎒 === EQUIPMENT RECOMMENDATION EXECUTION ===")
        console.log("🎒 Family Profile:", validatedParams.familyProfile)
        console.log("🎒 Duration:", validatedParams.duration)

        try {
          console.log("🎒 Calling equipment API...")
          console.log("🎒 Base URL:", process.env.NEXT_PUBLIC_BASE_URL)

          // Call the equipment recommendations API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyProfile: validatedParams.familyProfile,
              duration: validatedParams.duration,
            }),
          })

          console.log("🎒 Equipment API Response Status:", response.status)
          console.log("🎒 Equipment API Response OK:", response.ok)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("❌ Equipment API Error Response:", errorText)
            throw new Error(`Equipment API error: ${response.status} - ${errorText}`)
          }

          const equipmentResult = await response.json()
          console.log("✅ Equipment Result:", JSON.stringify(equipmentResult, null, 2))

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
          console.error("❌ Equipment error:", error)
          console.log("🔄 Using equipment fallback...")

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

          console.log("🔄 Returning mock equipment recommendations")

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
        console.error("❌ Reached default case - this should not happen")
        return NextResponse.json({ error: "Unknown tool ID" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ === EXECUTE API ERROR ===")
    console.error("❌ Error:", error)
    console.error("❌ Stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        toolId: toolId || "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
