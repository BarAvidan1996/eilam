"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation, Trash2, Edit2, Check, Home, Briefcase, Share2, Star, Search } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ShelterMap from "@/components/map/shelter-map"
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
import { favoriteShelterService, type FavoriteShelter } from "@/lib/services/favorite-shelter-service"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// תרגומים לפי שפה
const translations = {
  he: {
    title: "מקלטים מועדפים",
    description: "רשימת המקלטים ששמרת לגישה מהירה.",
    noFavorites: "עדיין לא הוספת מקלטים מועדפים.",
    addFavorites: "ניתן להוסיף מקלטים מועדפים מעמוד איתור המקלטים.",
    findShelters: "לחיפוש מקלטים",
    navigateToShelter: "נווט למקלט",
    editShelterDetails: "עריכת פרטי מקלט",
    shelterName: "שם המקלט",
    shelterNamePlaceholder: "לדוגמה: מקלט בניין המשרדים",
    tag: "תגית",
    selectTagPlaceholder: "בחר תגית",
    tagHome: "בית",
    tagWork: "עבודה",
    tagOther: "אחר (הזן תגית מותאמת אישית)",
    customTag: "תגית מותאמת אישית",
    customTagPlaceholder: "לדוגמה: בית הורים, גן ילדים",
    cancel: "ביטול",
    saveChanges: "שמור שינויים",
    shareShelter: "שתף מקלט",
    share: "שתף",
    copyLink: "העתק קישור",
    linkCopied: "הקישור הועתק!",
    linkOpensGoogleMaps: "*הקישור יפתח את המקלט בגוגל מפות",
    editShelterTooltip: "ערוך מקלט",
    shareShelterTooltip: "שתף מקלט",
    removeFromFavoritesTooltip: "הסר ממועדפים",
    myShelters: "המקלטים שלי",
    loading: "טוען...",
    shareText: "מצאתי מקלט באזור – הנה קישור עם ניווט:",
    shelter: "מקלט",
    selectShelterFromList: "בחר מקלט מהרשימה",
    selectShelterToShowOnMap: "בחר אחד מהמקלטים המועדפים שלך כדי לראות אותו במפה",
    deleteConfirmTitle: "מחיקת מקלט מועדף",
    deleteConfirmMessage: "האם אתה בטוח שברצונך למחוק את המקלט מרשימת המועדפים שלך? פעולה זו לא ניתנת לביטול.",
    deleteButton: "מחק",
    cancelButton: "ביטול",
    updateSuccess: "פרטי המקלט עודכנו בהצלחה",
    deleteSuccess: "המקלט הוסר מהמועדפים בהצלחה",
    updateError: "אירעה שגיאה בעדכון פרטי המקלט",
    deleteError: "אירעה שגיאה בהסרת המקלט מהמועדפים",
    saving: "שומר שינויים...",
    deleting: "מוחק...",
  },
  en: {
    title: "Favorite Shelters",
    description: "List of shelters you've saved for quick access.",
    noFavorites: "You haven't added any favorite shelters yet.",
    addFavorites: "You can add favorite shelters from the shelter locator page.",
    findShelters: "Find Shelters",
    navigateToShelter: "Navigate to Shelter",
    editShelterDetails: "Edit Shelter Details",
    shelterName: "Shelter Name",
    shelterNamePlaceholder: "Example: Office Building Shelter",
    tag: "Tag",
    selectTagPlaceholder: "Select a tag",
    tagHome: "Home",
    tagWork: "Work",
    tagOther: "Other (Enter custom tag)",
    customTag: "Custom Tag",
    customTagPlaceholder: "Example: Parents' House, Kindergarten",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    shareShelter: "Share Shelter",
    share: "Share",
    copyLink: "Copy Link",
    linkCopied: "Link Copied!",
    linkOpensGoogleMaps: "*The link will open the shelter in Google Maps",
    editShelterTooltip: "Edit Shelter",
    shareShelterTooltip: "Share Shelter",
    removeFromFavoritesTooltip: "Remove from Favorites",
    myShelters: "My Shelters",
    loading: "Loading...",
    shareText: "I found a shelter in the area - here's a navigation link:",
    shelter: "Shelter",
    selectShelterFromList: "Select a shelter from the list",
    selectShelterToShowOnMap: "Select one of your favorite shelters to see it on the map",
    deleteConfirmTitle: "Delete Favorite Shelter",
    deleteConfirmMessage:
      "Are you sure you want to remove this shelter from your favorites? This action cannot be undone.",
    deleteButton: "Delete",
    cancelButton: "Cancel",
    updateSuccess: "Shelter details updated successfully",
    deleteSuccess: "Shelter removed from favorites successfully",
    updateError: "An error occurred while updating shelter details",
    deleteError: "An error occurred while removing the shelter from favorites",
    saving: "Saving changes...",
    deleting: "Deleting...",
  },
  ar: {
    title: "الملاجئ المفضلة",
    description: "قائمة الملاجئ التي حفظتها للوصول السريع.",
    noFavorites: "لم تضف أي ملاجئ مفضلة بعد.",
    addFavorites: "يمكنك إضافة ملاجئ مفضلة من صفحة محدد الملاجئ.",
    findShelters: "البحث عن ملاجئ",
    navigateToShelter: "التنقل إلى الملجأ",
    editShelterDetails: "تعديل تفاصيل الملجأ",
    shelterName: "اسم الملجأ",
    shelterNamePlaceholder: "مثال: ملجأ مبنى المكاتب",
    tag: "علامة",
    selectTagPlaceholder: "اختر علامة",
    tagHome: "المنزل",
    tagWork: "العمل",
    tagOther: "أخرى (أدخل علامة مخصصة)",
    customTag: "علامة مخصصة",
    customTagPlaceholder: "مثال: منزل الوالدين، روضة الأطفال",
    cancel: "إلغاء",
    saveChanges: "حفظ التغييرات",
    shareShelter: "مشاركة الملجأ",
    share: "مشاركة",
    copyLink: "نسخ الرابط",
    linkCopied: "تم نسخ الرابط!",
    linkOpensGoogleMaps: "*سيفتح الرابط الملجأ في خرائط جوجل",
    editShelterTooltip: "تعديل الملجأ",
    shareShelterTooltip: "مشاركة الملجأ",
    removeFromFavoritesTooltip: "إزالة من المفضلة",
    myShelters: "ملاجئي",
    loading: "جارٍ التحميل...",
    shareText: "وجدت ملجأ في المنطقة - إليك رابط التنقل:",
    shelter: "ملجأ",
    selectShelterFromList: "اختر ملجأ من القائمة",
    selectShelterToShowOnMap: "اختر أحد ملاجئك المفضلة لرؤيته على الخريطة",
    deleteConfirmTitle: "حذف الملجأ المفضل",
    deleteConfirmMessage: "هل أنت متأكد أنك تريد إزالة هذا الملجأ من المفضلة؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteButton: "حذف",
    cancelButton: "إلغاء",
    updateSuccess: "تم تحديث تفاصيل الملجأ بنجاح",
    deleteSuccess: "تمت إزالة الملجأ من المفضلة بنجاح",
    updateError: "حدث خطأ أثناء تحديث تفاصيل الملجأ",
    deleteError: "حدث خطأ أثناء إزالة الملجأ من المفضلة",
    saving: "جاري حفظ التغييرات...",
    deleting: "جاري الحذف...",
  },
  ru: {
    title: "Избранные убежища",
    description: "Список убежищ, которые вы сохранили для быстрого доступа.",
    noFavorites: "Вы еще не добавили избранные убежища.",
    addFavorites: "Вы можете добавить избранные убежища со страницы поиска убежищ.",
    findShelters: "Найти убежища",
    navigateToShelter: "Навигация к убежищу",
    editShelterDetails: "Редактировать детали убежища",
    shelterName: "Название убежища",
    shelterNamePlaceholder: "Пример: Убежище офисного здания",
    tag: "Тег",
    selectTagPlaceholder: "Выберите тег",
    tagHome: "Дом",
    tagWork: "Работа",
    tagOther: "Другое (Введите пользовательский тег)",
    customTag: "Пользовательский тег",
    customTagPlaceholder: "Пример: Дом родителей, Детский сад",
    cancel: "Отмена",
    saveChanges: "Сохранить изменения",
    shareShelter: "Поделиться убежищем",
    share: "Поделиться",
    copyLink: "Копировать ссылку",
    linkCopied: "Ссылка скопирована!",
    linkOpensGoogleMaps: "*Ссылка откроет убежище в Google Maps",
    editShelterTooltip: "Редактировать убежище",
    shareShelterTooltip: "Поделиться убежищем",
    removeFromFavoritesTooltip: "Удалить из избранного",
    myShelters: "Мои убежища",
    loading: "Загрузка...",
    shareText: "Я нашел убежище в этом районе - вот ссылка для навигации:",
    shelter: "Убежище",
    selectShelterFromList: "Выберите убежище из списка",
    selectShelterToShowOnMap: "Выберите одно из ваших избранных убежищ, чтобы увидеть его на карте",
    deleteConfirmTitle: "Удалить избранное убежище",
    deleteConfirmMessage: "Вы уверены, что хотите удалить это убежище из избранного? Это действие нельзя отменить.",
    deleteButton: "Удалить",
    cancelButton: "Отмена",
    updateSuccess: "Детали убежища успешно обновлены",
    deleteSuccess: "Убежище успешно удалено из избранного",
    updateError: "Произошла ошибка при обновлении деталей убежища",
    deleteError: "Произошла ошибка при удалении убежища из избранного",
    saving: "Сохранение изменений...",
    deleting: "Удаление...",
  },
}

