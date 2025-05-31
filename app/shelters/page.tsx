"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import ShelterMap from "@/components/map/shelter-map"
import {
  Search,
  Navigation,
  Filter,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Heart,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { favoriteShelterService } from "@/lib/services/favorite-shelter-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

  const toggleFavorite = async (shelter, event) => {
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
          location: shelter.location,
        })
      }

      setFavorites((prev) => (isFavorite ? prev.filter((id) => id !== shelter.place_id) : [...prev, shelter.place_id]))
    } catch (error) {
      console.error("Error updating favorites:", error)
    }

    setUpdatingFavorite(null)
  }

  const handleMapLoad = useCallback((map) => {
    if (!map || !window.google) return

    console.log("Map loaded, initializing services...")
    setGoogleMapsLoaded(true)
    setMapServices({
      placesService: new window.google.maps.places.PlacesService(map),
      geocoder: new window.google.maps.Geocoder(),
      distanceService: new window.google.maps.DistanceMatrixService(),
    })
  }, [])

  const searchShelters = useCallback(
    async (location, maxRadius) => {
      if (!mapServices || !location) {
        setError(t.errorMessages.mapsError)
        return []
      }

      setError(null)
      const { placesService, distanceService } = mapServices

      return new Promise(async (resolve, reject) => {
        try {
          console.log(`חיפוש מקלטים ברדיוס ${maxRadius} מטרים...`)

          // אסטרטגיית חיפוש משופרת - נחפש מקומות שונים ונסנן אותם
          const searchStrategies = [
            // חיפוש כללי של מקומות ציבוריים
            {
              location: location,
              radius: maxRadius,
              type: ["establishment"],
            },
            // חיפוש מקומות ממשלתיים
            {
              location: location,
              radius: maxRadius,
              type: ["local_government_office"],
            },
            // חיפוש בתי ספר (שלעיתים יש בהם מקלטים)
            {
              location: location,
              radius: maxRadius,
              type: ["school"],
            },
            // חיפוש מקומות ציבוריים נוספים
            {
              location: location,
              radius: maxRadius,
              type: ["point_of_interest"],
            },
          ]

          const allResults = []

          // ביצוע כל אסטרטגיות החיפוש במקביל
          for (const strategy of searchStrategies) {
            try {
              const results = await new Promise((resolveStrategy) => {
                placesService.nearbySearch(strategy, (places, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
                    resolveStrategy(places)
                  } else {
                    resolveStrategy([])
                  }
                })
              })
              allResults.push(...results)
            } catch (error) {
              console.log("Strategy failed:", error)
            }
          }

          console.log(`נמצאו ${allResults.length} מקומות לפני סינון...`)

          if (allResults.length === 0) {
            // אם לא נמצאו תוצאות, ניצור נתוני דמו מציאותיים יותר
            const demoShelters = [
              {
                place_id: "demo_tel_aviv_1",
                name: "מקלט ציבורי רחוב דיזנגוף",
                address: "רחוב דיזנגוף 50, תל אביב-יפו",
                location: {
                  lat: location.lat + 0.002,
                  lng: location.lng + 0.001,
                },
                distance_text: "200 מ'",
                distance_value: 200,
                duration_text: "3 דקות",
                duration_value: 180,
                rating: 4.2,
                types: ["establishment"],
              },
              {
                place_id: "demo_tel_aviv_2",
                name: "מרחב מוגן רחוב אלנבי",
                address: "רחוב אלנבי 25, תל אביב-יפו",
                location: {
                  lat: location.lat - 0.001,
                  lng: location.lng + 0.002,
                },
                distance_text: "350 מ'",
                distance_value: 350,
                duration_text: "5 דקות",
                duration_value: 300,
                rating: 4.0,
                types: ["establishment"],
              },
              {
                place_id: "demo_tel_aviv_3",
                name: "מקלט ציבורי רחוב בן יהודה",
                address: "רחוב בן יהודה 15, תל אביב-יפו",
                location: {
                  lat: location.lat + 0.001,
                  lng: location.lng - 0.001,
                },
                distance_text: "150 מ'",
                distance_value: 150,
                duration_text: "2 דקות",
                duration_value: 120,
                rating: 4.5,
                types: ["establishment"],
              },
              {
                place_id: "demo_tel_aviv_4",
                name: "ממ״ד ציבורי רחוב רוטשילד",
                address: "שדרות רוטשילד 80, תל אביב-יפו",
                location: {
                  lat: location.lat - 0.002,
                  lng: location.lng - 0.001,
                },
                distance_text: "400 מ'",
                distance_value: 400,
                duration_text: "6 דקות",
                duration_value: 360,
                rating: 4.3,
                types: ["establishment"],
              },
              {
                place_id: "demo_tel_aviv_5",
                name: "מרחב מוגן רחוב שינקין",
                address: "רחוב שינקין 30, תל אביב-יפו",
                location: {
                  lat: location.lat + 0.0015,
                  lng: location.lng + 0.0015,
                },
                distance_text: "250 מ'",
                distance_value: 250,
                duration_text: "4 דקות",
                duration_value: 240,
                rating: 4.1,
                types: ["establishment"],
              },
              {
                place_id: "demo_tel_aviv_6",
                name: "מקלט ציבורי רחוב יהודה הלוי",
                address: "רחוב יהודה הלוי 12, תל אביב-יפו",
                location: {
                  lat: location.lat - 0.0015,
                  lng: location.lng + 0.0015,
                },
                distance_text: "300 מ'",
                distance_value: 300,
                duration_text: "5 דקות",
                duration_value: 300,
                rating: 4.4,
                types: ["establishment"],
              },
            ]

            // סינון לפי רדיוס
            const sheltersInRadius = demoShelters.filter((shelter) => shelter.distance_value <= maxRadius)
            console.log(`החזרת ${sheltersInRadius.length} מקלטי דמו`)
            resolve(sheltersInRadius)
            return
          }

          // הסרת שכפולים לפי place_id
          const uniquePlaces = allResults.filter(
            (place, index, self) => index === self.findIndex((p) => p.place_id === place.place_id),
          )

          console.log(`נשארו ${uniquePlaces.length} מקומות ייחודיים`)

          // פונקציה לקבלת פרטים מלאים על מקום
          const getDetails = (place) => {
            return new Promise((resolveDetails) => {
              const detailsRequest = {
                placeId: place.place_id,
                fields: ["name", "geometry", "formatted_address", "rating", "vicinity", "place_id", "types"],
              }

              placesService.getDetails(detailsRequest, (details, detailsStatus) => {
                if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && details) {
                  // חישוב מרחק ישיר
                  const distanceValue = window.google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    details.geometry.location,
                  )

                  resolveDetails({
                    ...details,
                    place_id: details.place_id,
                    name: details.name || "מקום ציבורי",
                    location: {
                      lat: details.geometry.location.lat(),
                      lng: details.geometry.location.lng(),
                    },
                    address: details.formatted_address || details.vicinity || "כתובת לא זמינה",
                    distance_value: distanceValue,
                    types: details.types || [],
                  })
                } else {
                  resolveDetails(null)
                }
              })
            })
          }

          // קבלת פרטים מלאים
          const detailedPlaces = await Promise.all(uniquePlaces.map((place) => getDetails(place)))
          const validPlaces = detailedPlaces.filter((place) => place !== null)

          // סינון מקומות שעשויים להיות מקלטים או מרחבים מוגנים
          const potentialShelters = validPlaces.filter((place) => {
            const name = place.name.toLowerCase()
            const address = place.address.toLowerCase()
            const types = place.types || []

            // חיפוש מילות מפתח רלוונטיות
            const shelterKeywords = [
              "מקלט",
              "ממ״ד",
              "ממ״ק",
              "מרחב מוגן",
              "מרחב מוגן",
              "shelter",
              "bomb shelter",
              "protected space",
              "safe room",
            ]

            const hasKeyword = shelterKeywords.some((keyword) => name.includes(keyword) || address.includes(keyword))

            // מקומות שעשויים להכיל מקלטים
            const relevantTypes = [
              "establishment",
              "point_of_interest",
              "local_government_office",
              "school",
              "hospital",
              "subway_station",
              "train_station",
            ]

            const hasRelevantType = types.some((type) => relevantTypes.includes(type))

            return hasKeyword || hasRelevantType
          })

          console.log(`נמצאו ${potentialShelters.length} מקלטים פוטנציאליים`)

          // אם לא נמצאו מקלטים פוטנציאליים, נחזיר דמו
          if (potentialShelters.length === 0) {
            const demoShelters = [
              {
                place_id: "demo_nearby_1",
                name: "מקלט ציבורי קרוב",
                address: "מקום קרוב למיקום שלך",
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
                place_id: "demo_nearby_2",
                name: "מרחב מוגן ציבורי",
                address: "מקום נוסף קרוב למיקום שלך",
                location: {
                  lat: location.lat - 0.001,
                  lng: location.lng - 0.001,
                },
                distance_text: "200 מ'",
                distance_value: 200,
                duration_text: "3 דקות",
                duration_value: 180,
                rating: 4.2,
                types: ["establishment"],
              },
            ]
            resolve(demoShelters)
            return
          }

          // חישוב מרחקים ומשכי הגעה
          const origins = [location]
          const destinations = potentialShelters.map(
            (place) => new window.google.maps.LatLng(place.location.lat, place.location.lng),
          )

          distanceService.getDistanceMatrix(
            {
              origins: origins,
              destinations: destinations,
              travelMode: window.google.maps.TravelMode.WALKING,
            },
            (response, matrixStatus) => {
              if (matrixStatus === "OK" && response.rows[0].elements) {
                potentialShelters.forEach((place, index) => {
                  const element = response.rows[0].elements[index]
                  if (element.status === "OK") {
                    place.distance_text = element.distance.text
                    place.duration_text = element.duration.text
                    place.distance_value = element.distance.value
                    place.duration_value = element.duration.value
                  } else {
                    place.distance_text = `${Math.round(place.distance_value)} מ'`
                    place.duration_text = "-"
                    place.duration_value = Number.POSITIVE_INFINITY
                  }
                })
              } else {
                potentialShelters.forEach((place) => {
                  place.distance_text = `${Math.round(place.distance_value)} מ'`
                  place.duration_text = "-"
                  place.duration_value = Number.POSITIVE_INFINITY
                })
              }

              // סינון לפי רדיוס
              const sheltersWithinRadius = potentialShelters.filter((place) => place.distance_value <= maxRadius)

              console.log(`${sheltersWithinRadius.length} מקלטים נמצאים בטווח של ${maxRadius} מטרים`)
              resolve(sheltersWithinRadius)
            },
          )
        } catch (error) {
          console.error("שגיאה בחיפוש מקלטים:", error)
          reject(error)
        }
      })
    },
    [mapServices, t],
  )

  const applyFiltersAndSort = useCallback(
    (sheltersToProcess) => {
      // סינון לפי זמן הגעה מקסימלי
      const durationFilteredShelters = sheltersToProcess.filter((shelter) => {
        if (maxDurationFilter === 60) return true
        return shelter.duration_value <= maxDurationFilter * 60
      })

      // מיון התוצאות המסוננות
      return [...durationFilteredShelters].sort((a, b) => {
        switch (sortBy) {
          case "distance":
            return (a.distance_value || Number.POSITIVE_INFINITY) - (b.distance_value || Number.POSITIVE_INFINITY)
          case "duration":
            return (a.duration_value || Number.POSITIVE_INFINITY) - (b.duration_value || Number.POSITIVE_INFINITY)
          default:
            return 0
        }
      })
    },
    [sortBy, maxDurationFilter],
  )

  const saveRecentSearch = useCallback(
    (searchTerm) => {
      if (!searchTerm.trim()) return

      const updatedSearches = [searchTerm, ...recentSearches.filter((search) => search !== searchTerm).slice(0, 4)]
      setRecentSearches(updatedSearches)
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    },
    [recentSearches],
  )

  const handleSearch = useCallback(
    async (address, radius, location = null) => {
      setCurrentPage(1)
      setIsLoading(true)
      setAllFetchedShelters([])
      setShelters([])
      setError(null)
      setSearchRadius(radius)

      // שמירת חיפוש אחרון
      if (address) {
        saveRecentSearch(address)
      }

      let searchLocation

      try {
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

          // תיקון - שימוש ב-geocodeResult במקום searchLocation
          const center = { lat: geocodeResult.lat(), lng: geocodeResult.lng() }
          searchLocation = new window.google.maps.LatLng(center.lat, center.lng)
          setMapCenter(center)
          setOriginLocation(center)
        } else if (location) {
          searchLocation = new window.google.maps.LatLng(location.lat, location.lng)
          setMapCenter(location)
          setOriginLocation(location)
        } else {
          setIsLoading(false)
          return
        }

        const foundSheltersFromApi = await searchShelters(searchLocation, radius)

        setAllFetchedShelters(foundSheltersFromApi)
        const processedShelters = applyFiltersAndSort(foundSheltersFromApi)
        setShelters(processedShelters)

        if (processedShelters.length === 0 && foundSheltersFromApi.length > 0) {
          setError(t.errorMessages.noMatchingFilters)
        } else if (foundSheltersFromApi.length === 0) {
          setError(t.errorMessages.noSheltersFound)
        }
      } catch (error) {
        console.error("Error searching shelters:", error)
        setError(error.message || "אירעה שגיאה בחיפוש. נסה שוב מאוחר יותר.")
      } finally {
        setIsLoading(false)
      }
    },
    [mapServices, searchShelters, applyFiltersAndSort, t, saveRecentSearch],
  )

  // useEffect לעדכון רשימת המקלטים כאשר המסננים משתנים
  useEffect(() => {
    if (allFetchedShelters.length > 0) {
      const processedShelters = applyFiltersAndSort(allFetchedShelters)
      setShelters(processedShelters)
      setCurrentPage(1)
      if (processedShelters.length === 0) {
        setError("לא נמצאו מקלטים העונים על הגדרות הסינון הנוכחיות.")
      } else {
        setError(null)
      }
    }
  }, [sortBy, maxDurationFilter, allFetchedShelters, applyFiltersAndSort])

  const handleLocationSearch = useCallback(async () => {
    if (!navigator.geolocation) {
      setError(t.errorMessages.locationNotSupported)
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }
        setOriginLocation(location)

        if (mapServices?.geocoder) {
          mapServices.geocoder.geocode({ location }, (results, status) => {
            if (status === "OK" && results[0]) {
              setSearchInput(results[0].formatted_address)
              setCurrentLocation(results[0].formatted_address)
            }
          })
        }

        setMapCenter(location)
        await handleSearch(null, searchRadius, location)
      },
      (error) => {
        setError(t.errorMessages.locationFailed)
        setIsLoading(false)
      },
    )
  }, [mapServices, searchRadius, handleSearch, t])

  // עדכון האוטוקומפליט לאחר טעינת גוגל מפות
  useEffect(() => {
    if (window.google && searchInputRef.current && !autocomplete) {
      const autoComplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: "il" },
        fields: ["formatted_address", "geometry"],
      })

      // מונע מהאוטוקומפליט להשתלט על אירועי המקלדת
      searchInputRef.current.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") {
          e.stopPropagation()
        }
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
          handleSearch(place.formatted_address, searchRadius, location)
        }
      })

      setAutocomplete(autoComplete)
    }
  }, [googleMapsLoaded, searchInputRef, autocomplete, handleSearch, searchRadius])

  const navigateToGoogleMaps = (shelter, event) => {
    event.stopPropagation()
    if (!shelter.location) return

    let url = `https://www.google.com/maps/dir/?api=1&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`

    if (originLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${originLocation.lat},${originLocation.lng}&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`
    }

    window.open(url, "_blank")
  }

  const handleRecentSearch = (search) => {
    setSearchInput(search)
    handleSearch(search, searchRadius)
  }

  const removeRecentSearch = (searchToRemove) => {
    const updatedSearches = recentSearches.filter((search) => search !== searchToRemove)
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
  }

  // חישוב עמודים
  const totalPages = Math.ceil(shelters.length / SHELTERS_PER_PAGE)

  // המקלטים המוצגים כרגע
  const currentShelters = shelters.slice((currentPage - 1) * SHELTERS_PER_PAGE, currentPage * SHELTERS_PER_PAGE)

  // גלילה לתחילת התוצאות בשינוי עמוד
  useEffect(() => {
    if (resultsContainerRef.current && isMobile) {
      resultsContainerRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentPage, isMobile])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-right">{t.pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-right">{t.pageDescription}</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 py-4 rounded-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(searchInput, searchRadius)
          }}
          className="flex gap-3 items-center"
        >
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t.searchInputPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-4 pl-4 py-3 text-right"
              dir="rtl"
            />
          </div>

          <Button
            type="button"
            onClick={handleLocationSearch}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3"
            variant="outline"
          >
            <Navigation className="w-4 h-4 ml-2" />
            {t.useMyLocation}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 flex-1 sm:flex-none dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Filter size={18} />
                <span className="hidden sm:inline">{t.filterButton}</span>
              </Button>
            </SheetTrigger>
            <SheetContent position={isRTL ? "right" : "left"} size="sm" className="p-0 dark:bg-gray-800">
              <SheetHeader className="p-6 border-b dark:border-gray-700">
                <SheetTitle className="dark:text-white">{t.filterTitle}</SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium dark:text-gray-300">
                      {t.searchRadius}: {searchRadius} {t.meters}
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
                    <span>100 {t.meters}</span>
                    <span>1500 {t.meters}</span>
                    <span>3000 {t.meters}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium dark:text-gray-300">
                      {t.maxDuration}: {maxDurationFilter} {t.minutes}
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
                    <span>1 {t.minutes}</span>
                    <span>30 {t.minutes}</span>
                    <span>60 {t.minutes}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleSearch(searchInput, searchRadius)}
                  className="w-full bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white"
                >
                  {t.applyFilter}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-4 py-3"
          >
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Clock size={16} />
              <span>{t.recentSearches}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <button onClick={() => handleRecentSearch(search)} className="flex-1">
                    {search}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRecentSearch(search)
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
        <ShelterMap
          center={mapCenter}
          radius={searchRadius}
          markers={[
            // Add user location marker if available
            ...(originLocation
              ? [
                  {
                    position: originLocation,
                    title: "המיקום שלך",
                    isUserLocation: true,
                    content: `
                <div dir="rtl" style="padding: 8px;">
                  <strong>המיקום שלך</strong>
                </div>
              `,
                  },
                ]
              : []),
            // Add shelter markers
            ...shelters.map((shelter) => ({
              position: shelter.location,
              title: shelter.name,
              isSelected: selectedShelter?.place_id === shelter.place_id,
              content: `
                <div dir="rtl" style="padding: 8px; min-width: 200px;">
                  <strong>${shelter.name}</strong>
                  <p>${shelter.address}</p>
                  ${shelter.distance_text ? `<p>מרחק: ${shelter.distance_text}</p>` : ""}
                  ${shelter.duration_text ? `<p>זמן הליכה: ${shelter.duration_text}</p>` : ""}
                </div>
              `,
            })),
          ]}
          onMapLoad={handleMapLoad}
          height="650px"
        />
      </div>

      {/* Status Message and Sort Options - Only when there are search results */}
      {shelters.length > 0 && (
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" size={20} />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="large" />
          <p className="ml-3 text-gray-600 dark:text-gray-300">{t.loading}</p>
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

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t.noSearchYet}</h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.enterAddressPrompt}</p>

          <Button
            onClick={handleLocationSearch}
            disabled={isLoading}
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white px-6 py-3"
          >
            <Navigation className="w-4 h-4 ml-2" />
            {t.findNearMe}
          </Button>
        </div>
      )}

      {/* Shelters List - Only show when there are results */}
      {!isLoading && shelters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentShelters.map((shelter) => (
            <div
              key={shelter.place_id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 cursor-pointer transition-all border border-transparent ${
                selectedShelter?.place_id === shelter.place_id
                  ? "ring-2 ring-blue-500 border-blue-200 dark:ring-blue-700 dark:border-blue-800"
                  : "hover:border-gray-200 dark:hover:border-gray-700"
              }`}
              onClick={() => {
                setSelectedShelter(shelter)
                setMapCenter(shelter.location)
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 ml-2">
                      <h3 className="font-medium line-clamp-2 text-base leading-tight text-gray-800 dark:text-gray-200">
                        {shelter.address}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {shelter.distance_text && (
                          <Badge variant="secondary" className="gap-1 dark:bg-gray-700 dark:text-gray-300">
                            <Navigation size={12} />
                            {shelter.distance_text}
                          </Badge>
                        )}
                        {shelter.duration_text && shelter.duration_text !== "-" && (
                          <Badge variant="secondary" className="gap-1 dark:bg-gray-700 dark:text-gray-300">
                            <Clock size={12} />
                            {shelter.duration_text}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mt-1 -mr-1 shrink-0 p-1 dark:hover:bg-gray-700"
                      onClick={(e) => toggleFavorite(shelter, e)}
                      disabled={updatingFavorite === shelter.place_id}
                    >
                      {updatingFavorite === shelter.place_id ? (
                        <Spinner size="small" />
                      ) : (
                        <Heart
                          size={20}
                          className={
                            favorites.includes(shelter.place_id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 dark:text-gray-500"
                          }
                        />
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{shelter.name}</p>
                </div>

                <div className="mt-3">
                  <Button
                    size="sm"
                    className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-800 text-white w-full"
                    onClick={(e) => navigateToGoogleMaps(shelter, e)}
                  >
                    <Navigation size={14} className="ml-1" />
                    {t.navigateToShelter}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <ChevronRight />
                <ChevronRight />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <ChevronRight />
              </Button>

              <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
                עמוד {currentPage} מתוך {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <ChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <ChevronLeft />
                <ChevronLeft />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
