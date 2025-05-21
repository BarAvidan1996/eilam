"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ListChecks, ChevronLeft, ChevronRight, PlusCircle, Edit3, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Translations for this page
const pageSpecificTexts = {
  he: {
    title: "כל רשימות הציוד",
    description: "נהל את כל רשימות הציוד שלך במקום אחד.",
    itemsSuffix: "פריטים",
    noListsTitle: "עדיין לא יצרת רשימות ציוד.",
    noListsDescription: "ניתן ליצור רשימות חדשות מעמוד ניהול הציוד.",
    createListButton: "צור רשימה חדשה",
    editListButton: "ערוך שם",
    deleteListButton: "מחק רשימה",
    confirmDeleteTitle: "אישור מחיקה",
    confirmDeleteDescription: 'האם אתה בטוח שברצונך למחוק את הרשימה "{listName}"? לא ניתן לשחזר פעולה זו.',
    cancel: "ביטול",
    delete: "מחק",
    editListNameTitle: "ערוך שם רשימה",
    newListNameLabel: "שם רשימה חדש",
    save: "שמור",
    loadingLists: "טוען רשימות...",
    errorLoadingLists: "שגיאה בטעינת רשימות.",
    errorDeletingList: "שגיאה במחיקת הרשימה.",
    retryButton: "נסה שוב",
    viewListTooltip: "הצג רשימה",
    editNameTooltip: "ערוך שם הרשימה",
    deleteListTooltip: "מחק רשימה",
    refreshList: "רענן רשימות",
  },
  en: {
    title: "All Equipment Lists",
    description: "Manage all your equipment lists in one place.",
    itemsSuffix: "items",
    noListsTitle: "You haven't created any equipment lists yet.",
    noListsDescription: "You can create new lists from the equipment management page.",
    createListButton: "Create New List",
    editListButton: "Edit Name",
    deleteListButton: "Delete List",
    confirmDeleteTitle: "Confirm Deletion",
    confirmDeleteDescription: 'Are you sure you want to delete the list "{listName}"? This action cannot be undone.',
    cancel: "Cancel",
    delete: "Delete",
    editListNameTitle: "Edit List Name",
    newListNameLabel: "New List Name",
    save: "Save",
    loadingLists: "Loading lists...",
    errorLoadingLists: "Error loading lists.",
    errorDeletingList: "Error deleting list.",
    retryButton: "Try Again",
    viewListTooltip: "View List",
    editNameTooltip: "Edit List Name",
    deleteListTooltip: "Delete List",
    refreshList: "Refresh Lists",
  },
  ar: {
    title: "جميع قوائم المعدات",
    description: "إدارة جميع قوائم المعدات الخاصة بك في مكان واحد.",
    itemsSuffix: "عناصر",
    noListsTitle: "لم تقم بإنشاء أي قوائم معدات حتى الآن.",
    noListsDescription: "يمكنك إنشاء قوائم جديدة من صفحة إدارة المعدات.",
    createListButton: "إنشاء قائمة جديدة",
    editListButton: "تعديل الاسم",
    deleteListButton: "حذف القائمة",
    confirmDeleteTitle: "تأكيد الحذف",
    confirmDeleteDescription: 'هل أنت متأكد أنك تريد حذف القائمة "{listName}"? لا يمكن التراجع عن هذا الإجراء.',
    cancel: "إلغاء",
    delete: "حذف",
    editListNameTitle: "تعديل اسم القائمة",
    newListNameLabel: "اسم القائمة الجديد",
    save: "حفظ",
    loadingLists: "جارٍ تحميل القوائم...",
    errorLoadingLists: "خطأ في تحميل القوائم.",
    errorDeletingList: "خطأ في حذف القائمة.",
    retryButton: "حاول مرة أخرى",
    viewListTooltip: "عرض القائمة",
    editNameTooltip: "تعديل اسم القائمة",
    deleteListTooltip: "حذف القائمة",
    refreshList: "تحديث القوائم",
  },
  ru: {
    title: "Все списки оборудования",
    description: "Управляйте всеми своими списками оборудования в одном месте.",
    itemsSuffix: "элементов",
    noListsTitle: "Вы еще не создали ни одного списка оборудования.",
    noListsDescription: "Вы можете создавать новые списки на странице управления оборудованием.",
    createListButton: "Создать новый список",
    editListButton: "Изменить название",
    deleteListButton: "Удалить список",
    confirmDeleteTitle: "Подтверждение удаления",
    confirmDeleteDescription: 'Вы уверены, что хотите удалить список "{listName}"? Это действие нельзя отменить.',
    cancel: "Отмена",
    delete: "Удалить",
    editListNameTitle: "Изменить название списка",
    newListNameLabel: "Новое название списка",
    save: "Сохранить",
    loadingLists: "Загрузка списков...",
    errorLoadingLists: "Ошибка при загрузке списков.",
    errorDeletingList: "Ошибка при удалении списка.",
    retryButton: "Повторить попытку",
    viewListTooltip: "Просмотр списка",
    editNameTooltip: "Изменить название списка",
    deleteListTooltip: "Удалить список",
    refreshList: "Обновить списки",
  },
}