export default function FavoriteSheltersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteShelter[]>([])
  const [selectedShelter, setSelectedShelter] = useState<FavoriteShelter | null>(null)
  const [deletingShelter, setDeletingShelter] = useState<string | null>(null)
  const [editingShelter, setEditingShelter] = useState<FavoriteShelter | null>(null)
  const [selectedLabel, setSelectedLabel] = useState("בית")
  const [customLabel, setCustomLabel] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const [shelterToDelete, setShelterToDelete] = useState<FavoriteShelter | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // הוסף את זה אחרי ההגדרות של useState
  const supabase = createClientComponentClient()

  // בדיקת חיבור משתמש
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      console.log("Current user:", user)
      if (!user) {
        console.log("No user found, redirecting to login")
        // אפשר להוסיף redirect לדף התחברות
      }
    }
    checkUser()
  }, [])

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
    setIsRTL(lang === "he" || lang === "ar")
  }, [])

  const t = translations[language as keyof typeof translations] || translations.he

  // טעינת מקלטים מועדפים
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true)
      try {
        const favs = await favoriteShelterService.list()
        setFavorites(favs)

        if (favs.length > 0) {
          setSelectedShelter(favs[0])
        }
      } catch (error) {
        console.error("Error loading favorites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const removeFavorite = async (shelter: FavoriteShelter) => {
    if (!shelter.place_id) return

    setDeletingShelter(shelter.place_id)
    try {
      console.log("Deleting shelter:", shelter)

      await favoriteShelterService.delete(shelter.place_id)

      console.log("Successfully deleted shelter from service")

      const updatedFavorites = favorites.filter((f) => f.place_id !== shelter.place_id)
      setFavorites(updatedFavorites)

      if (selectedShelter && selectedShelter.place_id === shelter.place_id) {
        setSelectedShelter(updatedFavorites.length > 0 ? updatedFavorites[0] : null)
      }

      setShelterToDelete(null)

      // הודעת הצלחה
      toast({
        title: t.deleteSuccess,
        variant: "default",
      })
    } catch (error) {
      console.error("שגיאה במחיקת מועדף:", error)

      // הודעת שגיאה
      toast({
        title: t.deleteError,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDeletingShelter(null)
    }
  }

  const navigateToGoogleMaps = (shelter: FavoriteShelter, event?: React.MouseEvent) => {
    if (event) event.stopPropagation()
    if (!shelter.location) return

    const url = `https://www.google.com/maps/dir/?api=1&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`
    window.open(url, "_blank")
  }

  const generateShareLink = (shelter: FavoriteShelter) => {
    if (!shelter.location) return ""

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${shelter.location.lat},${shelter.location.lng}`
    return mapsUrl
  }

  const generateShareText = (shelter: FavoriteShelter) => {
    if (!shelter.location) return ""

    const shelterName = shelter.name || t.shelter || "מקלט"
    const labelText = shelter.label === "אחר" && shelter.custom_label ? shelter.custom_label : shelter.label || ""
    const labelPart = labelText ? ` (${labelText})` : ""

    const mapsUrl = generateShareLink(shelter)
    return `${t.shareText || "מצאתי מקלט באזור – הנה קישור עם ניווט:"}\n"${shelterName}${labelPart}"\n${mapsUrl}`
  }

  const copyShareLink = (shelter: FavoriteShelter) => {
    const shareText = generateShareLink(shelter) // Just the link itself
    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedLink(shelter.place_id || null)

      // Clear the "copied" status after 2 seconds
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current)
      }

      shareTimeoutRef.current = setTimeout(() => {
        setCopiedLink(null)
      }, 2000)
    })
  }

  const shareShelter = async (shelter: FavoriteShelter) => {
    const shareText = generateShareText(shelter) // Full text for sharing
    const shareUrl = generateShareLink(shelter)

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t.shelter || "מקלט"}: ${shelter.name}`,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.log("שגיאה בשיתוף:", error)
        // In case of error, copy to clipboard
        copyShareLink(shelter)
      }
    } else {
      // If Web Share API is not supported, copy to clipboard
      copyShareLink(shelter)
    }
  }

  const openEditDialog = (shelter: FavoriteShelter) => {
    setEditingShelter({ ...shelter })
    setSelectedLabel(shelter.label || "בית")
    setCustomLabel(shelter.custom_label || "")
    setIsDialogOpen(true)
  }

  const saveEditDialog = async () => {
    if (!editingShelter || !editingShelter.place_id) return

    setIsSaving(true)
    try {
      console.log("Saving shelter changes:", editingShelter)

      const updatedShelter = {
        ...editingShelter,
        label: selectedLabel,
        custom_label: selectedLabel === "אחר" ? customLabel : "",
      }

      console.log("Updated shelter data to save:", updatedShelter)

      const result = await favoriteShelterService.update(editingShelter.place_id, updatedShelter)

      console.log("Update result:", result)

      // Update the UI
      setFavorites(favorites.map((s) => (s.place_id === editingShelter.place_id ? result : s)))

      if (selectedShelter && selectedShelter.place_id === editingShelter.place_id) {
        setSelectedShelter(result)
      }

      // הודעת הצלחה
      toast({
        title: t.updateSuccess,
        variant: "default",
      })

      setIsDialogOpen(false)
      setEditingShelter(null)
    } catch (error) {
      console.error("שגיאה בעדכון פרטי מקלט:", error)

      // הודעת שגיאה
      toast({
        title: t.updateError,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to get badge icon based on label
  const getLabelIcon = (label?: string) => {
    if (label === "בית") return <Home className="w-3.5 h-3.5 mr-1" />
    if (label === "עבודה") return <Briefcase className="w-3.5 h-3.5 mr-1" />
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Star className="text-yellow-500 fill-current" />
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{t.description}</p>
        </header>

        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.noFavorites}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t.addFavorites}</p>
            <Link
              href="/shelters"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Search size={18} />
              <span>{t.findShelters}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-800 dark:text-white">{t.myShelters}</h2>
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  {favorites.map((shelter) => (
                    <div
                      key={shelter.place_id}
                      className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${
                        selectedShelter && selectedShelter.place_id === shelter.place_id
                          ? "bg-purple-50 dark:bg-purple-900/20"
                          : ""
                      }`}
                      onClick={() => setSelectedShelter(shelter)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 dark:text-white">{shelter.name || t.shelter}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{shelter.address}</p>
                          {shelter.label && (
                            <Badge variant="outline" className="mt-2 flex items-center">
                              {getLabelIcon(shelter.label)}
                              {shelter.label === "אחר" && shelter.custom_label ? shelter.custom_label : shelter.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1 rtl:space-x-reverse">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-purple-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditDialog(shelter)
                                  }}
                                >
                                  <Edit2 size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.editShelterTooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    shareShelter(shelter)
                                  }}
                                >
                                  <Share2 size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.shareShelterTooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                                  disabled={deletingShelter === shelter.place_id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShelterToDelete(shelter)
                                  }}
                                >
                                  {deletingShelter === shelter.place_id ? (
                                    <div className="h-4 w-4 border-2 border-t-transparent border-red-500 rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.removeFromFavoritesTooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedShelter ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="relative w-full h-[400px] rounded-t-lg overflow-hidden">
                    <ShelterMap
                      center={selectedShelter.location}
                      radius={400}
                      markers={[
                        {
                          position: selectedShelter.location,
                          title: selectedShelter.name || t.shelter,
                          content: `
                            <div dir="rtl" style="padding: 8px; min-width: 200px;">
                              <strong>${selectedShelter.name || t.shelter}</strong>
                              <p>${selectedShelter.address}</p>
                            </div>
                          `,
                        },
                      ]}
                      height="100%"
                      googleMapsApiKey="AIzaSyDlvoVefGENQCOvIzwq52QZi8LSHT27b1Y"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                          {selectedShelter.name || t.shelter}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{selectedShelter.address}</p>
                        {selectedShelter.label && (
                          <Badge variant="outline" className="mt-2 flex items-center">
                            {getLabelIcon(selectedShelter.label)}
                            {selectedShelter.label === "אחר" && selectedShelter.custom_label
                              ? selectedShelter.custom_label
                              : selectedShelter.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="default"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => navigateToGoogleMaps(selectedShelter)}
                    >
                      <Navigation className="mr-2" size={16} />
                      {t.navigateToShelter}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center justify-center p-8 h-full">
                  <Star className="text-gray-300 w-16 h-16 mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 dark:text-white">{t.selectShelterFromList}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mt-2">{t.selectShelterToShowOnMap}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit shelter dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSaving && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-md w-[95%] max-w-[95%] sm:w-auto">
          <DialogHeader>
            <DialogTitle>{t.editShelterDetails}</DialogTitle>
            <DialogDescription>{editingShelter?.address}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="shelterName">{t.shelterName}</Label>
              <Input
                id="shelterName"
                placeholder={t.shelterNamePlaceholder}
                value={editingShelter?.name || ""}
                onChange={(e) => setEditingShelter({ ...editingShelter, name: e.target.value } as FavoriteShelter)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shelterTag">{t.tag}</Label>
              <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t.selectTagPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="בית" className="flex items-center">
                    <div className="flex items-center">
                      <Home className="w-4 h-4 mr-2" />
                      {t.tagHome}
                    </div>
                  </SelectItem>
                  <SelectItem value="עבודה" className="flex items-center">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {t.tagWork}
                    </div>
                  </SelectItem>
                  <SelectItem value="אחר">{t.tagOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedLabel === "אחר" && (
              <div>
                <Label htmlFor="customTag">{t.customTag}</Label>
                <Input
                  id="customTag"
                  placeholder={t.customTagPlaceholder}
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {t.cancel}
            </Button>
            <Button
              onClick={saveEditDialog}
              disabled={isSaving}
              className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#B8D4F1] dark:text-gray-900"
            >
              {isSaving ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  {t.saving}
                </>
              ) : (
                t.saveChanges
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share shelter dialog */}
      <Dialog open={!!copiedLink} onOpenChange={() => setCopiedLink(null)}>
        <DialogContent className="sm:max-w-md w-[95%] max-w-[95%] sm:w-auto">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                {t.linkCopied}
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">{t.linkOpensGoogleMaps}</p>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!shelterToDelete}
        onOpenChange={(open) => !deletingShelter && setShelterToDelete(open ? shelterToDelete : null)}
      >
        <AlertDialogContent className="w-[95%] max-w-[95%] sm:max-w-[350px] mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel disabled={!!deletingShelter}>{t.cancelButton}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => shelterToDelete && removeFavorite(shelterToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!deletingShelter}
            >
              {deletingShelter ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  {t.deleting}
                </>
              ) : (
                t.deleteButton
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
