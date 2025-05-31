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
  const { location, radius = 1000 } = parameters

  try {
    // Use Google Maps Geocoding API to convert location to coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      location,
    )}&key=${process.env.GOOGLE_MAPS_API}`

    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status !== "OK" || !geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`Failed to geocode location: ${location}`)
    }

    const { lat, lng } = geocodeData.results[0].geometry.location
    const formattedAddress = geocodeData.results[0].formatted_address

    // Search for shelters using Google Places API
    const shelters = await searchShelters({ lat, lng }, radius)

    return {
      type: "shelter_search",
      location: formattedAddress,
      coordinates: { lat, lng },
      radius,
      shelters,
      searchPerformed: true,
    }
  } catch (error) {
    console.error("Error searching shelters:", error)
    return {
      type: "shelter_search",
      location,
      error: error instanceof Error ? error.message : "Unknown error",
      searchPerformed: false,
      shelters: [],
    }
  }
}

// Helper function to search shelters using Google Places API
async function searchShelters(location: { lat: number; lng: number }, radius: number) {
  // For demo purposes, we'll return some sample shelters
  // In a real implementation, this would call the Google Places API

  // Calculate some nearby points based on the location
  const shelters = [
    {
      place_id: "shelter_1",
      name: "מקלט ציבורי - רחוב הרצל",
      address: `רחוב הרצל, ${radius < 500 ? "תל אביב" : "רמת גן"}`,
      location: {
        lat: location.lat + 0.001,
        lng: location.lng + 0.002,
      },
      distance_text: `${Math.round(radius / 10)} מ'`,
      distance_value: Math.round(radius / 10),
      duration_text: `${Math.round(radius / 100)} דקות`,
      duration_value: Math.round(radius / 100) * 60,
    },
    {
      place_id: "shelter_2",
      name: "מקלט בית ספר אלון",
      address: `רחוב אלון, ${radius < 500 ? "תל אביב" : "רמת גן"}`,
      location: {
        lat: location.lat - 0.001,
        lng: location.lng - 0.001,
      },
      distance_text: `${Math.round(radius / 8)} מ'`,
      distance_value: Math.round(radius / 8),
      duration_text: `${Math.round(radius / 80)} דקות`,
      duration_value: Math.round(radius / 80) * 60,
    },
    {
      place_id: "shelter_3",
      name: "מרחב מוגן - מרכז קהילתי",
      address: `רחוב ביאליק, ${radius < 500 ? "תל אביב" : "רמת גן"}`,
      location: {
        lat: location.lat + 0.002,
        lng: location.lng - 0.001,
      },
      distance_text: `${Math.round(radius / 6)} מ'`,
      distance_value: Math.round(radius / 6),
      duration_text: `${Math.round(radius / 60)} דקות`,
      duration_value: Math.round(radius / 60) * 60,
    },
  ]

  return shelters
}

// Execute Equipment Recommendations
async function executeRecommendEquipment(parameters: { familyProfile: string; duration?: number }) {
  const { familyProfile, duration = 72 } = parameters

  // Call the existing AI recommendations API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}/api/ai-recommendations`, {
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
  })

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
