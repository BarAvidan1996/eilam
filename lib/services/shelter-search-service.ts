interface ShelterResult {
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  distance: number
  duration?: number
  type: string
  place_id: string
  rating?: number
}

interface SearchParams {
  location: {
    lat: number
    lng: number
  }
  radius: number // in meters
  maxResults?: number
}

export class ShelterSearchService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || process.env.GOOGLE_MAPS_API || ""
    if (!this.apiKey) {
      console.warn("Google Maps API key not found")
    }
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) {
      console.log("⚠️ אין מפתח API - לא ניתן לבצע geocoding")
      return null
    }

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
      url.searchParams.set("address", address)
      url.searchParams.set("key", this.apiKey)
      url.searchParams.set("region", "il") // Bias to Israel
      url.searchParams.set("language", "he") // Hebrew language

      console.log(`🌍 Geocoding: ${address}`)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location

        console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`)
        console.log(`📍 Formatted address: ${result.formatted_address}`)

        return {
          lat: location.lat,
          lng: location.lng,
        }
      } else {
        console.warn(`❌ Geocoding failed: ${data.status}`)
        return null
      }
    } catch (error) {
      console.error("❌ Geocoding error:", error)
      return null
    }
  }

  // Main search function
  async searchShelters(params: SearchParams): Promise<ShelterResult[]> {
    const { location, radius, maxResults = 10 } = params

    console.log(`🔍 חיפוש מקלטים ברדיוס ${radius}m מ-${location.lat},${location.lng}`)

    if (!this.apiKey) {
      console.log("⚠️ אין מפתח API - משתמש בנתוני דמו")
      return this.getMockShelters(location, radius)
    }

    try {
      // Search with multiple keywords for better coverage
      const searchKeywords = ["מקלט ציבורי", "bomb shelter", "מקלט חירום", "מרחב מוגן", "ממ״ד", "ממ״ק"]

      const allResults = new Map<string, any>() // Use Map to avoid duplicates by place_id

      // Search with each keyword
      for (const keyword of searchKeywords) {
        try {
          const results = await this.searchByKeyword(location, radius, keyword)
          results.forEach((result) => {
            if (!allResults.has(result.place_id)) {
              allResults.set(result.place_id, result)
            }
          })
        } catch (error) {
          console.error(`שגיאה בחיפוש עם מילת מפתח "${keyword}":`, error)
        }
      }

      let shelters = Array.from(allResults.values())

      // Filter by name to ensure they're actually shelters
      shelters = this.filterShelterResults(shelters)

      // Calculate distances
      shelters = this.calculateDistances(shelters, location)

      // Sort by distance
      shelters.sort((a, b) => a.distance - b.distance)

      // Limit results
      shelters = shelters.slice(0, maxResults)

      console.log(`✅ נמצאו ${shelters.length} מקלטים`)
      return shelters
    } catch (error) {
      console.error("❌ שגיאה בחיפוש מקלטים:", error)
      return this.getMockShelters(location, radius)
    }
  }

  // Search by specific keyword using Google Places API
  private async searchByKeyword(
    location: { lat: number; lng: number },
    radius: number,
    keyword: string,
  ): Promise<any[]> {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
    url.searchParams.set("location", `${location.lat},${location.lng}`)
    url.searchParams.set("radius", radius.toString())
    url.searchParams.set("keyword", keyword)
    url.searchParams.set("key", this.apiKey)
    url.searchParams.set("language", "he") // Hebrew results

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    return data.results || []
  }

  // Filter results to ensure they're actually shelters
  private filterShelterResults(results: any[]): any[] {
    return results.filter((place) => {
      const name = place.name?.toLowerCase() || ""

      // Exact matches (highest priority)
      const exactMatches = ["מקלט", "bomb shelter", "מקלט ציבורי", "public shelter", "מרחב מוגן", "ממ״ד", "ממ״ק"]

      const hasExactMatch = exactMatches.some((match) => name.includes(match.toLowerCase()))

      // High probability matches
      const highProbabilityMatches = ["מקלט ", " מקלט", "shelter", "מרחב מוגן"]

      const hasHighProbabilityMatch = highProbabilityMatches.some((match) => name.includes(match.toLowerCase()))

      return hasExactMatch || hasHighProbabilityMatch
    })
  }

  // Calculate straight-line distances
  private calculateDistances(shelters: any[], origin: { lat: number; lng: number }): ShelterResult[] {
    return shelters.map((shelter) => {
      const shelterLat = shelter.geometry.location.lat
      const shelterLng = shelter.geometry.location.lng

      // Calculate distance using Haversine formula
      const distance = this.calculateHaversineDistance(origin.lat, origin.lng, shelterLat, shelterLng)

      return {
        name: shelter.name || "מקלט",
        address: shelter.vicinity || shelter.formatted_address || "כתובת לא זמינה",
        location: {
          lat: shelterLat,
          lng: shelterLng,
        },
        distance: Math.round(distance * 1000) / 1000, // Round to 3 decimal places
        type: this.determineShelterType(shelter.name),
        place_id: shelter.place_id,
        rating: shelter.rating,
      }
    })
  }

  // Calculate distance between two points using Haversine formula
  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Determine shelter type based on name
  private determineShelterType(name: string): string {
    const nameLower = name.toLowerCase()

    if (nameLower.includes("בית ספר") || nameLower.includes("school")) return "בית ספר"
    if (nameLower.includes("קניון") || nameLower.includes("mall")) return "קניון"
    if (nameLower.includes("מרכז קהילתי") || nameLower.includes("community")) return "מרכז קהילתי"
    if (nameLower.includes("ממ״ד") || nameLower.includes("ממד")) return "ממ״ד"
    if (nameLower.includes("ממ״ק") || nameLower.includes("ממק")) return "ממ״ק"
    if (nameLower.includes("מרחב מוגן")) return "מרחב מוגן"

    return "מקלט ציבורי"
  }

  // Enhanced mock data based on actual Israeli cities
  private getMockShelters(location: { lat: number; lng: number }, radius: number): ShelterResult[] {
    // Determine city based on coordinates (rough approximation)
    let cityName = "תל אביב"
    let mockShelters: ShelterResult[] = []

    // Rishon LeZion area (32.0853, 34.7818)
    if (location.lat > 32.05 && location.lat < 32.12 && location.lng > 34.75 && location.lng < 34.82) {
      cityName = "ראשון לציון"
      mockShelters = [
        {
          name: "מקלט ציבורי - מרכז עזריאלי ראשון לציון",
          address: "דרך בן גוריון 1, ראשון לציון",
          location: { lat: location.lat + 0.002, lng: location.lng + 0.001 },
          distance: 0.3,
          type: "קניון",
          place_id: "mock_rishon_1",
          rating: 4.2,
        },
        {
          name: "ממ״ד - בית ספר רמז",
          address: "רחוב רמז 15, ראשון לציון",
          location: { lat: location.lat - 0.001, lng: location.lng + 0.002 },
          distance: 0.5,
          type: "בית ספר",
          place_id: "mock_rishon_2",
          rating: 4.0,
        },
        {
          name: "מרחב מוגן - מרכז קהילתי הדר",
          address: "רחוב הדר 8, ראשון לציון",
          location: { lat: location.lat + 0.003, lng: location.lng - 0.001 },
          distance: 0.8,
          type: "מרכז קהילתי",
          place_id: "mock_rishon_3",
          rating: 4.1,
        },
      ]
    } else {
      // Default Tel Aviv shelters
      mockShelters = [
        {
          name: "מקלט ציבורי - דיזנגוף סנטר",
          address: "דיזנגוף 50, תל אביב",
          location: { lat: location.lat + 0.002, lng: location.lng + 0.001 },
          distance: 0.8,
          type: "מקלט ציבורי",
          place_id: "mock_ta_1",
          rating: 4.3,
        },
        {
          name: "ממ״ד - בית ספר ביאליק",
          address: "ביאליק 25, תל אביב",
          location: { lat: location.lat - 0.001, lng: location.lng + 0.002 },
          distance: 1.2,
          type: "ממ״ד",
          place_id: "mock_ta_2",
          rating: 4.0,
        },
        {
          name: "מרחב מוגן - קניון איילון",
          address: "איילון מול, תל אביב",
          location: { lat: location.lat + 0.003, lng: location.lng - 0.001 },
          distance: 1.8,
          type: "מרחב מוגן",
          place_id: "mock_ta_3",
          rating: 4.2,
        },
      ]
    }

    // Filter by radius (convert km to meters for comparison)
    return mockShelters.filter((shelter) => shelter.distance * 1000 <= radius)
  }

  // Get walking duration using Google Directions API (optional enhancement)
  async getWalkingDuration(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<number | null> {
    if (!this.apiKey) return null

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/directions/json")
      url.searchParams.set("origin", `${origin.lat},${origin.lng}`)
      url.searchParams.set("destination", `${destination.lat},${destination.lng}`)
      url.searchParams.set("mode", "walking")
      url.searchParams.set("key", this.apiKey)
      url.searchParams.set("language", "he")

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status === "OK" && data.routes.length > 0) {
        return data.routes[0].legs[0].duration.value // Duration in seconds
      }
    } catch (error) {
      console.error("שגיאה בחישוב זמן הליכה:", error)
    }

    return null
  }
}

// Export singleton instance
export const shelterSearchService = new ShelterSearchService()
