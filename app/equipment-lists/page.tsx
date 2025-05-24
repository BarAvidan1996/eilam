"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ListChecks, ChevronLeft, ChevronRight, PlusCircle, Edit3, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Spinner } from "@/components/ui/spinner"

// Force dynamic rendering to prevent document access during SSR
export const dynamic = "force-dynamic"

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

  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Get language from document only on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [])

  const t = pageSpecificTexts[language] || pageSpecificTexts.he

  const fetchLists = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the current user's ID
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("User not authenticated")
      }

      // Fetch equipment lists
      const { data: lists, error: listsError } = await supabase
        .from("equipment_list")
        .select("id, title, description, created_at, updated_at")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })

      if (listsError) throw listsError

      // For each list, fetch the count of items
      const listsWithItemCounts = await Promise.all(
        lists.map(async (list) => {
          const { count, error: countError } = await supabase
            .from("equipment_items")
            .select("id", { count: "exact", head: true })
            .eq("list_id", list.id)

          if (countError) throw countError

          return {
            ...list,
            itemCount: count || 0,
          }
        }),
      )

      setEquipmentLists(listsWithItemCounts)
    } catch (err) {
      console.error("AllEquipmentListsPage: Error fetching equipment lists:", err)
      setError(t.errorLoadingLists)
    } finally {
      setIsLoading(false)
    }
  }

  // Check for refresh parameter when searchParams changes
  useEffect(() => {
    fetchLists()
  }, [searchParams])

  const handleEditList = (list) => {
    setEditingList(list)
    setNewListName(list.title)
    setIsEditModalOpen(true)
  }

  const handleSaveListName = async () => {
    if (!editingList || !newListName.trim()) return

    try {
      const { error } = await supabase
        .from("equipment_list")
        .update({
          title: newListName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingList.id)

      if (error) throw error

      // Update locally
      setEquipmentLists(
        equipmentLists.map((list) =>
          list.id === editingList.id
            ? {
                ...list,
                title: newListName.trim(),
                updated_at: new Date().toISOString(),
              }
            : list,
        ),
      )

      setIsEditModalOpen(false)
      setEditingList(null)
    } catch (err) {
      console.error("Error updating list name:", err)
    }
  }

  const handleDeleteList = (list) => {
    setListToDelete(list)
    setIsDeleteAlertOpen(true)
  }

  const confirmDelete = async () => {
    if (!listToDelete) return
    setError(null)

    try {
      // First delete all items in the list
      const { error: itemsError } = await supabase.from("equipment_items").delete().eq("list_id", listToDelete.id)

      if (itemsError) throw itemsError

      // Then delete the list itself
      const { error: listError } = await supabase.from("equipment_list").delete().eq("id", listToDelete.id)

      if (listError) throw listError

      // Update locally
      setEquipmentLists(equipmentLists.filter((list) => list.id !== listToDelete.id))
    } catch (err) {
      console.error("Error deleting list:", err)
      setError(t.errorDeletingList)
    } finally {
      setIsDeleteAlertOpen(false)
      setListToDelete(null)
    }
  }

  if (isLoading && equipmentLists.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" className="mx-auto mb-4" />
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
              <Button variant="outline" size="icon" onClick={fetchLists} disabled={isLoading} className="flex-shrink-0">
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
          <Button onClick={fetchLists} className="mt-4">
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
                      {list.title}
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

      <style jsx global>{`
        .dark .card h2, 
        .dark h2.text-purple-700 {
          color: #f9fafb !important;
        }
      `}</style>

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
              {t.confirmDeleteDescription.replace("{listName}", listToDelete?.title || "")}
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
