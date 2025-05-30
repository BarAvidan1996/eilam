"use client"

import { useEffect, useRef, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

// Using environment variable instead of hardcoded API key
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || process.env.GOOGLE_MAPS_API

// Adding translations object
const translations = {
  he: {
    loadingMap: "טוען מפה...",
  },
  en: {
    loadingMap: "Loading map...",
  },
  ar: {
    loadingMap: "جارٍ تحميل الخريطة...",
  },
  ru: {
    loadingMap: "Загрузка карты...",
  },
}

export default function ShelterMap({ center, radius, markers = [], onMapLoad, height = "400px" }) {
  const mapRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState(null)
  const [radiusCircle, setRadiusCircle] = useState(null)
  const [mapMarkers, setMapMarkers] = useState([])
  const [language, setLanguage] = useState("he")
  const [t, setT] = useState(translations.he)

  // Set language from document only on client-side
  useEffect(() => {
    const docLang = document?.documentElement?.lang || "he"
    setLanguage(docLang)
    setT(translations[docLang] || translations.he)
  }, [])

  // Check if API key is available
  useEffect(() => {
    if (!API_KEY) {
      console.error(
        "Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API or GOOGLE_MAPS_API environment variable.",
      )
    }
  }, [])

  // טעינת סקריפט של Google Maps
  useEffect(() => {
    if (typeof window === "undefined" || !API_KEY) return

    if (window.google?.maps) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`
    script.defer = true
    script.async = true
    script.onload = () => {
      console.log("Google Maps script loaded successfully")
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      console.error("Failed to load Google Maps script")
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // אתחול המפה
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || typeof window === "undefined" || !API_KEY) return

    const initialCenter = center || { lat: 32.0853, lng: 34.7818 } // תל אביב כברירת מחדל

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy", // מאפשר פינץ׳ גם ללא מקש ctrl
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }], // הסתרת נקודות עניין לקריאות טובה יותר
          },
        ],
      })

      setMapInstance(map)
      setIsLoaded(true)

      if (onMapLoad) {
        onMapLoad(map)
      }

      console.log("Map initialized successfully")
    } catch (error) {
      console.error("Error initializing map:", error)
    }

    return () => {
      // ניקוי
    }
  }, [isScriptLoaded, mapRef, onMapLoad, center])

  // עדכון המרכז של המפה
  useEffect(() => {
    if (!mapInstance || !center) return

    mapInstance.setCenter(center)

    // עדכון של המעגל ברדיוס
    if (radius && radius > 0) {
      if (radiusCircle) {
        radiusCircle.setMap(null)
      }

      const circle = new window.google.maps.Circle({
        strokeColor: "#FF3B30",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF3B30",
        fillOpacity: 0.08,
        map: mapInstance,
        center: center,
        radius: Number.parseInt(radius),
      })

      // התאמת זום לפי רדיוס החיפוש
      const zoomLevel = getZoomLevel(Number.parseInt(radius))
      mapInstance.setZoom(zoomLevel)

      setRadiusCircle(circle)
    } else if (radiusCircle) {
      radiusCircle.setMap(null)
      setRadiusCircle(null)
    }
  }, [mapInstance, center, radius])

  // פונקציה לחישוב רמת זום מתאימה לפי רדיוס
  const getZoomLevel = (radius) => {
    if (radius <= 400) return 16
    if (radius <= 800) return 15
    if (radius <= 1600) return 14
    if (radius <= 3000) return 13
    return 13
  }

  // עדכון הסמנים במפה
  useEffect(() => {
    if (!mapInstance || typeof window === "undefined") {
      return
    }

    // הסרת סמנים קודמים
    mapMarkers.forEach((marker) => marker.setMap(null))

    if (!markers.length) {
      setMapMarkers([])
      return
    }

    // בדיקה ומניעת שכפולים לפני יצירת סמנים
    const uniquePositions = new Map()
    const uniqueMarkers = []

    markers.forEach((markerData) => {
      if (!markerData.position) return

      const key = `${markerData.position.lat.toFixed(4)},${markerData.position.lng.toFixed(4)}`

      if (!uniquePositions.has(key)) {
        uniquePositions.set(key, true)
        uniqueMarkers.push(markerData)
      }
    })

    // יצירת סמנים חדשים
    const newMarkers = uniqueMarkers.map((markerData) => {
      // הגדרת סמן מיקום נוכחי של המשתמש
      const customIcon = markerData.isUserLocation
        ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#007AFF",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          }
        : {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: markerData.isSelected ? "#FF9500" : "#FF3B30", // שינוי צבע לכתום אם נבחר
            fillOpacity: 1,
            strokeOpacity: markerData.isSelected ? 1 : 0.2, // קו מודגש יותר אם נבחר
            strokeColor: markerData.isSelected ? "#FF9500" : "#FF3B30",
            strokeWeight: markerData.isSelected ? 2 : 1, // קו עבה יותר אם נבחר
            scale: markerData.isSelected ? 2.2 : 1.8, // גודל גדול יותר אם נבחר
            anchor: new window.google.maps.Point(12, 22),
          }

      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstance,
        title: markerData.title,
        icon: markerData.isUserLocation ? customIcon : customIcon,
        animation: markerData.isSelected ? window.google.maps.Animation.BOUNCE : null, // אנימציית קפיצה קלה למקלט נבחר
        optimized: true,
        zIndex: markerData.isSelected ? 1000 : markerData.isUserLocation ? 900 : 1, // סדר השכבות - נבחר תמיד למעלה
      })

      // עצירת האנימציה לאחר 2 שניות
      if (markerData.isSelected) {
        setTimeout(() => {
          marker.setAnimation(null)
        }, 2000)
      }

      // יצירת חלון מידע
      if (markerData.content) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: markerData.content,
        })

        // פתיחת חלון המידע אוטומטית אם מדובר במקלט נבחר
        if (markerData.isSelected) {
          setTimeout(() => {
            infoWindow.open(mapInstance, marker)
          }, 100)
        }

        marker.addListener("click", () => {
          infoWindow.open(mapInstance, marker)
        })
      }

      return marker
    })

    setMapMarkers(newMarkers)
  }, [mapInstance, markers])

  // Show error if API key is missing
  if (!API_KEY) {
    return (
      <div style={{ position: "relative", width: "100%", height }} className="rounded-xl overflow-hidden shadow-md">
        <div className="absolute inset-0 flex items-center justify-center bg-red-100">
          <div className="text-center">
            <p className="text-red-600 font-semibold">שגיאה: מפתח Google Maps API חסר</p>
            <p className="text-red-500 text-sm mt-2">אנא הגדר את משתנה הסביבה NEXT_PUBLIC_GOOGLE_MAPS_API</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "relative", width: "100%", height }} className="rounded-xl overflow-hidden shadow-md">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <Spinner size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loadingMap}</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        className="rounded-xl"
        aria-label="מפת מקלטים"
        role="application"
      />
    </div>
  )
}
