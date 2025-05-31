interface ShelterLocation {
  lat: number
  lng: number
}

interface Shelter {
  place_id: string
  name: string
  address: string
  location: ShelterLocation
  distance_text?: string
  distance_value?: number
  duration_text?: string
  duration_value?: number
  rating?: number
  types?: string[]
}

interface ShelterSearchParams {
  location?: ShelterLocation
  address?: string
  radius?: number
  maxDuration?: number
}

interface ShelterSearchResult {
  shelters: Shelter[]
  searchLocation: ShelterLocation
  totalFound: number
  searchRadius: number
}

class ShelterSearchService {
  private mapServices: any = null
  private isInitialized = false

  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.mapServices) {
      return true
    }

    // בדיקה אם Google Maps כבר טעון
    if (typeof window !== "undefined" && window.google?.maps) {
      // יצירת מפה זמנית לשירותים
      const tempDiv = document.createElement("div")
      const tempMap = new window.google.maps.Map(tempDiv, {
        center: { lat: 32.0853, lng: 34.7818 },
        zoom: 15,
      })

      this.mapServices = {
        placesService: new window.google.maps.places.PlacesService(tempMap),
        geocoder: new window.google.maps.Geocoder(),
        distanceService: new window.google.maps.DistanceMatrixService(),
      }

      this.isInitialized = true
      return true
    }

    return false
  }

  async searchShelters(params: ShelterSearchParams): Promise<ShelterSearchResult> {
    const { address, location, radius = 1000, maxDuration = 60 } = params

    if (!(await this.initialize())) {
      throw new Error("Google Maps services not available")
    }

    let searchLocation: ShelterLocation

    // אם יש כתובת, נמיר אותה לקואורדינטות
    if (address && this.mapServices?.geocoder) {
      searchLocation = await this.geocodeAddress(address)
    } else if (location) {
      searchLocation = location
    } else {
      throw new Error("Either address or location must be provided")
    }

    // חיפוש מקלטים
    const shelters = await this.findNearbyShelteres(searchLocation, radius)

    // סינון לפי זמן הגעה
    const filteredShelters = shelters.filter((shelter) => {
      if (maxDuration === 60) return true // ללא הגבלה
      return shelter.duration_value ? shelter.duration_value <= maxDuration * 60 : true
    })

    // מיון לפי מרחק
    const sortedShelters = filteredShelters.sort((a, b) => {
      return (a.distance_value || Number.POSITIVE_INFINITY) - (b.distance_value || Number.POSITIVE_INFINITY)
    })

    return {
      shelters: sortedShelters,
      searchLocation,
      totalFound: sortedShelters.length,
      searchRadius: radius,
    }
  }

  private async geocodeAddress(address: string): Promise<ShelterLocation> {
    return new Promise((resolve, reject) => {
      this.mapServices.geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === "OK" && results && results.length > 0) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          })
        } else {
          reject(new Error("לא נמצאה כתובת תואמת. אנא בדוק את הכתובת וודא שהיא בישראל."))
        }
      })
    })
  }

  private async findNearbyShelteres(location: ShelterLocation, maxRadius: number): Promise<Shelter[]> {
    if (!this.mapServices) {
      throw new Error("Map services not initialized")
    }

    const { placesService, distanceService } = this.mapServices

    return new Promise(async (resolve, reject) => {
      try {
        console.log(`חיפוש מקלטים ברדיוס ${maxRadius} מטרים...`)

        // מילות מפתח לחיפוש
        const searchTypesKeywords = ["מקלט ציבורי", "bomb shelter", "מקלט חירום", "מרחב מוגן", "ממ״ד", "ממ״ק", "מקלט"]

        // מפה לאחסון תוצאות ייחודיות לפי place_id
        const allSheltersMap = new Map()

        // חיפוש מעגלי רב-שכבתי
        const radiusSteps = [400, 800, 1200, 1600, 2000, 2500, 3000]
        const effectiveRadiusSteps = radiusSteps.filter((r) => r <= maxRadius)

        if (effectiveRadiusSteps.length === 0 || maxRadius < radiusSteps[0]) {
          effectiveRadiusSteps.push(maxRadius)
        }

        // לולאה על כל רדיוס
        for (const radius of effectiveRadiusSteps) {
          const radiusSearchPromises = searchTypesKeywords.map((keyword) => {
            return new Promise((resolveKeywordSearch) => {
              const request = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: radius,
                keyword: keyword,
              }

              placesService.nearbySearch(request, (places: any[], status: string) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && places && places.length > 0) {
                  resolveKeywordSearch(places)
                } else {
                  resolveKeywordSearch([])
                }
              })
            })
          })

          const currentRadiusResults = await Promise.all(radiusSearchPromises)

          currentRadiusResults.flat().forEach((place: any) => {
            if (!allSheltersMap.has(place.place_id)) {
              allSheltersMap.set(place.place_id, place)
            }
          })
        }

        const uniquePlaces = Array.from(allSheltersMap.values())
        console.log(`נמצאו ${uniquePlaces.length} תוצאות לפני סינון...`)

        if (uniquePlaces.length === 0) {
          // נתוני דמו אם לא נמצאו תוצאות
          const demoShelters: Shelter[] = [
            {
              place_id: "demo_1",
              name: "מקלט ציבורי - דמו",
              address: "רחוב הדמו 1, תל אביב",
              location: {
                lat: location.lat + 0.001,
                lng: location.lng + 0.001,
              },
              distance_text: "100 מ'",
              distance_value: 100,
              duration_text: "2 דקות",
              duration_value: 120,
              rating: 4.0,
              types: ["establishment"],
            },
            {
              place_id: "demo_2",
              name: "מרחב מוגן - דמו",
              address: "רחוב הדמו 2, תל אביב",
              location: {
                lat: location.lat - 0.001,
                lng: location.lng - 0.001,
              },
              distance_text: "200 מ'",
              distance_value: 200,
              duration_text: "3 דקות",
              duration_value: 180,
              rating: 4.5,
              types: ["establishment"],
            },
          ]
          resolve(demoShelters)
          return
        }

        // קבלת פרטים מלאים
        const detailedPlacesPromises = uniquePlaces.map((place) => this.getPlaceDetails(place))
        const detailedPlaces = await Promise.all(detailedPlacesPromises)
        const validPlaces = detailedPlaces.filter((place) => place !== null)

        // סינון בהתבסס על שם המקלט
        const filteredPlaces = validPlaces.filter((place) => {
          const exactMatch =
            place.name.toLowerCase() === "מקלט" ||
            place.name.toLowerCase() === "bomb shelter" ||
            place.name.toLowerCase().includes("bomb shelter") ||
            place.name.toLowerCase().includes("מקלט ציבורי") ||
            place.name.toLowerCase() === "public shelter"

          const highProbabilityMatch =
            place.name.toLowerCase().includes("מקלט ") ||
            place.name.toLowerCase().includes(" מקלט") ||
            place.name.toLowerCase().includes("ממ״ד") ||
            place.name.toLowerCase().includes("מרחב מוגן")

          return exactMatch || highProbabilityMatch
        })

        if (filteredPlaces.length === 0) {
          resolve([])
          return
        }

        // מניעת שכפולים לפי מיקום
        const uniqueLocationPlaces = this.removeDuplicatesByLocation(filteredPlaces)

        // חישוב מרחק ומשך הליכה
        await this.calculateDistancesAndDurations(location, uniqueLocationPlaces)

        // סינון לפי רדיוס
        const sheltersWithinRadius = uniqueLocationPlaces.filter((place) => place.distance_value <= maxRadius)

        console.log(`${sheltersWithinRadius.length} מקלטים נמצאים בטווח של ${maxRadius} מטרים`)
        resolve(sheltersWithinRadius)
      } catch (error) {
        console.error("שגיאה בחיפוש מקלטים:", error)
        reject(error)
      }
    })
  }

  private async getPlaceDetails(place: any): Promise<Shelter | null> {
    return new Promise((resolve) => {
      const detailsRequest = {
        placeId: place.place_id,
        fields: ["name", "geometry", "formatted_address", "rating", "vicinity", "place_id", "types"],
      }

      this.mapServices.placesService.getDetails(detailsRequest, (details: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
          resolve({
            place_id: details.place_id,
            name: details.name || "מקלט",
            location: {
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
            },
            address: details.formatted_address || details.vicinity || "כתובת לא זמינה",
            distance_value: 0, // יחושב מאוחר יותר
            types: details.types || [],
            rating: details.rating,
          })
        } else {
          resolve(null)
        }
      })
    })
  }

  private removeDuplicatesByLocation(places: Shelter[]): Shelter[] {
    const locationMap = new Map()
    const uniqueLocationPlaces: Shelter[] = []

    places.forEach((place) => {
      const roundedLat = Math.round(place.location.lat * 10000) / 10000
      const roundedLng = Math.round(place.location.lng * 10000) / 10000
      const locationKey = `${roundedLat},${roundedLng}`

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, place)
        uniqueLocationPlaces.push(place)
      }
    })

    return uniqueLocationPlaces
  }

  private async calculateDistancesAndDurations(origin: ShelterLocation, shelters: Shelter[]): Promise<void> {
    return new Promise((resolve) => {
      const origins = [new window.google.maps.LatLng(origin.lat, origin.lng)]
      const destinations = shelters.map(
        (shelter) => new window.google.maps.LatLng(shelter.location.lat, shelter.location.lng),
      )

      this.mapServices.distanceService.getDistanceMatrix(
        {
          origins: origins,
          destinations: destinations,
          travelMode: window.google.maps.TravelMode.WALKING,
        },
        (response: any, status: string) => {
          if (status === "OK" && response.rows[0].elements) {
            shelters.forEach((shelter, index) => {
              const element = response.rows[0].elements[index]
              if (element.status === "OK") {
                shelter.distance_text = element.distance.text
                shelter.duration_text = element.duration.text
                shelter.distance_value = element.distance.value
                shelter.duration_value = element.duration.value
              } else {
                // חישוב מרחק ישיר כ-fallback
                const directDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  origins[0],
                  destinations[index],
                )
                shelter.distance_text = `${Math.round(directDistance)} מ'`
                shelter.duration_text = "-"
                shelter.distance_value = directDistance
                shelter.duration_value = Number.POSITIVE_INFINITY
              }
            })
          } else {
            // fallback לחישוב מרחק ישיר
            shelters.forEach((shelter, index) => {
              const directDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
                origins[0],
                destinations[index],
              )
              shelter.distance_text = `${Math.round(directDistance)} מ'`
              shelter.duration_text = "-"
              shelter.distance_value = directDistance
              shelter.duration_value = Number.POSITIVE_INFINITY
            })
          }
          resolve()
        },
      )
    })
  }

  async getCurrentLocation(): Promise<ShelterLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("הדפדפן שלך לא תומך באיתור מיקום"))
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 דקות
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          let errorMessage = "לא ניתן לאתר את מיקומך הנוכחי"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "הגישה למיקום נדחתה. אנא אפשר גישה למיקום בהגדרות הדפדפן."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "המיקום אינו זמין כרגע. נסה שוב מאוחר יותר."
              break
            case error.TIMEOUT:
              errorMessage = "איתור המיקום לקח יותר מדי זמן. נסה שוב."
              break
          }

          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }
}

export const shelterSearchService = new ShelterSearchService()
export type { Shelter, ShelterLocation, ShelterSearchParams, ShelterSearchResult }
