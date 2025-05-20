"use client"

import { useState, useEffect } from "react"
import { Bookmark, MapPin, Clock, Star, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Adding translations object
const translations = {
  he: {
    loading: "מחפש מקלטים קרובים...",
    noShelters: "לא נמצאו מקלטים",
    noSheltersDesc: "לא נמצאו מקלטים בטווח החיפוש שהוגדר. נסה להגדיל את רדיוס החיפוש או לחפש באזור אחר.",
    navigateGoogleMaps: "ניווט בגוגל מפות",
  },
  en: {
    loading: "Searching for nearby shelters...",
    noShelters: "No shelters found",
    noSheltersDesc:
      "No shelters were found within the defined search range. Try increasing the search radius or searching in a different area.",
    navigateGoogleMaps: "Navigate in Google Maps",
  },
  ar: {
    loading: "البحث عن الملاجئ القريبة...",
    noShelters: "لم يتم العثور على ملاجئ",
    noSheltersDesc: "لم يتم العثور على ملاجئ ضمن نطاق البحث المحدد. حاول زيادة نطاق البحث أو البحث في منطقة مختلفة.",
    navigateGoogleMaps: "التنقل في خرائط جوجل",
  },
  ru: {
    loading: "Поиск ближайших убежищ...",
    noShelters: "Убежища не найдены",
    noSheltersDesc:
      "В заданном диапазоне поиска не найдено убежищ. Попробуйте увеличить радиус поиска или искать в другом районе.",
    navigateGoogleMaps: "Навигация в Google Maps",
  },
}

export default function ShelterList({ shelters = [], isLoading = false, onShelterSelect }) {
  const [favorites, setFavorites] = useState([])
  const [updatingFavorite, setUpdatingFavorite] = useState(null)
  const supabase = createClientComponentClient()
  const [language, setLanguage] = useState("he")
  const [t, setT] = useState(translations.he)

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setT(translations[docLang] || translations.he)

    // Load favorites
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase.from("favorite_shelters").select("place_id")

      if (error) throw error

      setFavorites(data?.map((fav) => fav.place_id) || [])
    } catch (error) {
      console.error("Error loading favorites:", error)
      setFavorites([])
    }
  }

  const toggleFavorite = async (shelter) => {
    setUpdatingFavorite(shelter.place_id)
    try {
      const isFavorite = favorites.includes(shelter.place_id)

      if (isFavorite) {
        // מחיקת מועדף
        const { error } = await supabase.from("favorite_shelters").delete().eq("place_id", shelter.place_id)

        if (error) throw error
      } else {
        // הוספה למועדפים
        const { error } = await supabase.from("favorite_shelters").insert({
          place_id: shelter.place_id,
          name: shelter.name,
          address: shelter.address,
          lat: shelter.location.lat,
          lng: shelter.location.lng,
          label: "אחר",
        })

        if (error) throw error
      }

      // עדכון הרשימה המקומית
      setFavorites((prev) => (isFavorite ? prev.filter((id) => id !== shelter.place_id) : [...prev, shelter.place_id]))
    } catch (error) {
      console.error("Error updating favorites:", error)
    }
    setUpdatingFavorite(null)
  }

  const navigateToGoogleMaps = (shelter) => {
    if (!shelter.location) return

    const url = `https://www.google.com/maps/dir/?api=1&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <Spinner className="mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
      </div>
    )
  }

  if (shelters.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <MapPin className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t.noShelters}</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t.noSheltersDesc}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shelters.map((shelter) => (
        <div
          key={shelter.place_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={() => onShelterSelect(shelter)}
        >
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{shelter.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-purple-500 dark:text-gray-500 dark:hover:text-purple-400"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(shelter)
              }}
            >
              {updatingFavorite === shelter.place_id ? (
                <Spinner size="small" />
              ) : (
                <Bookmark
                  className={
                    favorites.includes(shelter.place_id)
                      ? "fill-purple-500 text-purple-500 dark:fill-purple-400 dark:text-purple-400"
                      : ""
                  }
                />
              )}
            </Button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mt-1">{shelter.address}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            {shelter.distance && (
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <MapPin size={16} className="mr-1" />
                <span>{shelter.distance}</span>
              </div>
            )}

            {shelter.duration && (
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <Clock size={16} className="mr-1" />
                <span>{shelter.duration}</span>
              </div>
            )}

            {shelter.rating && (
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <Star size={16} className="mr-1 text-yellow-500" />
                <span>{shelter.rating}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              size="sm"
              variant="outline"
              className="text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation()
                navigateToGoogleMaps(shelter)
              }}
            >
              <ExternalLink size={14} />
              <span>{t.navigateGoogleMaps}</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
