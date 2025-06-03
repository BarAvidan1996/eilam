"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { favoriteShelterService } from "@/lib/services/favorite-shelter-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"

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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isTranslating && <Loader2 className="inline mr-2 h-6 w-6 animate-spin" />}
          <T>Find Shelters</T>
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          <T>Search for nearby shelters and safe locations in your area</T>
        </p>
      </div>

      {/* Add your shelters content here */}
      <div className="text-center py-16">
        <p className="text-lg text-gray-500">
          <T>Shelters functionality will be implemented here</T>
        </p>
      </div>
    </div>
  )
}