// Mock data for equipment lists
const mockEquipmentLists = [
  {
    id: "1",
    name: "רשימת ציוד לחירום",
    description: "ציוד חיוני למקרה חירום",
    itemCount: 12,
    created_at: "2023-05-15T10:30:00Z",
    updated_at: "2023-05-20T14:45:00Z",
  },
  {
    id: "2",
    name: "ציוד למקלט",
    description: "פריטים שיש להחזיק במקלט",
    itemCount: 8,
    created_at: "2023-04-10T08:20:00Z",
    updated_at: "2023-05-18T11:30:00Z",
  },
  {
    id: "3",
    name: "ערכת עזרה ראשונה",
    description: "ציוד רפואי בסיסי",
    itemCount: 15,
    created_at: "2023-03-22T16:15:00Z",
    updated_at: "2023-05-10T09:20:00Z",
  },
]

export default function AllEquipmentListsPage() {
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [equipmentLists, setEquipmentLists] = useState([])
  const [error, setError] = useState(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [newListName, setNewListName] = useState("")

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState(null)

  // Get language from document only on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [])

  const t = pageSpecificTexts[language] || pageSpecificTexts.he

  // Simulate fetching lists
  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Use mock data instead of actual API call
        setEquipmentLists(mockEquipmentLists)
      } catch (err) {
        console.error("Error fetching equipment lists:", err)
        setError(t.errorLoadingLists)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [t.errorLoadingLists])

  const handleEditList = (list) => {
    setEditingList(list)
    setNewListName(list.name)
    setIsEditModalOpen(true)
  }

  const handleSaveListName = () => {
    if (!editingList || !newListName.trim()) return

    // Update locally
    setEquipmentLists(
      equipmentLists.map((list) =>
        list.id === editingList.id
          ? {
              ...list,
              name: newListName.trim(),
              updated_at: new Date().toISOString(),
            }
          : list,
      ),
    )

    setIsEditModalOpen(false)
    setEditingList(null)
  }

  const handleDeleteList = (list) => {
    setListToDelete(list)
    setIsDeleteAlertOpen(true)
  }

  const confirmDelete = () => {
    if (!listToDelete) return

    // Update locally
    setEquipmentLists(equipmentLists.filter((list) => list.id !== listToDelete.id))
    setIsDeleteAlertOpen(false)
    setListToDelete(null)
  }

  const refreshLists = () => {
    setIsLoading(true)

    // Simulate refresh
    setTimeout(() => {
      setEquipmentLists(mockEquipmentLists)
      setIsLoading(false)
    }, 1000)
  }

  if (isLoading && equipmentLists.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loadingLists}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ListChecks className="text-purple-600" /> {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{t.description}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshLists}
                disabled={isLoading}
                className="flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="dark:bg-gray-800 dark:text-gray-200">
              {t.refreshList || "רענן רשימות"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          <p>{error}</p>
          <Button onClick={refreshLists} className="mt-4">
            {t.retryButton}
          </Button>
        </div>
      )}

      {equipmentLists.length > 0 ? (
        <div className="space-y-4">
          {equipmentLists.map((list) => (
            <Card key={list.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-gray-100 break-words">
                      {list.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                      {list.description || ""}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {list.itemCount} {t.itemsSuffix}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditList(list)}
                            className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="dark:bg-gray-800 dark:text-gray-200">
                          {t.editNameTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteList(list)}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="dark:bg-gray-800 dark:text-gray-200">
                          {t.deleteListTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/equipment?listId=${list.id}&view=dashboard`} className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              {isRTL ? <ChevronLeft /> : <ChevronRight />}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="dark:bg-gray-800 dark:text-gray-200">
                          {t.viewListTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isLoading && (
          <Card className="shadow-md dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <ListChecks className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t.noListsTitle}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.noListsDescription}</p>
              <Link href="/equipment">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                  {t.createListButton}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-850">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t.editListNameTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="new-list-name" className={`${isRTL ? "text-right" : "text-left"} dark:text-gray-300`}>
                {t.newListNameLabel}
              </label>
              <Input
                id="new-list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t.cancel}
            </Button>
            <Button onClick={handleSaveListName} className="bg-purple-600 hover:bg-purple-700 text-white">
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="dark:bg-gray-850">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">{t.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              {t.confirmDeleteDescription.replace("{listName}", listToDelete?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
