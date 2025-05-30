"use client"

import { useRef } from "react"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle } from "lucide-react"
import ShelterMap from "@/components/map/shelter-map"
import ShelterSearchForm from "@/components/shelters/shelters-search-form"
import ShelterList from "@/components/shelters/shelter-list"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  ar: {
    pageTitle: "البحث عن الملاجئ",
    pageDescription: "ابحث عن الملاجئ القريبة حسب العنوان أو الموقع الحالي.",
    searchInputPlaceholder: "ابحث حسب العنوان أو اسم المكان...",
    useMyLocation: "استخدم موقعي",
    currentLocation: "الموقع الحالي",
    filterButton: "تصفية",
    searchButton: "بحث",
    filterTitle: "تصفية النتائج",
    searchRadius: "نطاق البحث",
    meters: "متر",
    maxDuration: "أقصى وقت للمشي",
    minutes: "دقائق",
    applyFilter: "تطبيق التصفية",
    loading: "جارِ التحميل...",
    loadingMap: "جارِ تحميل الخريطة...",
    foundShelters: "ملاجئ تم العثور عليها",
    noMatchingResults: "لا توجد ملاجئ تطابق عوامل التصفية الحالية",
    noSearchYet: "لم يتم إجراء بحث بعد",
    enterAddressPrompt: "أدخل عنوانًا أو استخدم موقعك الحالي للعثور على الملاجئ القريبة",
    findNearMe: "ابحث عن ملاجئ بالقرب مني",
    sortBy: "ترتيب حسب",
    distance: "المسافة",
    duration: "المدة",
    navigateToShelter: "التنقل إلى الملجأ",
    errorMessages: {
      locationNotSupported: "متصفحك لا يدعم خدمات الموقع",
      locationFailed: "تعذر تحديد موقعك الحالي",
      noSheltersFound: "لم يتم العثور على ملاجئ في هذه المنطقة. حاول زيادة نطاق البحث.",
      noMatchingFilters:
        "لا توجد ملاجئ تطابق إعدادات التصفية الحالية. حاول تعديل نطاق البحث أو الحد الأقصى لوقت الوصول.",
      mapsError: "خدمات الخرائط غير متوفرة حاليًا. يرجى تحديث الصفحة.",
    },
  },
  ru: {
    pageTitle: "Поиск убежищ",
    pageDescription: "Найдите ближайшие убежища по адресу или текущему местоположению.",
    searchInputPlaceholder: "Поиск по адресу или названию места...",
    useMyLocation: "Использовать мое местоположение",
    currentLocation: "Текущее местоположение",
    filterButton: "Фильтр",
    searchButton: "Поиск",
    filterTitle: "Фильтр результатов",
    searchRadius: "Радиус поиска",
    meters: "метров",
    maxDuration: "Максимальное время ходьбы",
    minutes: "минут",
    applyFilter: "Применить фильтр",
    loading: "Загрузка...",
    loadingMap: "Загрузка карты...",
    foundShelters: "найдено убежищ",
    noMatchingResults: "Нет убежищ, соответствующих текущим фильтрам",
    noSearchYet: "Поиск еще не выполнен",
    enterAddressPrompt: "Введите адрес или используйте текущее местоположение для поиска ближайших убежищ",
    findNearMe: "Найти убежища рядом со мной",
    sortBy: "Сортировать по",
    distance: "Расстоянию",
    duration: "Времени",
    navigateToShelter: "Проложить маршрут к убежищу",
    errorMessages: {
      locationNotSupported: "Ваш браузер не поддерживает службы определения местоположения",
      locationFailed: "Не удалось определить ваше текущее местоположение",
      noSheltersFound: "В этом районе не найдено убежищ. Попробуйте увеличить радиус поиска.",
      noMatchingFilters:
        "Нет убежищ, соответствующих текущим настройкам фильтра. Попробуйте изменить радиус поиска или максимальное время прибытия.",
      mapsError: "Службы карт в настоящее время недоступны. Пожалуйста, обновите страницу.",
    },
  },
}

export default function SheltersPage() {
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)

  // Initialize with default translations
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
  const resultsContainerRef = useRef(null)
  const supabase = createClientComponentClient()

  const SHELTERS_PER_PAGE = 8

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
    // This would be replaced with actual data fetching from Supabase
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

      // בקשה לחיפוש מקומות קרובים מסוג מקלט
      return new Promise((resolve, reject) => {
        const request = {
          location: location,
          radius: radius,
          keyword: 'מקלט|מרחב מוגן|ממ"ד|ממ"ק',
          type: ["point_of_interest"],
        }

        mapServices.placesService.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            // עיבוד התוצאות
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

            // חישוב מרחקים
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

                  // מיון לפי מרחק
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

  const applyFiltersAndSort = useCallback(
    (sheltersToProcess) => {
      // Filter by maximum duration
      const durationFilteredShelters = sheltersToProcess.filter((shelter) => {
        if (maxDurationFilter === 60) return true // If slider is at maximum, don't filter
        return shelter.duration_value <= maxDurationFilter * 60 // Convert to seconds
      })

      // Sort the filtered results
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

  const handleSearch = useCallback(
    async (address, radius) => {
      setIsLoading(true)
      setError(null)
      setShelters([])
      setSearchRadius(radius)

      try {
        let searchLocation

        if (address && mapServices?.geocoder) {
          // חיפוש לפי כתובת
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
        } else {
          setIsLoading(false)
          return
        }

        const foundShelters = await searchShelters(searchLocation, radius)
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
    [mapServices, searchShelters, t],
  )

  // Update shelter list when filters change
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

  const handleLocationSearch = useCallback(
    async (location, radius) => {
      setIsLoading(true)
      setError(null)
      setShelters([])
      setSearchRadius(radius)
      setMapCenter(location)

      try {
        const foundShelters = await searchShelters(location, radius)
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
    },
    [searchShelters, t],
  )

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

    // If there's an origin location, add it to the navigation
    if (originLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${originLocation.lat},${originLocation.lng}&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`
    }

    window.open(url, "_blank")
  }

  const toggleFavorite = async (shelter, event) => {
    event.stopPropagation()
    setUpdatingFavorite(shelter.place_id)

    try {
      const isFavorite = favorites.includes(shelter.place_id)

      // This would be replaced with actual Supabase operations
      if (isFavorite) {
        // Remove from favorites
        setFavorites((prev) => prev.filter((id) => id !== shelter.place_id))
      } else {
        // Add to favorites
        setFavorites((prev) => [...prev, shelter.place_id])
      }
    } catch (error) {
      console.error("Error updating favorites:", error)
    }

    setUpdatingFavorite(null)
  }

  // Calculate pagination
  const totalPages = Math.ceil(shelters.length / SHELTERS_PER_PAGE)

  // Current shelters to display
  const currentShelters = shelters.slice((currentPage - 1) * SHELTERS_PER_PAGE, currentPage * SHELTERS_PER_PAGE)

  // Scroll to results when page changes
  useEffect(() => {
    if (resultsContainerRef.current && isMobile) {
      resultsContainerRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentPage, isMobile])

  const handleShelterSelect = (shelter) => {
    setSelectedShelter(shelter)
    setMapCenter(shelter.location)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t.pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-300">{t.pageDescription}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ShelterSearchForm onSearch={handleSearch} onLocationSearch={handleLocationSearch} isLoading={isLoading} />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ShelterList shelters={shelters} isLoading={isLoading} onShelterSelect={handleShelterSelect} />
        </div>

        <div className="lg:col-span-2">
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
            height="calc(100vh - 200px)"
          />
        </div>
      </div>
    </div>
  )
}
