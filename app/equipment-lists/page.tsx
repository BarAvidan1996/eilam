"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListChecks, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EquipmentService } from "@/lib/services/equipment-service"
import { format } from "date-fns"
import { he } from "date-fns/locale"

// Translations
const translations = {
  he: {
    pageTitle: "רשימות ציוד",
    pageDescription: "נהל את רשימות הציוד שלך למצבי חירום",
    createNewList: "צור רשימה חדשה",
    createWithAI: "צור רשימה עם AI",
    viewList: "צפה ברשימה",
    editList: "ערוך רשימה",
    deleteList: "מחק רשימה",
    noLists: "עדיין לא יצרת רשימות ציוד",
    noListsDescription: "צור את הרשימה הראשונה שלך כדי להתחיל",
    loading: "טוען רשימות ציוד...",
    items: "פריטים",
    confirmDelete: "האם אתה בטוח שברצונך למחוק רשימה זו?",
    confirmDeleteDescription: "פעולה זו תמחק את הרשימה ואת כל הפריטים שבה. לא ניתן לבטל פעולה זו.",
    cancel: "ביטול",
    delete: "מחק",
    errorLoading: "שגיאה בטעינת רשימות הציוד",
    errorDeleting: "שגיאה במחיקת הרשימה",
    createdAt: "נוצר ב:",
  },
  en: {
    pageTitle: "Equipment Lists",
    pageDescription: "Manage your emergency equipment lists",
    createNewList: "Create New List",
    createWithAI: "Create with AI",
    viewList: "View List",
    editList: "Edit List",
    deleteList: "Delete List",
    noLists: "You haven't created any equipment lists yet",
    noListsDescription: "Create your first list to get started",
    loading: "Loading equipment lists...",
    items: "items",
    confirmDelete: "Are you sure you want to delete this list?",
    confirmDeleteDescription: "This action will delete the list and all its items. This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    errorLoading: "Error loading equipment lists",
    errorDeleting: "Error deleting the list",
    createdAt: "Created at:",
  },
}

export default function EquipmentListsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [equipmentLists, setEquipmentLists] = useState([])
  const [isRTL, setIsRTL] = useState(true)
  const [error, setError] = useState("")
  const [listToDelete, setListToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [language, setLanguage] = useState("he")
  const [t, setT] = useState(translations.he)

  // Get language and direction
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)
      setT(translations[docLang] || translations.he)
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [])

  // Fetch equipment lists
  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true)
      setError("")

      try {
        const data = await EquipmentService.getEquipmentLists()
        setEquipmentLists(data || [])
      } catch (error) {
        console.error("Error fetching equipment lists:", error)
        setError(t.errorLoading)
        setEquipmentLists([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [t])

  // Handle delete list
  const handleDeleteList = async () => {
    if (!listToDelete) return

    try {
      await EquipmentService.deleteList(listToDelete.id)

      // Update the list
      setEquipmentLists(equipmentLists.filter((list) => list.id !== listToDelete.id))
    } catch (error) {
      console.error("Error deleting list:", error)
      setError(t.errorDeleting)
    } finally {
      setListToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (list) => {
    setListToDelete(list)
    setIsDeleteDialogOpen(true)
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: language === "he" ? he : undefined })
    } catch (e) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <ListChecks className="text-purple-600" /> {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{t.pageDescription}</p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>
      )}

      <div className="mb-6">
        <Link href="/equipment">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.createNewList}
          </Button>
        </Link>
      </div>

      {equipmentLists.length > 0 ? (
        <div className="space-y-4">
          {equipmentLists.map((list) => (
            <Card key={list.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-gray-100">{list.title}</h2>
                    {list.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{list.description}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {list.itemCount} {t.items}
                      </p>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.createdAt} {formatDate(list.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/equipment?listId=${list.id}`}>
                      <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600">
                        {isRTL ? <ChevronLeft className="ml-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                        {t.viewList}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => openDeleteDialog(list)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-md dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t.noLists}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.noListsDescription}</p>
            <Link href="/equipment">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.createNewList}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList} className="bg-red-600 hover:bg-red-700">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
