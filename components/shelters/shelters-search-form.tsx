"use client"

import { useState, useEffect } from "react"
import { Search, Navigation, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

// Adding translations object
const translations = {
  he: {
    searchTitle: "חיפוש מקלטים",
    addressPlaceholder: "הזן כתובת או שם מקום...",
    searchRadius: "רדיוס חיפוש: ",
    meters: "מטר",
    hide: "הסתר",
    show: "הגדר",
    searchButton: "חפש מקלטים",
    useLocationButton: "השתמש במיקום נוכחי",
    recentSearches: "חיפושים אחרונים:",
  },
  en: {
    searchTitle: "Search Shelters",
    addressPlaceholder: "Enter address or place name...",
    searchRadius: "Search radius: ",
    meters: "meters",
    hide: "Hide",
    show: "Set",
    searchButton: "Search Shelters",
    useLocationButton: "Use Current Location",
    recentSearches: "Recent searches:",
  },
  ar: {
    searchTitle: "البحث عن الملاجئ",
    addressPlaceholder: "أدخل العنوان أو اسم المكان...",
    searchRadius: "نطاق البحث: ",
    meters: "متر",
    hide: "إخفاء",
    show: "تعيين",
    searchButton: "البحث عن الملاجئ",
    useLocationButton: "استخدام الموقع الحالي",
    recentSearches: "عمليات البحث الأخيرة:",
  },
  ru: {
    searchTitle: "Поиск убежищ",
    addressPlaceholder: "Введите адрес или название места...",
    searchRadius: "Радиус поиска: ",
    meters: "метров",
    hide: "Скрыть",
    show: "Установить",
    searchButton: "Искать убежища",
    useLocationButton: "Использовать текущее местоположение",
    recentSearches: "Недавние поиски:",
  },
}

export default function ShelterSearchForm({ onSearch, onLocationSearch, isLoading = false }) {
  const [address, setAddress] = useState("")
  const [radius, setRadius] = useState(1000)
  const [showRadiusSlider, setShowRadiusSlider] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [t, setT] = useState(translations.he)

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setIsRTL(docLang === "he" || docLang === "ar")
    setT(translations[docLang] || translations.he)

    // Load recent searches from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      setRecentSearches(saved ? JSON.parse(saved) : [])
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!address.trim() && !isGettingLocation) return

    // שמירת חיפוש אחרון
    if (address.trim()) {
      const updatedSearches = [address, ...recentSearches.filter((search) => search !== address).slice(0, 4)]
      setRecentSearches(updatedSearches)
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    }

    onSearch(address, radius)
  }

  const handleLocationSearch = () => {
    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocationSearch({ lat: latitude, lng: longitude }, radius)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("שגיאה באיתור מיקום:", error)
        setIsGettingLocation(false)
        alert("לא ניתן לאתר את המיקום הנוכחי. אנא ודא שהדפדפן מאפשר גישה למיקום.")
      },
    )
  }

  const handleRecentSearch = (search) => {
    setAddress(search)
    onSearch(search, radius)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-gray-700 dark:text-gray-300 font-medium">
            {t.searchTitle}
          </Label>
          <div className="relative">
            <Input
              id="address"
              type="text"
              placeholder={t.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg"
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="radius" className="text-gray-700 dark:text-gray-300">
              {t.searchRadius} {radius} {t.meters}
            </Label>
            <button
              type="button"
              className="text-sm text-purple-600 dark:text-purple-400 underline"
              onClick={() => setShowRadiusSlider(!showRadiusSlider)}
            >
              {showRadiusSlider ? t.hide : t.show}
            </button>
          </div>

          {showRadiusSlider && (
            <div className="space-y-2">
              <input
                id="radius"
                type="range"
                min="100"
                max="3000"
                step="100"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>100 {t.meters}</span>
                <span>1500 {t.meters}</span>
                <span>3000 {t.meters}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 flex items-center justify-center gap-2"
            disabled={isLoading || (!address.trim() && !isGettingLocation)}
          >
            {isLoading ? <Spinner size="small" /> : <Search size={18} />}
            <span>{t.searchButton}</span>
          </Button>

          <Button
            type="button"
            onClick={handleLocationSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 flex items-center justify-center gap-2"
            disabled={isLoading || isGettingLocation}
          >
            {isGettingLocation ? <Spinner size="small" /> : <Navigation size={18} />}
            <span>{t.useLocationButton}</span>
          </Button>
        </div>
      </form>

      {recentSearches.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <History size={16} />
            <span>{t.recentSearches}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearch(search)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
