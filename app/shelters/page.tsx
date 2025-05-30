"use client"
import { useState, useEffect, useCallback } from "react"
import { AlertCircle, Search, Navigation, Filter, MapPin } from "lucide-react"
import ShelterMap from "@/components/map/shelter-map"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Adding translations object
const translations = {
  he: {
    pageTitle: "איתור מקלטים",
    pageDescription: "מצא מקלטים קרובים אליך לפי כתובת או מיקום נוכחי.",
    searchPlaceholder: "חפש לפי כתובת או שם מקום",
    useCurrentLocation: "השתמש במיקום נוכחי",
    filter: "סינון",
    noSearchYet: "לא התבצע חיפוש עדיין",
    sheltersFound: "מקלטים נמצאו",
    noSearchMessage: "הזן כתובת או השתמש במיקום הנוכחי שלך כדי למצוא מקלטים באזור",
    findNearMe: "מצא מקלטים ליד המיקום שלי",
    errorMessages: {
      locationNotSupported: "הדפדפן שלך לא תומך באיתור מיקום",
      locationFailed: "לא ניתן לאתר את מיקומך הנוכחי",
      noSheltersFound: "לא נמצאו מקלטים באזור זה. נסה להגדיל את רדיוס החיפוש.",
      mapsError: "שירותי המפה אינם זמינים כרגע. נסה לרענן את הדף.",
    },
  },
  en: {
    pageTitle: "Find Shelters",
    pageDescription: "Find nearby shelters by address or current location.",
    searchPlaceholder: "Search by address or place name",
    useCurrentLocation: "Use Current Location",
    filter: "Filter",
    noSearchYet: "No search performed yet",
    sheltersFound: "shelters found",
    noSearchMessage: "Enter an address or use your current location to find nearby shelters",
    findNearMe: "Find Shelters Near Me",
    errorMessages: {
      locationNotSupported: "Your browser doesn't support location services",
      locationFailed: "Unable to determine your current location",
      noSheltersFound: "No shelters found in this area. Try increasing the search radius.",
      mapsError: "Map services are currently unavailable. Please try refreshing the page.",
    },
  },
}

