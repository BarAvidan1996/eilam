"use client"

import { useRef } from "react"
import { useState, useEffect, useCallback } from "react"
import { AlertCircle, Search, Navigation, Filter } from "lucide-react"
import ShelterMap from "@/components/map/shelter-map"
import ShelterList from "@/components/shelters/shelter-list"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Adding translations object
const translations = {
  he: {
    pageTitle: "איתור מקלטים",
    pageDescription: "מצא מקלטים קרובים אליך לפי כתובת או מיקום נוכחי.",
    searchInputPlaceholder: "חפש לפי כתובת או שם מקום...",
    useMyLocation: "השתמש במיקומי",
    currentLocation: "מיקום נוכחי",
    filterButton: "סינון",
    searchButton: "חפש",
    filterTitle: "סינון תוצאות",
    searchRadius: "רדיוס חיפוש",
    meters: "מטר",
    maxDuration: "זמן הגעה מקסימלי",
    minutes: "דקות",
    applyFilter: "החל סינון",
    loading: "טוען...",
    loadingMap: "טוען מפה...",
    foundShelters: "מקלטים נמצאו",
    noMatchingResults: "אין מקלטים מתאימים לסינון",
    noSearchYet: "לא התבצע חיפוש עדיין",
    enterAddressPrompt: "הזן כתובת או השתמש במיקום הנוכחי שלך כדי למצוא מקלטים באזור",
    findNearMe: "מצא מקלטים ליד המיקום שלי",
    sortBy: "מיין לפי",
    distance: "מרחק",
    duration: "זמן הגעה",
    navigateToShelter: "נווט למקלט",
    errorMessages: {
      locationNotSupported: "הדפדפן שלך לא תומך באיתור מיקום",
      locationFailed: "לא ניתן לאתר את מיקומך הנוכחי",
      noSheltersFound: "לא נמצאו מקלטים באזור זה. נסה להגדיל את רדיוס החיפוש.",
      noMatchingFilters: "לא נמצאו מקלטים העונים על הגדרות הסינון. נסה לשנות את רדיוס החיפוש או זמן ההגעה המקסימלי.",
      mapsError: "שירותי המפה אינם זמינים כרגע. נסה לרענן את הדף.",
    },
  },
  en: {
    pageTitle: "Find Shelters",
    pageDescription: "Find nearby shelters by address or current location.",
    searchInputPlaceholder: "Search by address or place name...",
    useMyLocation: "Use My Location",
    currentLocation: "Current Location",
    filterButton: "Filter",
    searchButton: "Search",
    filterTitle: "Filter Results",
    searchRadius: "Search Radius",
    meters: "meters",
    maxDuration: "Maximum Walking Time",
    minutes: "minutes",
    applyFilter: "Apply Filter",
    loading: "Loading...",
    loadingMap: "Loading map...",
    foundShelters: "shelters found",
    noMatchingResults: "No shelters match the current filters",
    noSearchYet: "No search performed yet",
    enterAddressPrompt: "Enter an address or use your current location to find nearby shelters",
    findNearMe: "Find Shelters Near Me",
    sortBy: "Sort by",
    distance: "Distance",
    duration: "Duration",
    navigateToShelter: "Navigate to Shelter",
    errorMessages: {
      locationNotSupported: "Your browser doesn't support location services",
      locationFailed: "Unable to determine your current location",
      noSheltersFound: "No shelters found in this area. Try increasing the search radius.",
      noMatchingFilters:
        "No shelters match the current filter settings. Try adjusting the search radius or maximum arrival time.",
      mapsError: "Map services are currently unavailable. Please try refreshing the page.",
    },
  },
}

