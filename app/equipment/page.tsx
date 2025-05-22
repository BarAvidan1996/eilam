"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { EquipmentService } from "@/lib/services/equipment-service"
import { Spinner } from "@/components/ui/spinner"
import EquipmentPage from "../equipment-lists/equipment-page"

export default function EquipmentListPage() {
  const searchParams = useSearchParams()
  const listId = searchParams.get("listId")
  const [isLoading, setIsLoading] = useState(true)
  const [list, setList] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadList() {
      if (!listId) {
        setError("לא נמצא מזהה רשימה")
        setIsLoading(false)
        return
      }

      try {
        const listData = await EquipmentService.get(listId)
        setList(listData)
      } catch (err) {
        console.error("Error loading list:", err)
        setError("שגיאה בטעינת הרשימה")
      } finally {
        setIsLoading(false)
      }
    }

    loadList()
  }, [listId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
        <p className="mb-4">{error}</p>
        <a href="/equipment-lists" className="text-blue-600 hover:underline">
          חזרה לרשימות
        </a>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">הרשימה לא נמצאה</h1>
        <p className="mb-4">לא הצלחנו למצוא את הרשימה המבוקשת</p>
        <a href="/equipment-lists" className="text-blue-600 hover:underline">
          חזרה לרשימות
        </a>
      </div>
    )
  }

  return <EquipmentPage initialList={list} />
}
