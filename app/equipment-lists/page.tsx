"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ListChecks,
  PlusCircle,
  Trash2,
  Edit,
  Droplets,
  Pill,
  HeartHandshake,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  UsersIcon,
  ShieldCheck,
  Eye,
  FileText,
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EquipmentService } from "@/lib/services/equipment-service"
import { format } from "date-fns"
import { he } from "date-fns/locale"

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
      setEquipmentLists(equipmentLists.filter((list) => list.id !== listToDelete.id))
    } catch (error) {
      console.error("Error deleting list:", error)
      setError(t.errorDeleting)
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
      setError(t.errorUpdating)
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
          <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-black">
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
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-[#005c72] dark:text-gray-100 mb-2">{list.title}</h2>
                    {list.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {extractFamilyInfo(list.description)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {list.itemCount} {t.items}
                      </p>
                      <span className="text-gray-400">•</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.createdAt} {formatDate(list.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                    {/* View List Button */}
                    <Link href={`/equipment?listId=${list.id}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-[#005c72] hover:bg-[#004a5d] text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-gray-800 border-none"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        <span>{t.viewList}</span>
                      </Button>
                    </Link>

                    {/* Edit Title Button */}
                    <Button variant="outline" size="sm" onClick={() => openEditTitleDialog(list)} className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      <span>{t.editTitle}</span>
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(list)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white dark:border-red-600 dark:hover:border-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t.deleteList}</span>
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
              <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-black">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.createNewList}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
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

      {/* Edit Title Dialog */}
      <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.editTitleDialog}</DialogTitle>
            <DialogDescription>שנה את כותרת הרשימה לכותרת חדשה</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {t.newTitle}
              </Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTitleDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleEditTitle}
              disabled={!newTitle.trim()}
              className="bg-[#005c72] hover:bg-[#004a5d] text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-black"
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
