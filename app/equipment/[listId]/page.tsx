"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EquipmentService } from "@/lib/services/equipment-service"
import {
  AlertTriangle,
  ListChecks,
  Lightbulb,
  ShieldCheck,
  Baby,
  Cat,
  Activity,
  Pill,
  HeartHandshake,
  UsersIcon,
  RotateCcw,
  Sparkles,
  FileText,
  Droplets,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Base translations
const baseTranslations = {
  he: {
    pageTitle: "ניהול ציוד חירום",
    pageDescription: "צור, ערוך ונהל רשימות ציוד חיוני למצבי חירום.",
    createListAI: "צור רשימה עם AI",
    createListManual: "צור רשימה ידנית",
    myLists: "הרשימות שלי",
    noListsYet: "עדיין לא יצרת רשימות ציוד.",
    noListsYetDescription: "לחץ על 'צור רשימה ידנית' או 'צור רשימה עם AI' כדי להתחיל.",
    selectListPrompt: "בחר רשימה להצגה או צור אחת חדשה.",
    createNewListButtonPrompt: "צור רשימה חדשה",
    exportList: "ייצוא רשימה",
    editListDetails: "ערוך פרטי רשימה",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "קטגוריה:",
    expiryLabel: "תפוגה:",
    addItemToList: "הוסף פריט לרשימה",
    reminders: "תזכורות",
    deleteItem: "מחק פריט",
    createListModalTitle: "יצירת רשימה חדשה",
    listNameLabel: "שם הרשימה",
    listDescriptionLabel: "תיאור (אופציונלי)",
    cancel: "ביטול",
    createList: "צור רשימה",
    aiModalTitle: "יצירת רשימת ציוד חכמה עם AI",
    aiPromptDescription: "ספר על עצמך ועל משק הבית שלך כדי שנוכל להתאים את רשימת הציוד המומלצת עבורך.",
    aiPromptPlaceholder:
      "לדוגמה: אני גר בדירה עם בעלי וילדה בת 5. יש לנו חתול. אני אדם עם מוגבלות בניידות ואני משתמש בהליכון. אנחנו גרים בקומה 2 ללא מעלית.",
    aiGenerateButton: "צור המלצות AI",
    aiGenerating: "יוצר רשימה מותאמת אישית...",
    aiItemsTitle: "פריטים מומלצים על ידי AI",
    aiListNamePlaceholder: "לדוגמה: רשימת חירום חכמה למשפחה",
    aiSaveList: "שמור רשימה מומלצת",
    aiSavedSuccess: "הרשימה נשמרה בהצלחה!",
    aiGoToList: "עבור לרשימה",
    aiBack: "חזור",
    aiFamilyComposition: "מאפייני בני הבית",
    aiAdults: "מבוגרים",
    aiChildren: "ילדים",
    aiBabies: "תינוקות",
    aiPets: "חיות מחמד",
    aiSpecialNeeds: "צרכים מיוחדים",
    aiNeedsAttention: "צריך תשומת לב",
    aiCategories: {
      water_food: "מים ומזון",
      medical: "ציוד רפואי",
      hygiene: "היגיינה",
      lighting_energy: "תאורה ואנרגיה",
      communication: "תקשורת",
      documents_money: "מסמכים וכסף",
      children: "ילדים",
      pets: "חיות מחמד",
      elderly: "קשישים",
      special_needs: "צרכים מיוחדים",
      other: "ציוד כללי",
      essential: "הכרחי",
      very_important: "חשוב מאוד",
      important: "חשוב",
      recommended: "מומלץ",
      optional: "אופציונלי",
      recommended_quantity_per_person_label: "כמות מומלצת לאדם",
      usage_instructions_label: "הוראות שימוש",
      shelf_life_label: "חיי מדף",
      default_unit: "יחידות",
    },
    categories: ["מים ומזון", "רפואה והיגיינה", "תאורה ואנרגיה", "תקשורת", "מסמכים וכסף", "ביגוד ושונות"],
    summaryTitle: "סיכום הציוד שלך",
    categoriesCount: "קטגוריות",
    totalReadiness: "מוכנות כוללת",
    missingEssentialItems: "הכרחיים חסרים",
    itemsChecked: "פריטים שנבדקו",
    backToAI: "חזור ליצירת רשימה",
    missingEssentialItemsTitle: "פריטים הכרחיים חסרים",
    andMoreMissing: "ועוד {count} פריטים הכרחיים חסרים...",
    allItemsTitle: "כל הפריטים ברשימה",
    searchItemPlaceholder: "חפש פריט...",
    categoryFilterPlaceholder: "קטגוריה",
    allCategories: "כל הקטגוריות",
    importanceFilterPlaceholder: "חשיבות",
    allLevels: "כל הרמות",
    clearFiltersButton: "נקה",
    noItemsFound: "לא נמצאו פריטים התואמים את החיפוש",
    showAllItemsButton: "הצג את כל הפריטים",
    description: "תיאור",
    quantity: "כמות",
    important: "חשוב",
    durationHours: "משך זמן (שעות)",
    moreEssentialsMissing: "יש לרכוש {count} פריטים הכרחיים נוספים לשלמות הציוד",
    editList: "ערוך רשימה",
    cancelEditing: "צא מעריכה",
    addItem: "הוסף פריט",
    saveChanges: "שמור שינויים",
    addNewItem: "הוספת פריט חדש",
    itemName: "שם הפריט",
    itemCategory: "קטגוריה",
    itemQuantity: "כמות",
    itemUnit: "יחידת מידה",
    itemImportance: "חשיבות",
    itemDescription: "תיאור",
    itemShelfLife: "חיי מדף",
    itemUsageInstructions: "הוראות שימוש",
    itemRecommendedQuantity: "כמות מומלצת לאדם",
    add: "הוסף",
    undoAction: "בטל פעולה אחרונה",
    removeItem: "הסר פריט",
    removeItemConfirm: "האם אתה בטוח שברצונך להסיר את הפריט?",
    removeItemDescription: "פעולה זו תסיר את הפריט מהרשימה ולא ניתן יהיה לשחזר אותו.",
    confirmRemove: "הסר",
    cancelRemove: "ביטול",
    enterListNamePrompt: "הזן שם לרשימה החדשה:",
    defaultNewListName: "רשימה חדשה",
    listNameCannotBeEmpty: "שם הרשימה אינו יכול להיות ריק.",
    notSpecified: "לא צוין",
    errorProvideListNameOrProfile: "אנא ספק שם לרשימה או פרטי פרופיל ליצירת רשימה מותאמת אישית.",
    equipmentListFor: "רשימת ציוד עבור",
    adults: "מבוגרים",
    listUpdatedSuccessfully: "הרשימה עודכנה בהצלחה!",
    listCreatedSuccessfully: "הרשימה נוצרה בהצלחה!",
    errorSavingList: "שגיאה בשמירת הרשימה. נסה שוב.",
    errorNoListToUpdate: "לא נבחרה רשימה לעדכון.",
    changesSavedSuccessfully: "השינויים נשמרו בהצלחה!",
    errorSavingChanges: "שגיאה בשמירת השינויים.",
    itemAddedSuccessfully: "הפריט נוסף בהצלחה!",
    errorAddingItem: "שגיאה בהוספת הפריט.",
    expiryDate: "תאריך תפוגה",
    setExpiryDate: "הגדר תאריך תפוגה",
    sendReminder: "שלח לי תזכורת",
    aiSuggestedExpiry: 'תוקף מוצע ע"י AI: ',
    noExpiryDate: "אין תאריך תפוגה",
    days: "ימים",
    unknownItem: "פריט לא ידוע",
    usageInstructionsPlaceholder: "הוראות שימוש והערות חשובות",
    loading: "טוען...",
    defaultValueUsed: "ערך ברירת מחדל",
    extractingData: "מחלץ מידע מהתיאור שלך...",
    generatingRecommendations: "יוצר רשימת ציוד מותאמת אישית...",
    processingItems: "מעבד את הפריטים המומלצים...",
    finalizingProcess: "מסיים את התהליך...",
    processingGeneric: "מעבד...",
    autoGeneratedListName: "שם הרשימה יווצר אוטומטית לפי המאפיינים שלך",
    elderly: "קשישים",
    tryAgain: "נסה שוב",
    itemNameCannotBeEmpty: "שם הפריט אינו יכול להיות ריק.",
    mandatoryItem: "פריט חובה",
    mandatoryItemTooltip: "ציוד מומלץ על-פי פיקוד העורף",
    personalizedItem: "פריט מותאם אישית",
    personalizedItemTooltip: "פריט שהותאם במיוחד לצרכים שלך",
    showMandatoryOnly: "הצג רק פריטי חובה",
    showPersonalizedOnly: "הצג רק פריטים מותאמים אישית",
    showAllItems: "הצג את כל הפריטים",
    mandatoryItemsCount: "פריטי חובה",
    personalizedItemsCount: "פריטים מותאמים אישית",
    estimatedExpiryDate: "תאריך תפוגה משוער",
    smsNotification: "הינני מעוניין בקבלת SMS המתריע מפני פקיעת התוקף של פריט זה.",
    smsNotificationInfo: "ההודעה תישלח למספר הטלפון שהוזן בעת ההרשמה. ניתן לערוך את מספר הטלפון שלך בעמוד",
    profilePage: "פרופיל",
    backToLists: "חזרה לרשימות",
    errorLoadingList: "שגיאה בטעינת הרשימה",
  },
  en: {
    pageTitle: "Emergency Equipment Management",
    pageDescription: "Create, edit, and manage essential equipment lists for emergencies.",
    backToLists: "Back to Lists",
    errorLoadingList: "Error loading list",
  },
}

// Category icons and styles
const categoryColors = {
  water_food: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
    icon: <Droplets className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  medical: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
    icon: <Pill className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  hygiene: {
    bg: "bg-green-100",
    text: "text-green-800",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
    icon: <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  lighting_energy: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-900/30",
    darkText: "dark:text-yellow-400",
    icon: <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  communication: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400",
    icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  documents_money: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-400",
    icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  children: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    darkBg: "dark:bg-pink-900/30",
    darkText: "dark:text-pink-400",
    icon: <Baby className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  pets: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
    icon: <Cat className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  elderly: {
    bg: "bg-teal-100",
    text: "text-teal-800",
    darkBg: "dark:bg-teal-900/30",
    darkText: "dark:text-teal-400",
    icon: <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  special_needs: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    darkBg: "dark:bg-cyan-900/30",
    darkText: "dark:text-cyan-400",
    icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  other: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-400",
    icon: <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
}

const requiredFieldStyle = "text-red-500 ml-1"

export default function EquipmentListPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImportance, setSelectedImportance] = useState("all")
  const [selectedItemType, setSelectedItemType] = useState("all")
  const [openAccordionItem, setOpenAccordionItem] = useState(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [itemHistory, setItemHistory] = useState([])
  const [profile, setProfile] = useState(null)

  const t = translations
  const isRTL = language === "he" || language === "ar"

  const [newItem, setNewItem] = useState({
    name: "",
    category: "water_food",
    quantity: 1,
    unit: "יחידות",
    importance: 3,
    description: "",
    expiryDate: null,
    sms_notification: false,
    usage_instructions: "",
    is_mandatory: false,
  })

  // Get language and direction
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)
      setTranslations(baseTranslations[docLang] || baseTranslations.he)
      setIsRTL(docLang === "he" || docLang === "ar")
    }
  }, [])

  // Fetch list data
  useEffect(() => {
    const fetchList = async () => {
      if (!params.listId) return

      setIsLoading(true)
      setError("")

      try {
        const listData = await EquipmentService.getList(params.listId)
        if (!listData) {
          setError(t.errorLoadingList)
          return
        }

        setList(listData)
        
        // Process items
        const processedItems = (listData.items || []).map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          obtained: typeof item.obtained === "boolean" ? item.obtained : false,
          importance: item.importance || 3,
          description: item.description || "",
          shelf_life: item.shelf_life || "",
          usage_instructions: item.usage_instructions || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          expiryDate: item.expiryDate || null,
          sms_notification: typeof item.sms_notification === "boolean" ? item.sms_notification : false,
          personalized_note: item.personalized_note || "",
          is_mandatory: typeof item.is_mandatory === "boolean" ? item.is_mandatory : false,
        }))
        
        setItems(processedItems)
        setFilteredItems(processedItems)

        // Parse profile data if available
        try {
          if (listData.description) {
            const profileData = JSON.parse(listData.description)
            setProfile(profileData)
          }
        } catch (e) {
          console.warn("Could not parse profile data:", e)
        }
      } catch (error) {
        console.error("Error fetching list:", error)
        setError(t.errorLoadingList)
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [params.listId, t])

  // Filter items when search or filters change
  useEffect(() => {
    if (!items.length) return

    let filtered = [...items]

    if (searchQuery) {
      filtered = filtered.filter((item) => {
        return (
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (selectedImportance !== "all") {
      filtered = filtered.filter((item) => {
        if (selectedImportance === "essential") return item.importance >= 5
        if (selectedImportance === "very_important") return item.importance >= 4 && item.importance < 5
        if (selectedImportance === "important") return item.importance >= 3 && item.importance < 4
        if (selectedImportance === "recommended") return item.importance >= 2 && item.importance < 3
        if (selectedImportance === "optional") return item.importance < 2
        return true
      })
    }

    if (selectedItemType !== "all") {
      filtered = filtered.filter((item) => {
        if (selectedItemType === "mandatory") return item.is_mandatory
        if (selectedItemType === "personalized") return !item.is_mandatory
        return true
      })
    }

    setFilteredItems(filtered)
  }, [searchQuery, selectedCategory, selectedImportance, selectedItemType, items])

  // Get category style
  const getCategoryStyle = (categoryKey) => {
    if (typeof categoryKey === "string" && categoryKey.includes(",")) {
      return categoryColors.other
    }
    return categoryColors[categoryKey] || categoryColors.other
  }

  // Get importance badge
  const getImportanceBadge = (importance, forCard = false) => {
    const baseClasses = "text-xs flex-shrink-0 break-words"
    const cardClasses = forCard ? "px-2 py-1" : ""

    if (importance >= 5) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 hidden xs:inline" />
          {t.aiCategories.essential || "הכרחי"}
        </Badge>
      )
    } else if (importance >= 4) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 hidden xs:inline" />
          {t.aiCategories.very_important || "חשוב מאוד"}
        </Badge>
      )
    } else if (importance >= 3) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800`}
        >
          {t.aiCategories.important || "חשוב"}
        </Badge>
      )
    } else if (importance >= 2) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800`}
        >
          {t.aiCategories.recommended || "מומלץ"}
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} ${cardClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700`}
      >
        {t.aiCategories.optional || "אופציונלי"}
      </Badge>
    )
  }

  // Handle adding a new item
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: "שגיאה",
        description: t.itemNameCannotBeEmpty || "שם הפריט אינו יכול להיות ריק.",
        variant: "destructive",
      })
      return
    }

    const itemId = crypto.randomUUID()
    const itemToAdd = {
      ...newItem,
      id: itemId,
      obtained: false,
    }

    setItems((prevItems) => [...prevItems, itemToAdd])
    setItemHistory((prevHistory) => [...prevHistory, [...items]])
    setIsAddItemDialogOpen(false)
    toast({
      title: "הצלחה",
      description: t.itemAddedSuccessfully || "הפריט נוסף בהצלחה!",
      variant: "default",
    })
    setNewItem({
      name: "",
      category: "water_food",
      quantity: 1,
      unit: t.aiCategories?.default_unit || "יחידות",
      importance: 3,
      description: "",
      expiryDate: null,
      sms_notification: false,
      usage_instructions: "",
      is_mandatory: false,
    })
  }

  // Handle removing an item
  const handleRemoveItem = (itemId) => {
    const itemToRemove = items.find((item) => item.id === itemId)
    setItemToRemove(itemToRemove)
    setIsConfirmDialogOpen(true)
  }

  const confirmRemoveItem = () => {
    setItemHistory([...itemHistory, [...items]])
    const updatedItems = items.filter((item) => item.id !== itemToRemove.id)
    setItems(updatedItems)
    setIsConfirmDialogOpen(false)
    setItemToRemove(null)
  }

  const handleUndoLastAction = () => {
    if (itemHistory.length > 0) {
      const lastState = itemHistory[itemHistory.length - 1]
      setItems(lastState)
      setItemHistory(itemHistory.slice(0, -1))
    }
  }

  const handleToggleObtained = (itemId) => {
    setItemHistory([...itemHistory, [...items]])
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, obtained: !item.obtained }
      }
      return item
    })
    setItems(updatedItems)
  }

  const handleUpdateItem = (itemId, updatedFields) => {
    setItemHistory([...itemHistory, [...items]])
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updatedFields }
      }
      return item
    })
    setItems(updatedItems)
  }

  const handleSaveChanges = async () => {
    if (!list) {
      toast({
        title: "שגיאה",
        description: t.errorNoListToUpdate || "לא נבחרה רשימה לעדכון.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Prepare data for saving
      const listData = {
        name: list.title,
        description: profile ? JSON.stringify(profile) : "",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          description: item.description || "",
          importance: item.importance || 3,
          obtained: item.obtained || false,
          expiryDate: item.expiryDate || null,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
        })),
      }

      // Update the list
      await EquipmentService.updateList(params.listId, listData)
      
      toast({
        title: "הצלחה",
        description: t.listUpdatedSuccessfully || "הרשימה עודכנה בהצלחה!",
        variant: "default",
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "שגיאה",
        description: t.errorSavingChanges || "שגיאה בשמירת השינויים.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const getMissingEssentialItems = () => items.filter((item) => item.importance >= 5 && !item.obtained)
  const getObtainedItemsCount = () => items.filter((item) => item.obtained).length
  const getTotalReadinessPercentage = () => {
    if (items.length === 0) return 0
    return Math.round((getObtainedItemsCount() / items.length) * 100)
  }
  const mandatoryItemsCount = items.filter((item) => item.is_mandatory).length
  const personalizedItemsCount = items.filter((item) => !item.is_mandatory).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>
        <Button onClick={() => router.push("/equipment-lists")} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          {t.backToLists || "חזרה לרשימות"}
        </Button>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {t.errorLoadingList || "שגיאה בטעינת הרשימה"}
        </div>
        <Button onClick={() => router.push("/equipment-lists")} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          {t.backToLists || "חזרה לרשימות"}
        </Button>
      </div>
    )
  }

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${isRTL ? "rtl" : "ltr"}`}>
      <header className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{list.title}</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/equipment-lists")}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t.backToLists || "חזרה לרשימות"}
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{t.pageDescription}</p>
      </header>

      <div className="space-y-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-white">
              {t.summaryTitle || "סיכום הציוד שלך"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                  {t.itemsChecked || "פריטים שנבדקו"}
                </h3>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {getObtainedItemsCount()} / {items.length}
                </p>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-1">
                  {t.missingEssentialItems || "הכרחיים חסרים"}
                </h3>
                <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                  {getMissingEssentialItems().length}
                </p>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-1">
                  {t.totalReadiness || "מוכנות כוללת"}
                </h3>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {getTotalReadinessPercentage()}%
                </p>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-1">
                  {t.categoriesCount || "קטגוריות"}
                </h3>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                  {new Set(items.map((item) => item.category)).size}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                  {t.mandatoryItemsCount || "פריטי חובה"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{mandatoryItemsCount}</p>
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                </div>
              </Card>
              <Card className="bg-[#005c72]/10 dark:bg-[#005c72]/20 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-[#005c72] dark:text-white mb-1">
                  {t.personalizedItemsCount || "פריטים מותאמים אישית"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-[#005c72] dark:text-white">{personalizedItemsCount}</p>
                  <Sparkles className="h-5 w-5 text-[#005c72] dark:text-white" />
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {profile && (
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-blue-500" /> {t.aiFamilyComposition}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="min-w-28">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiAdults}</p>
                  <p className="text-xl font-semibold">{profile.adults || 0}</p>
                </div>
                {profile.children > 0 && (
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiChildren}</p>
                    <p className="text-xl font-semibold">{profile.children}</p>
                  </div>
                )}
                {profile.babies > 0 && (
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiBabies}</p>
                    <p className="text-xl font-semibold">{profile.babies}</p>
                  </div>
                )}
                {profile.elderly > 0 && (
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.elderly}</p>
                    <p className="text-xl font-semibold">{profile.elderly}</p>
                  </div>
                )}
                {profile.pets > 0 && (
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiPets}</p>
                    <p className="text-xl font-semibold">{profile.pets}</p>
                  </div>
                )}
                {profile.duration_hours && (
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.durationHours || "משך זמן (שעות)"}</p>
                    <p className="text-xl font-semibold">{profile.duration_hours}</p>
                  </div>
                )}

                {profile.special_needs && profile.special_needs !== t.notSpecified && (
                  <div className="w-full mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.aiSpecialNeeds}</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">\
