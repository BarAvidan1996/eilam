"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation, Loader2, AlertTriangle, Map, Search, X } from "lucide-react"

interface LocationData {
  type: "current" | "address" | "map"
  lat?: number
  lng?: number
  address?: string
  displayName?: string
}

interface LocationSelectorProps {
  onLocationSelected: (location: LocationData) => void
  onCancel: () => void
  isVisible: boolean
}

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export function LocationSelector({ onLocationSelected, onCancel, isVisible }: LocationSelectorProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState("")
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<any>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)

  // Load Google Maps API
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=places&language=he&region=IL`
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log("🗺️ Google Maps API loaded successfully")
        setIsGoogleMapsLoaded(true)
        if (window.google && window.google.maps) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
        }
      }
      script.onerror = () => {
        console.error("❌ Failed to load Google Maps API")
        setLocationError("שגיאה בטעינת מפות Google")
      }
      document.head.appendChild(script)
    } else if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true)
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
    }
  }, [])

  // Initialize map when showing map picker
  useEffect(() => {
    if (showMap && mapRef.current && isGoogleMapsLoaded && window.google && window.google.maps) {
      console.log("🗺️ Initializing map...")

      // Default to Tel Aviv center
      const defaultCenter = { lat: 32.0853, lng: 34.7818 }

      try {
        map.current = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        })

        marker.current = new window.google.maps.Marker({
          position: defaultCenter,
          map: map.current,
          draggable: true,
          title: "בחר מיקום על המפה",
          animation: window.google.maps.Animation.DROP,
        })

        // Handle map click
        map.current.addListener("click", (event: any) => {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          console.log("🗺️ Map clicked at:", lat, lng)
          marker.current.setPosition({ lat, lng })
        })

        // Handle marker drag
        marker.current.addListener("dragend", () => {
          const position = marker.current.getPosition()
          console.log("🗺️ Marker moved to:", position.lat(), position.lng())
        })

        console.log("✅ Map initialized successfully")
      } catch (error) {
        console.error("❌ Error initializing map:", error)
        setLocationError("שגיאה באתחול המפה")
      }
    }
  }, [showMap, isGoogleMapsLoaded])

  if (!isVisible) return null

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("הדפדפן שלך לא תומך בזיהוי מיקום")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      console.log("📍 Current location:", latitude, longitude)

      // Get address from coordinates using reverse geocoding
      let displayName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&language=he`,
        )
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          displayName = data.results[0].formatted_address
          console.log("📍 Reverse geocoded address:", displayName)
        }
      } catch (geocodeError) {
        console.warn("Failed to get address from coordinates:", geocodeError)
      }

      onLocationSelected({
        type: "current",
        lat: latitude,
        lng: longitude,
        displayName,
      })
    } catch (error) {
      console.error("Location error:", error)

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("הגישה למיקום נדחתה. אנא אפשר גישה למיקום בהגדרות הדפדפן.")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("לא ניתן לזהות את המיקום. נסה להזין כתובת ידנית.")
            break
          case error.TIMEOUT:
            setLocationError("זיהוי המיקום לקח יותר מדי זמן. נסה שוב או הזן כתובת ידנית.")
            break
          default:
            setLocationError("שגיאה בזיהוי מיקום. נסה להזין כתובת ידנית.")
        }
      } else {
        setLocationError(error instanceof Error ? error.message : "שגיאה לא ידועה")
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleAddressInput = async (value: string) => {
    setManualAddress(value)
    console.log("🔍 Address input:", value)

    if (value.length > 2 && autocompleteService.current && isGoogleMapsLoaded) {
      setIsLoadingPredictions(true)

      const request = {
        input: value,
        componentRestrictions: { country: "il" },
        language: "he",
        types: ["geocode", "establishment"], // Include both addresses and places
      }

      console.log("🔍 Requesting predictions for:", value)

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        console.log("🔍 Predictions status:", status)
        console.log("🔍 Predictions received:", predictions)

        setIsLoadingPredictions(false)
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions)
        } else {
          setPredictions([])
          console.warn("🔍 No predictions or error:", status)
        }
      })
    } else {
      setPredictions([])
    }
  }

  const selectPrediction = async (prediction: any) => {
    console.log("📍 Selected prediction:", prediction)
    setManualAddress(prediction.description)
    setPredictions([])

    // Geocode the selected prediction
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${prediction.place_id}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&language=he`,
      )
      const data = await response.json()
      console.log("📍 Geocoding result:", data)

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location

        onLocationSelected({
          type: "address",
          lat: location.lat,
          lng: location.lng,
          address: prediction.description,
          displayName: result.formatted_address,
        })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setLocationError("שגיאה בחיפוש הכתובת. נסה שוב.")
    }
  }

  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      setLocationError("אנא הזן כתובת")
      return
    }

    setLocationError(null)
    console.log("📍 Manual geocoding for:", manualAddress)

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&language=he&region=il`,
      )
      const data = await response.json()
      console.log("📍 Manual geocoding result:", data)

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location

        onLocationSelected({
          type: "address",
          lat: location.lat,
          lng: location.lng,
          address: manualAddress,
          displayName: result.formatted_address,
        })
      } else {
        setLocationError("לא נמצאה כתובת מתאימה. נסה כתובת אחרת.")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setLocationError("שגיאה בחיפוש הכתובת. נסה שוב.")
    }
  }

  const handleMapSelection = async () => {
    if (marker.current) {
      const position = marker.current.getPosition()
      const lat = position.lat()
      const lng = position.lng()
      console.log("🗺️ Map selection:", lat, lng)

      // Try to get address for the selected point
      let displayName = `נקודה שנבחרה על המפה (${lat.toFixed(4)}, ${lng.toFixed(4)})`

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&language=he`,
        )
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          displayName = data.results[0].formatted_address
        }
      } catch (error) {
        console.warn("Failed to reverse geocode map selection:", error)
      }

      onLocationSelected({
        type: "map",
        lat,
        lng,
        displayName,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              בחירת מיקום לחיפוש מקלטים
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <p className="text-sm text-muted-foreground">
            כדי למצוא מקלטים קרובים, אנחנו צריכים לדעת את המיקום שלך. בחר באחת מהאפשרויות:
          </p>

          {/* Current Location Option */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              מיקום נוכחי
            </h3>
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base"
              size="lg"
            >
              {isGettingLocation ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מזהה מיקום...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  השתמש במיקום הנוכחי
                </div>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">המיקום שלך לא נשמר ומשמש רק לחיפוש מקלטים</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground">או</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Manual Address Option */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              חיפוש כתובת
            </h3>
            <div className="relative">
              <Input
                placeholder="הזן כתובת או עיר (למשל: רחוב דיזנגוף 1, תל אביב)"
                value={manualAddress}
                onChange={(e) => handleAddressInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualAddress()}
                className="text-right pr-10"
              />
              {isLoadingPredictions && (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {/* Autocomplete dropdown */}
              {predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {predictions.map((prediction, index) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => selectPrediction(prediction)}
                      className="w-full text-right p-3 hover:bg-muted transition-colors border-b last:border-b-0 focus:bg-muted focus:outline-none"
                    >
                      <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                      <div className="text-sm text-muted-foreground">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleManualAddress}
              disabled={!manualAddress.trim()}
              variant="outline"
              className="w-full text-sm sm:text-base"
              size="lg"
            >
              חפש לפי כתובת זו
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground">או</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Map Selection Option */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Map className="h-4 w-4" />
              בחירה על המפה
            </h3>
            {!showMap ? (
              <Button
                onClick={() => setShowMap(true)}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={!isGoogleMapsLoaded}
              >
                <Map className="h-4 w-4 mr-2" />
                {isGoogleMapsLoaded ? "פתח מפה לבחירת מיקום" : "טוען מפות Google..."}
              </Button>
            ) : (
              <div className="space-y-3">
                <div
                  ref={mapRef}
                  className="w-full h-48 sm:h-64 rounded-lg border bg-muted flex items-center justify-center"
                  style={{ minHeight: "192px", maxHeight: "40vh" }}
                >
                  {!isGoogleMapsLoaded && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      טוען מפה...
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleMapSelection} className="flex-1 bg-primary hover:bg-primary/90">
                    בחר מיקום זה
                  </Button>
                  <Button onClick={() => setShowMap(false)} variant="outline" className="flex-1 sm:flex-none">
                    סגור מפה
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">לחץ על המפה או גרור את הסמן לבחירת מיקום מדויק</p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {locationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
