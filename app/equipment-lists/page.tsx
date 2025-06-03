"use client"

import { useState, useEffect } from "react"
import {
  ListChecks,
  Droplets,
  Pill,
  HeartHandshake,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  UsersIcon,
  ShieldCheck,
  FileText,
  Loader2,
} from "lucide-react"
import { EquipmentService } from "@/lib/services/equipment-service"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { usePageTranslation } from "@/hooks/use-translation"
import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"

// נוסיף פונקציה שתחזיר את האייקון המתאים לקטגוריה
const getCategoryIcon = (category) => {
  const icons = {
    water_food: <Droplets className="h-5 w-5 text-blue-500" />,
    medical: <Pill className="h-5 w-5 text-red-500" />,
    hygiene: <HeartHandshake className="h-5 w-5 text-green-500" />,
    lighting_energy: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    communication: <FileText className="h-5 w-5 text-purple-500" />,
    documents_money: <FileText className="h-5 w-5 text-indigo-500" />,
    children: <Baby className="h-5 w-5 text-pink-500" />,
    pets: <Cat className="h-5 w-5 text-amber-500" />,
    elderly: <UsersIcon className="h-5 w-5 text-teal-500" />,
    special_needs: <Activity className="h-5 w-5 text-cyan-500" />,
    other: <ListChecks className="h-5 w-5 text-gray-500" />,
    emergency: <ShieldCheck className="h-5 w-5 text-red-600" />,
    food: <Droplets className="h-5 w-5 text-blue-500" />,
    pet: <Cat className="h-5 w-5 text-amber-500" />,
  }

  // מיפוי קטגוריות נוספות לקטגוריות קיימות
  const categoryMapping = {
    food: "water_food",
    pet: "pets",
    emergency: "other",
  }

  // אם יש מיפוי לקטגוריה, נשתמש בו
  const mappedCategory = categoryMapping[category] || category

  return icons[mappedCategory] || icons.other
}

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
    editTitle: "ערוך כותרת",
    moreActions: "פעולות נוספות",
    noLists: "עדיין לא יצרת רשימות ציוד",
    noListsDescription: "צור את הרשימה הראשונה שלך כדי להתחיל",
    loading: "טוען רשימות ציוד...",
    items: "פריטים",
    confirmDelete: "האם אתה בטוח שברצונך למחוק רשימה זו?",
    confirmDeleteDescription: "פעולה זו תמחק את הרשימה ואת כל הפריטים שבה. לא ניתן לבטל פעולה זו.",
    cancel: "ביטול",
    delete: "מחק",
    save: "שמור",
    errorLoading: "שגיאה בטעינת רשימות הציוד",
    errorDeleting: "שגיאה במחיקת הרשימה",
    errorUpdating: "שגיאה בעדכון הרשימה",
    createdAt: "נוצר ב:",
    editTitleDialog: "ערוך כותרת רשימה",
    newTitle: "כותרת חדשה",
    titleUpdated: "הכותרת עודכנה בהצלחה",
  },
  en: {
    pageTitle: "Equipment Lists",
    pageDescription: "Manage your emergency equipment lists",
    createNewList: "Create New List",
    createWithAI: "Create with AI",
    viewList: "View List",
    editList: "Edit List",
    deleteList: "Delete List",
    editTitle: "Edit Title",
    moreActions: "More Actions",
    noLists: "You haven't created any equipment lists yet",
    noListsDescription: "Create your first list to get started",
    loading: "Loading equipment lists...",
    items: "items",
    confirmDelete: "Are you sure you want to delete this list?",
    confirmDeleteDescription: "This action will delete the list and all its items. This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    errorLoading: "Error loading equipment lists",
    errorDeleting: "Error deleting the list",
    errorUpdating: "Error updating the list",
    createdAt: "Created at:",
    editTitleDialog: "Edit List Title",
    newTitle: "New Title",
    titleUpdated: "Title updated successfully",
  },
}

export default function EquipmentListsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [equipmentLists, setEquipmentLists] = useState([])
  const [isRTL, setIsRTL] = useState(true)
  const [error, setError] = useState("")
  const [listToDelete, setListToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false)
  const [listToEdit, setListToEdit] = useState(null)
  const [newTitle, setNewTitle] = useState("")
  const [language, setLanguage] = useState("he")
  const { tp: t, ts, isTranslating } = usePageTranslation(translations)
  const { ts: ts2, isTranslating: isTranslating2 } = useTranslation()

  // Get language and direction
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)
      ts(docLang)
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [ts])

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
        setError(t("errorLoading"))
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
      setEquipmentLists(equipmentLists.filter((list) => list.id !== listToDelete.id))
    } catch (error) {
      console.error("Error deleting list:", error)
      setError(t("errorDeleting"))
    } finally {
      setListToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle edit title
  const handleEditTitle = async () => {
    if (!listToEdit || !newTitle.trim()) return

    try {
      await EquipmentService.updateList(listToEdit.id, {
        name: newTitle.trim(),
        description: listToEdit.description,
        items: [], // We're only updating the title, so we don't need to pass items
      })

      // Update the local state
      setEquipmentLists(
        equipmentLists.map((list) => (list.id === listToEdit.id ? { ...list, title: newTitle.trim() } : list)),
      )

      setIsEditTitleDialogOpen(false)
      setListToEdit(null)
      setNewTitle("")
    } catch (error) {
      console.error("Error updating title:", error)
      setError(t("errorUpdating"))
    }
  }

  // Open delete dialog
  const openDeleteDialog = (list) => {
    setListToDelete(list)
    setIsDeleteDialogOpen(true)
  }

  // Open edit title dialog
  const openEditTitleDialog = (list) => {
    setListToEdit(list)
    setNewTitle(list.title)
    setIsEditTitleDialogOpen(true)
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: language === "he" ? he : undefined })
    } catch (e) {
      return dateString
    }
  }

  // Extract family info from description (if it's JSON)
  const extractFamilyInfo = (description) => {
    try {
      const data = JSON.parse(description)
      const parts = []

      if (data.adults > 0) parts.push(`${data.adults} מבוגרים`)
      if (data.children > 0) parts.push(`${data.children} ילדים`)
      if (data.babies > 0) parts.push(`${data.babies} תינוקות`)
      if (data.elderly > 0) parts.push(`${data.elderly} קשישים`)
      if (data.pets > 0) parts.push(`${data.pets} חיות מחמד`)

      let result = parts.join(", ")
      if (data.special_needs && data.special_needs !== "לא צוין") {
        result += ` (${data.special_needs})`
      }

      return result
    } catch (e) {
      return description
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isTranslating2 && <Loader2 className="inline mr-2 h-6 w-6 animate-spin" />}
          <T>Equipment Lists</T>
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          <T>Manage your emergency equipment and supplies</T>
        </p>
      </div>

      {/* Add your equipment lists content here */}
      <div className="text-center py-16">
        <p className="text-lg text-gray-500">
          <T>Equipment lists functionality will be implemented here</T>
        </p>
      </div>
    </div>
  )
}
