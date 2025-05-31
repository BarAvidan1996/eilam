"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation, Loader2, AlertTriangle } from "lucide-react"

interface LocationData {
  type: "current" | "address"
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

export function LocationSelector({ onLocationSelected, onCancel, isVisible }: LocationSelectorProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState("")
  const [locationError, setLocationError] = useState<string | null>(null)

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
          maximumAge: 300000, // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords

      // Get address from coordinates using reverse geocoding
      let displayName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}`,
        )
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          displayName = data.results[0].formatted_address
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

  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      setLocationError("אנא הזן כתובת")
      return
    }

    setLocationError(null)

    try {
      // Geocode the address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}`,
      )
      const data = await response.json()

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            בחירת מיקום לחיפוש מקלטים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">כדי למצוא מקלטים קרובים, אנחנו צריכים לדעת את המיקום שלך:</p>

          {/* Current Location Option */}
          <div className="space-y-2">
            <Button onClick={getCurrentLocation} disabled={isGettingLocation} className="w-full" variant="default">
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
            <p className="text-xs text-gray-500 text-center">המיקום שלך לא נשמר ומשמש רק לחיפוש מקלטים</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500">או</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Manual Address Option */}
          <div className="space-y-2">
            <Input
              placeholder="הזן כתובת או עיר (למשל: רחוב דיזנגוף 1, תל אביב)"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualAddress()}
              className="text-right"
            />
            <Button onClick={handleManualAddress} disabled={!manualAddress.trim()} variant="outline" className="w-full">
              חפש לפי כתובת זו
            </Button>
          </div>

          {/* Error Display */}
          {locationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {/* Cancel Button */}
          <Button onClick={onCancel} variant="ghost" className="w-full">
            ביטול
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