export default function SheltersPage() {
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [t, setT] = useState(translations.he)
  const [isLoading, setIsLoading] = useState(false)
  const [shelters, setShelters] = useState([])
  const [allFetchedShelters, setAllFetchedShelters] = useState([])
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 32.0853, lng: 34.7818 })
  const [originLocation, setOriginLocation] = useState(null)
  const [searchRadius, setSearchRadius] = useState(1000)
  const [maxDurationFilter, setMaxDurationFilter] = useState(60)
  const [error, setError] = useState(null)
  const [mapServices, setMapServices] = useState(null)
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [searchInput, setSearchInput] = useState("")
  const [currentLocation, setCurrentLocation] = useState(null)
  const [sortBy, setSortBy] = useState("distance")
  const [autocomplete, setAutocomplete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState([])
  const [updatingFavorite, setUpdatingFavorite] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const resultsContainerRef = useRef(null)
  const searchInputRef = useRef(null)
  const supabase = createClientComponentClient()

  const SHELTERS_PER_PAGE = 8

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setIsRTL(docLang === "he" || docLang === "ar")
    setT(translations[docLang] || translations.he)
  }, [])

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Load favorites
  useEffect(() => {
    setFavorites([])
  }, [])

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
    async (address, radius) => {
      setIsLoading(true)
      setError(null)
      setShelters([])
      setSearchRadius(radius)
      setHasSearched(true)

      try {
        let searchLocation

        if (address && mapServices?.geocoder) {
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

        const foundShelters = await searchShelters(searchLocation, radius)
        setShelters(foundShelters)
        setAllFetchedShelters(foundShelters)

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
    [mapServices, searchShelters, t],
  )

  const handleLocationSearch = useCallback(
    async (location, radius) => {
      setIsLoading(true)
      setError(null)
      setShelters([])
      setSearchRadius(radius)
      setMapCenter(location)
      setOriginLocation(location)
      setHasSearched(true)

      try {
        const foundShelters = await searchShelters(location, radius)
        setShelters(foundShelters)
        setAllFetchedShelters(foundShelters)

        if (foundShelters.length === 0) {
          setError(t.errorMessages.noSheltersFound)
        }
      } catch (error) {
        console.error("Error searching shelters by location:", error)
        setError(error.message || "אירעה שגיאה בחיפוש. נסה שוב מאוחר יותר.")
      } finally {
        setIsLoading(false)
      }
    },
    [searchShelters, t],
  )

  const handleUseMyLocation = () => {
    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }
        handleLocationSearch(location, searchRadius)
      },
      (error) => {
        console.error("שגיאה באיתור מיקום:", error)
        setIsLoading(false)
        setError("לא ניתן לאתר את המיקום הנוכחי. אנא ודא שהדפדפן מאפשר גישה למיקום.")
      },
    )
  }

  const handleShelterSelect = (shelter) => {
    setSelectedShelter(shelter)
    setMapCenter(shelter.location)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      handleSearch(searchInput.trim(), searchRadius)
    }
  }

  // Update autocomplete after Google Maps loads
  useEffect(() => {
    if (window?.google && searchInputRef.current && !autocomplete) {
      const autoComplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: "il" },
        fields: ["formatted_address", "geometry"],
      })

      autoComplete.addListener("place_changed", () => {
        const place = autoComplete.getPlace()
        if (place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
          setMapCenter(location)
          setOriginLocation(location)
          handleSearch(place.formatted_address, searchRadius)
        }
      })

      setAutocomplete(autoComplete)
    }
  }, [googleMapsLoaded, searchInputRef, autocomplete, handleSearch, searchRadius])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t.pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-300">{t.pageDescription}</p>
      </header>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center" dir="rtl">
          <Button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="bg-[#005C72] hover:bg-[#004A5E] dark:bg-[#D3E3FD] dark:hover:bg-[#B4CEF9] text-white dark:text-black px-6 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Search className="w-5 h-5" />
            {t.searchButton}
          </Button>

          <Button
            variant="outline"
            className="border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Filter className="w-5 h-5" />
            {t.filterButton}
          </Button>

          <Button
            onClick={handleUseMyLocation}
            disabled={isLoading}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Navigation className="w-5 h-5" />
            {t.useMyLocation}
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t.searchInputPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-right"
              dir="rtl"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </form>
      </div>

      {/* Map Section */}
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="h-[400px]">
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
            height="400px"
          />
        </div>

        {/* Map Status */}
        {!hasSearched && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.noSearchYet}</p>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State or Results */}
      {!hasSearched ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#005C72] dark:bg-[#D3E3FD] rounded-full flex items-center justify-center mb-6">
              <Navigation className="w-8 h-8 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t.noSearchYet}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{t.enterAddressPrompt}</p>
            <Button
              onClick={handleUseMyLocation}
              disabled={isLoading}
              className="bg-[#005C72] hover:bg-[#004A5E] dark:bg-[#D3E3FD] dark:hover:bg-[#B4CEF9] text-white dark:text-black px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {t.findNearMe}
            </Button>
          </div>
        </div>
      ) : (
        <ShelterList shelters={shelters} isLoading={isLoading} onShelterSelect={handleShelterSelect} />
      )}
    </div>
  )
}