export default function SheltersPage() {
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [t, setT] = useState(translations.he)

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setIsRTL(docLang === "he" || docLang === "ar")
    setT(translations[docLang] || translations.he)
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [shelters, setShelters] = useState([])
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 32.0853, lng: 34.7818 })
  const [originLocation, setOriginLocation] = useState(null)
  const [searchRadius, setSearchRadius] = useState(1000)
  const [error, setError] = useState(null)
  const [mapServices, setMapServices] = useState(null)
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [searchInput, setSearchInput] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState("distance")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const supabase = createClientComponentClient()

  const handleMapLoad = useCallback((map) => {
    if (!map || !window.google) return

    setGoogleMapsLoaded(true)
    setMapServices({
      placesService: new window.google.maps.places.PlacesService(map),
      geocoder: new window.google.maps.Geocoder(),
      distanceService: new window.google.maps.DistanceMatrixService(),
    })
  }, [])

  const searchShelters = useCallback(
    async (location, radius) => {
      if (!mapServices || !location) {
        setError(t.errorMessages.mapsError)
        return []
      }

      setError(null)

      return new Promise((resolve, reject) => {
        const request = {
          location: location,
          radius: radius,
          keyword: 'מקלט|מרחב מוגן|ממ"ד|ממ"ק',
          type: ["point_of_interest"],
        }

        mapServices.placesService.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const processedResults = results.map((place) => ({
              place_id: place.place_id,
              name: place.name,
              address: place.vicinity,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              rating: place.rating,
              distance: null,
              duration: null,
            }))

            if (processedResults.length > 0) {
              const origins = [location]
              const destinations = processedResults.map((place) => place.location)

              mapServices.distanceService.getDistanceMatrix(
                {
                  origins: origins,
                  destinations: destinations,
                  travelMode: "WALKING",
                  unitSystem: window.google.maps.UnitSystem.METRIC,
                },
                (response, status) => {
                  if (status === "OK") {
                    const distances = response.rows[0].elements

                    processedResults.forEach((place, index) => {
                      if (distances[index].status === "OK") {
                        place.distance = distances[index].distance.text
                        place.distance_value = distances[index].distance.value
                        place.duration = distances[index].duration.text
                        place.duration_value = distances[index].duration.value
                      }
                    })
                  }

                  const sortedResults = processedResults.sort(
                    (a, b) => (a.distance_value || Number.MAX_VALUE) - (b.distance_value || Number.MAX_VALUE),
                  )

                  resolve(sortedResults)
                },
              )
            } else {
              resolve([])
            }
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([])
          } else {
            reject(new Error(`Places API error: ${status}`))
          }
        })
      })
    },
    [mapServices, t],
  )

  const handleSearch = useCallback(
    async (address) => {
      if (!address.trim()) return

      setIsLoading(true)
      setError(null)
      setShelters([])
      setHasSearched(true)

      try {
        let searchLocation

        if (mapServices?.geocoder) {
          const geocodeResult = await new Promise((resolve, reject) => {
            mapServices.geocoder.geocode({ address }, (results, status) => {
              if (status === "OK" && results && results.length > 0) {
                resolve(results[0].geometry.location)
              } else {
                reject(new Error("לא נמצאה כתובת תואמת. אנא בדוק את הכתובת וודא שהיא בישראל."))
              }
            })
          })

          searchLocation = { lat: geocodeResult.lat(), lng: geocodeResult.lng() }
          setMapCenter(searchLocation)
          setOriginLocation(searchLocation)
        } else {
          setIsLoading(false)
          return
        }

        const foundShelters = await searchShelters(searchLocation, searchRadius)
        setShelters(foundShelters)

        if (foundShelters.length === 0) {
          setError(t.errorMessages.noSheltersFound)
        }
      } catch (error) {
        console.error("Error searching shelters:", error)
        setError(error.message || "אירעה שגיאה בחיפוש. נסה שוב מאוחר יותר.")
      } finally {
        setIsLoading(false)
      }
    },
    [mapServices, searchShelters, t, searchRadius],
  )

  const handleLocationSearch = useCallback(async () => {
    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }

        setIsLoading(true)
        setError(null)
        setShelters([])
        setHasSearched(true)
        setMapCenter(location)
        setOriginLocation(location)

        try {
          const foundShelters = await searchShelters(location, searchRadius)
          setShelters(foundShelters)

          if (foundShelters.length === 0) {
            setError(t.errorMessages.noSheltersFound)
          }
        } catch (error) {
          console.error("Error searching shelters by location:", error)
          setError(error.message || "אירעה שגיאה בחיפוש. נסה שוב מאוחר יותר.")
        } finally {
          setIsLoading(false)
        }

        setIsGettingLocation(false)
      },
      (error) => {
        console.error("שגיאה באיתור מיקום:", error)
        setIsGettingLocation(false)
        alert("לא ניתן לאתר את המיקום הנוכחי. אנא ודא שהדפדפן מאפשר גישה למיקום.")
      },
    )
  }, [searchShelters, t, searchRadius])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchInput)
  }

  const handleShelterSelect = (shelter) => {
    setSelectedShelter(shelter)
    setMapCenter(shelter.location)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-right">{t.pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-right">{t.pageDescription}</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-4 pl-4 py-3 text-right"
              dir="rtl"
            />
          </div>

          <Button
            type="button"
            onClick={handleLocationSearch}
            disabled={isLoading || isGettingLocation}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3"
            variant="outline"
          >
            <Navigation className="w-4 h-4 ml-2" />
            {t.useCurrentLocation}
          </Button>

          <Button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3"
            variant="outline"
          >
            <Filter className="w-4 h-4 ml-2" />
            {t.filter}
          </Button>

          <Button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-4 py-3"
          >
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Map */}
      <div className="mb-8">
        <ShelterMap
          center={mapCenter}
          radius={searchRadius}
          markers={[
            ...shelters.map((shelter) => ({
              position: shelter.location,
              title: shelter.name,
              isSelected: selectedShelter?.place_id === shelter.place_id,
              content: `
                <div dir="rtl" style="padding: 8px; min-width: 200px;">
                  <strong>${shelter.name}</strong>
                  <p>${shelter.address}</p>
                  ${shelter.distance ? `<p>מרחק: ${shelter.distance}</p>` : ""}
                  ${shelter.duration ? `<p>זמן הליכה: ${shelter.duration}</p>` : ""}
                </div>
              `,
            })),
          ]}
          onMapLoad={handleMapLoad}
          height="650px"
        />
      </div>

      {/* Status Message and Sort Options - Only when there are search results */}
      {hasSearched && shelters.length > 0 && (
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300">{`נמצאו ${shelters.length} תוצאות`}</p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">מיין לפי:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="distance">מרחק</option>
              <option value="duration">זמן הגעה</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* No Search State */}
      {!hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-[#D3E3FD]/20 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-[#D3E3FD]" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t.noSearchYet}</h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.noSearchMessage}</p>

          <Button
            onClick={handleLocationSearch}
            disabled={isGettingLocation}
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-6 py-3"
          >
            <Navigation className="w-4 h-4 ml-2" />
            {t.findNearMe}
          </Button>
        </div>
      )}

      {/* Shelters List - Only show when there are results */}
      {hasSearched && shelters.length > 0 && (
        <div className="grid gap-4">
          {shelters.map((shelter) => (
            <div
              key={shelter.place_id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => handleShelterSelect(shelter)}
            >
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{shelter.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{shelter.address}</p>
              {shelter.distance && (
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>מרחק: {shelter.distance}</span>
                  {shelter.duration && <span>זמן הליכה: {shelter.duration}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
