import { type NextRequest, NextResponse } from "next/server"
import { shelterSearchService } from "@/lib/services/shelter-search-service"

export async function POST(request: NextRequest) {
  try {
    const { location, radius, maxResults } = await request.json()

    // Validate input
    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return NextResponse.json({ error: "Valid location (lat, lng) is required" }, { status: 400 })
    }

    if (!radius || typeof radius !== "number" || radius <= 0) {
      return NextResponse.json({ error: "Valid radius (in meters) is required" }, { status: 400 })
    }

    console.log(`🔍 API: חיפוש מקלטים ב-${location.lat},${location.lng} ברדיוס ${radius}m`)

    // Search for shelters
    const shelters = await shelterSearchService.searchShelters({
      location,
      radius,
      maxResults: maxResults || 10,
    })

    // Optionally calculate walking durations for closest shelters
    const sheltersWithDuration = await Promise.all(
      shelters.slice(0, 3).map(async (shelter) => {
        try {
          const duration = await shelterSearchService.getWalkingDuration(location, shelter.location)
          return {
            ...shelter,
            duration: duration ? Math.round(duration / 60) : null, // Convert to minutes
          }
        } catch (error) {
          console.error("שגיאה בחישוב זמן הליכה:", error)
          return shelter
        }
      }),
    )

    // Add remaining shelters without duration calculation
    const allShelters = [...sheltersWithDuration, ...shelters.slice(3)]

    console.log(`✅ API: החזרת ${allShelters.length} מקלטים`)

    return NextResponse.json({
      success: true,
      shelters: allShelters,
      searchLocation: location,
      searchRadius: radius,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ שגיאה בחיפוש מקלטים:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        shelters: [],
      },
      { status: 500 },
    )
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const lat = Number.parseFloat(url.searchParams.get("lat") || "32.0853")
  const lng = Number.parseFloat(url.searchParams.get("lng") || "34.7818")
  const radius = Number.parseInt(url.searchParams.get("radius") || "2000")

  return POST(
    new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { lat, lng },
        radius,
        maxResults: 10,
      }),
    }) as NextRequest,
  )
}
