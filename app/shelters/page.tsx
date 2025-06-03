"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import ShelterMap from "@/components/map/shelter-map"
import { Search, Navigation, Filter, Clock, X, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { favoriteShelterService } from "@/lib/services/favorite-shelter-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useTranslation } from "@/hooks/use-translation"

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
    recentSearches: "חיפושים אחרונים",
    errorMessages: {
      locationNotSupported: "הדפדפן שלך לא תומך באיתור מיקום",
      locationFailed: "לא ניתן לאתר את מיקומך הנוכחי",
      noSheltersFound: "לא נמצאו מקלטים באזור זה. נסה להגדיל את רדיוס החיפוש.",
      noMatchingFilters: "לא נמצאו מקלטים העונים על הגדרות הסינון. נסה לשנות את רדיוס החיפוש או זמן ההגעה המקסימלי.",
      mapsError: "שירותי המפה אינם זמינים כרגע. נסה לרענן את הדף.",
      apiKeyMissing: "מפתח Google Maps API חסר. אנא פנה למנהל המערכת.",
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
    recentSearches: "Recent Searches",
    errorMessages: {
      locationNotSupported: "Your browser doesn't support location services",
      locationFailed: "Unable to determine your current location",
      noSheltersFound: "No shelters found in this area. Try increasing the search radius.",
      noMatchingFilters:
        "No shelters match the current filter settings. Try adjusting the search radius or maximum arrival time.",
      mapsError: "Map services are currently unavailable. Please try refreshing the page.",
      apiKeyMissing: "Google Maps API key is missing. Please contact system administrator.",
    },
  },
}

export default function SheltersPage() {
  const { ts, isTranslating } = useTranslation()
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [t, setT] = useState(translations.he)

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setIsRTL(docLang === "he" || docLang === "ar")
    setT(translations[docLang as keyof typeof translations] || translations.he)
  }, [])

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
  const searchInputRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState([])
  const [updatingFavorite, setUpdatingFavorite] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const resultsContainerRef = useRef(null)
  const supabase = createClientComponentClient()

  const SHELTERS_PER_PAGE = 8

  // בדיקת תצוגת מובייל
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

  // טעינת חיפושים אחרונים
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const favs = await favoriteShelterService.list()
      setFavorites(favs.map((fav) => fav.place_id))
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }

  const toggleFavorite = async (shelter: any, event: React.MouseEvent) => {
    event.stopPropagation()
    setUpdatingFavorite(shelter.place_id)

    try {
      const isFavorite = favorites.includes(shelter.place_id)

      if (isFavorite) {
        await favoriteShelterService.deleteByPlaceId(shelter.place_id)
      } else {
        await favoriteShelterService.create({
          place_id: shelter.place_id,
          name: shelter.name,
          address: shelter.address,
          location: {
            lat: shelter.location.lat,
            lng: shelter.location.lng,
          },
          label: "בית", // ברירת מחדל
        })
      }

      setFavorites((prev) => (isFavorite ? prev.filter((id) => id !== shelter.place_id) : [...prev, shelter.place_id]))
    } catch (error) {
      console.error("Error updating favorites:", error)
    }

    setUpdatingFavorite(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 justify-start mb-2">
          <Search className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {ts(t.pageTitle)}
            {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-right">{ts(t.pageDescription)}</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 py-4 rounded-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // handleSearch(searchInput, searchRadius)
          }}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
        >
          <div className="flex-1 relative order-1">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={ts(t.searchInputPlaceholder)}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-4 pl-4 py-3 text-right"
              dir="rtl"
            />
          </div>

          <div className="flex gap-2 order-2 sm:order-2">
            <Button
              type="button"
              // onClick={handleLocationSearch}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-3 flex-1 sm:flex-none"
              variant="outline"
            >
              <Navigation className="w-4 h-4 sm:ml-2" />
              <span className="hidden sm:inline ml-2">{ts(t.useMyLocation)}</span>
              <span className="sm:hidden">מיקום</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 px-3 sm:px-4"
                >
                  <Filter size={18} />
                  <span className="sm:hidden">סינון</span>
                  <span className="hidden sm:inline">{ts(t.filterButton)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent position={isRTL ? "right" : "left"} size="sm" className="p-0 dark:bg-gray-800">
                <SheetHeader className="p-6 border-b dark:border-gray-700">
                  <SheetTitle className="dark:text-white">{ts(t.filterTitle)}</SheetTitle>
                </SheetHeader>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium dark:text-gray-300">
                        {ts(t.searchRadius)}: {searchRadius} {ts(t.meters)}
                      </label>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="3000"
                      step="100"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#005C72]"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>100 {ts(t.meters)}</span>
                      <span>1500 {ts(t.meters)}</span>
                      <span>3000 {ts(t.meters)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium dark:text-gray-300">
                        {ts(t.maxDuration)}: {maxDurationFilter} {ts(t.minutes)}
                      </label>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={maxDurationFilter}
                      onChange={(e) => setMaxDurationFilter(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#005C72]"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>1 {ts(t.minutes)}</span>
                      <span>30 {ts(t.minutes)}</span>
                      <span>60 {ts(t.minutes)}</span>
                    </div>
                  </div>

                  <Button
                    // onClick={() => handleSearch(searchInput, searchRadius)}
                    className="w-full bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white"
                  >
                    {ts(t.applyFilter)}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-3 sm:px-4 py-3"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Clock size={16} />
              <span>{ts(t.recentSearches)}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <button
                    onClick={() => {
                      // handleRecentSearch(search)
                    }}
                    className="flex-1"
                  >
                    {search}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // removeRecentSearch(search)
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentLocation && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="secondary" className="gap-1 dark:bg-gray-700 dark:text-gray-300">
              {currentLocation}
              <button
                onClick={() => setCurrentLocation(null)}
                className="ml-1 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <X size={14} />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="mb-8">
        <ShelterMap center={mapCenter} radius={searchRadius} markers={[]} onMapLoad={() => {}} height="650px" />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="large" />
          <p className="ml-3 text-gray-600 dark:text-gray-300">{ts(t.loading)}</p>
        </div>
      )}

      {/* No Search State */}
      {!isLoading && shelters.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-[#D3E3FD]/20 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-[#D3E3FD]" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{ts(t.noSearchYet)}</h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{ts(t.enterAddressPrompt)}</p>

          <Button
            // onClick={handleLocationSearch}
            disabled={isLoading}
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-6 py-3"
          >
            <Navigation className="w-4 h-4 ml-2" />
            {ts(t.findNearMe)}
          </Button>
        </div>
      )}
    </div>
  )
}
