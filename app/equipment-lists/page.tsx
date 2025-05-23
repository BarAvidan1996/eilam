"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ListChecks,
  FileText,
  Droplets,
  Pill,
  HeartHandshake,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  UsersIcon,
  ShieldCheck,
} from "lucide-react"
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
import { useNavigate } from "react-router-dom"
import { EquipmentList } from "@/entities/EquipmentList"
import { createPageUrl } from "@/utils"

// מיפוי קטגוריות לאייקונים
const getCategoryIcon = (category) => {
  // מיפוי קטגוריות לאייקונים
  const categoryIcons = {
    water_food: <Droplets className="h-5 w-5" />,
    medical: <Pill className="h-5 w-5" />,
    hygiene: <HeartHandshake className="h-5 w-5" />,
    lighting_energy: <Lightbulb className="h-5 w-5" />,
    communication: <FileText className="h-5 w-5" />,
    documents_money: <FileText className="h-5 w-5" />,
    children: <Baby className="h-5 w-5" />,
    pets: <Cat className="h-5 w-5" />,
    elderly: <UsersIcon className="h-5 w-5" />,
    special_needs: <Activity className="h-5 w-5" />,
    other: <ListChecks className="h-5 w-5" />,
    emergency: <ShieldCheck className="h-5 w-5" />,
    food: <Droplets className="h-5 w-5" />,
    pet: <Cat className="h-5 w-5" />,
  }

  // מיפוי קטגוריות נוספות לקטגוריות קיימות
  const categoryMapping = {
    food: "water_food",
    pet: "pets",
    emergency: "other",
  }

  // אם יש מיפוי לקטגוריה, נשתמש בו
  const mappedCategory = categoryMapping[category] || category

  return categoryIcons[mappedCategory] || categoryIcons.other
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
    printList: "הדפס רשימה",
    exportList: "ייצא רשימה",
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
    exportToPDF: "ייצא ל-PDF",
    exportToExcel: "ייצא ל-Excel",
    exportToText: "ייצא לטקסט",
  },
  en: {
    pageTitle: "Equipment Lists",
    pageDescription: "Manage your emergency equipment lists",
    createNewList: "Create New List",
    createWithAI: "Create with AI",
    viewList: "View List",
    editList: "Edit List",
    deleteList: "Delete List",
    printList: "Print List",
    exportList: "Export List",
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
    exportToPDF: "Export to PDF",
    exportToExcel: "Export to Excel",
    exportToText: "Export to Text",
  },
}

export default function EquipmentListsPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRTL, setIsRTL] = useState(true)
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
      try {
        const data = await EquipmentList.getAll()
        setLists(data)
      } catch (err) {
        console.error("Error fetching equipment lists:", err)
        setError("Failed to load equipment lists")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [])

  const handleListClick = (listId) => {
    navigate(createPageUrl("EquipmentPage") + "?listId=" + listId)
  }

  const handleCreateList = () => {
    navigate(createPageUrl("EquipmentPage"))
  }

  // Handle delete list
  const handleDeleteList = async () => {
    if (!listToDelete) return

    try {
      await EquipmentService.deleteList(listToDelete.id)
      setLists(lists.filter((list) => list.id !== listToDelete.id))
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
      setLists(lists.map((list) => (list.id === listToEdit.id ? { ...list, title: newTitle.trim() } : list)))

      setIsEditTitleDialogOpen(false)
      setListToEdit(null)
      setNewTitle("")
    } catch (error) {
      console.error("Error updating title:", error)
      setError(t.errorUpdating)
    }
  }

  // Handle print list
  const handlePrintList = (list) => {
    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <html>
        <head>
          <title>${list.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .meta { color: #666; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>${list.title}</h1>
          <div class="meta">
            <p>${t.createdAt} ${formatDate(list.created_at)}</p>
            <p>${list.itemCount} ${t.items}</p>
          </div>
          ${list.description ? `<p><strong>תיאור:</strong> ${list.description}</p>` : ""}
          <div class="summary">
            <p>רשימה זו נוצרה באפליקציה לניהול ציוד חירום</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Handle export to text
  const handleExportToText = (list) => {
    const content = `${list.title}
${"=".repeat(list.title.length)}

${t.createdAt} ${formatDate(list.created_at)}
${list.itemCount} ${t.items}

${
  list.description
    ? `תיאור: ${list.description}

`
    : ""
}נוצר באפליקציה לניהול ציוד חירום`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${list.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">רשימות ציוד חירום</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">צור, ערוך ונהל רשימות ציוד חיוני למצבי חירום.</p>

      <div className="mb-6">
        <button onClick={handleCreateList} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4">
          צור רשימה חדשה
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">הרשימות שלי</h2>

      {lists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">עדיין לא יצרת רשימות ציוד.</p>
          <p className="text-gray-600 dark:text-gray-400">לחץ על 'צור רשימה חדשה' כדי להתחיל.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              onClick={() => handleListClick(list.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{list.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{list.items?.length || 0} פריטים</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(list.updatedAt || list.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
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
            <Button onClick={handleEditTitle} disabled={!newTitle.trim()}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
