"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ListChecks, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for equipment lists
const mockEquipmentLists = [
  {
    id: "1",
    name: "רשימת ציוד לחירום",
    description: "ציוד חיוני למקרה חירום",
    itemCount: 12,
  },
  {
    id: "2",
    name: "ציוד למקלט",
    description: "פריטים שיש להחזיק במקלט",
    itemCount: 8,
  },
  {
    id: "3",
    name: "ערכת עזרה ראשונה",
    description: "ציוד רפואי בסיסי",
    itemCount: 15,
  },
]

export default function EquipmentPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [equipmentLists, setEquipmentLists] = useState([])
  const [isRTL, setIsRTL] = useState(true)

  // Simulate fetching lists
  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true)

      // Simulate API call delay
      setTimeout(() => {
        setEquipmentLists(mockEquipmentLists)
        setIsLoading(false)
      }, 1000)
    }

    fetchLists()
  }, [])

  // Get RTL direction on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">טוען רשימות ציוד...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <ListChecks className="text-purple-600" /> רשימות ציוד
        </h1>
        <p className="text-gray-600 dark:text-gray-300">נהל את רשימות הציוד שלך למצבי חירום</p>
      </header>

      {equipmentLists.length > 0 ? (
        <div className="space-y-4">
          {equipmentLists.map((list) => (
            <Card key={list.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-gray-100">{list.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{list.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{list.itemCount} פריטים</p>
                  </div>
                  <Link href={`/equipment/${list.id}`} className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600">
                      {isRTL ? <ChevronLeft className="ml-1" /> : <ChevronRight className="mr-1" />}
                      צפה ברשימה
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-md dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">עדיין לא יצרת רשימות ציוד</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">צור את הרשימה הראשונה שלך כדי להתחיל</p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="ml-2 h-4 w-4" />
              צור רשימה חדשה
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
