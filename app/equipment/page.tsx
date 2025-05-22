"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  FileText,
  AlertTriangle,
  CalendarIcon,
  Bell,
  ListChecks,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  Droplets,
  Pill,
  HeartHandshake,
  UsersIcon,
  BellOff,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
// Fix: Import locales dynamically to prevent initialization errors during prerendering
import { createClient } from "@supabase/supabase-js"
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service"
import { EquipmentService } from "@/lib/services/equipment-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for equipment lists when not using AI
const mockEquipmentLists = [
  {
    id: "1",
    name: "רשימת ציוד לחירום",
    description: "ציוד חיוני למקרה חירום",
    items: [
      {
        id: "item1",
        name: "מים",
        category: "water_food",
        quantity: 9,
        unit: "ליטרים",
        obtained: false,
        importance: 5,
        description: "מים לשתייה ובישול",
        shelf_life: "שנה",
        usage_instructions: "3 ליטרים לאדם ליום",
        recommended_quantity_per_person: "3 ליטרים ליום",
        expiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "item2",
        name: "פנס",
        category: "lighting_energy",
        quantity: 2,
        unit: "יחידות",
        obtained: true,
        importance: 4,
        description: "פנס לתאורת חירום",
        shelf_life: "לא רלוונטי",
        usage_instructions: "יש לוודא שהסוללות טעונות",
        recommended_quantity_per_person: "1 יחידה לכל בית",
        expiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "item3",
        name: "ערכת עזרה ראשונה",
        category: "medical",
        quantity: 1,
        unit: "ערכה",
        obtained: false,
        importance: 5,
        description: "ערכת עזרה ראשונה בסיסית",
        shelf_life: "שנתיים",
        usage_instructions: "יש לבדוק תוקף של תרופות",
        recommended_quantity_per_person: "ערכה אחת למשפחה",
        expiryDate: "2025-12-31",
        sendExpiryReminder: true,
      },
    ],
  },
]

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
    aiFamilyComposition: "הרכב המשפחה",
    aiAdults: "מבוגרים",
    aiChildren: "ילדים",
    aiBabies: "תינוקות",
    aiElderly: "קשישים",
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
    cancelEditing: "בטל עריכה",
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
    cancel: "ביטול",
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
    expiryDate: "תאריך תפוגה",
    setExpiryDate: "הגדר תאריך תפוגה",
    sendReminder: "שלח לי תזכורת",
    aiSuggestedExpiry: 'תוקף מוצע ע"י AI: ',
    noExpiryDate: "אין תאריך תפוגה",
    days: "ימים",
    unknownItem: "פריט לא ידוע",
    usageInstructionsPlaceholder: "הוראות שימוש והערות חשובות",
    loading: "טוען...",
    defaultValueWarning: "ערך ברירת מחדל",
    defaultValueTooltip: "זהו ערך ברירת מחדל שנקבע על ידי המערכת",
  },
  en: {
    pageTitle: "Emergency Equipment Management",
    pageDescription: "Create, edit, and manage essential equipment lists for emergencies.",
    // ... other English translations would go here
  },
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfmxtaefgvjbuipcdcya.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.Rl-QQhQxQXTzgJLQYQKRGJDEQQDcnrJCBj0aCxRKAXs"

// Create a singleton Supabase client
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Equipment List service
const EquipmentList = EquipmentService

// Mock AI recommendation function (when not using OpenAI)
const generateAIRecommendations = async (prompt) => {
  return await AIRecommendationService.generateRecommendations(prompt)
}

// Category icons and styles
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
}

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

// Default Value Indicator component
const DefaultValueIndicator = ({ t }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 p-1 ml-1">
          <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t.defaultValueTooltip || "זהו ערך ברירת מחדל שנקבע על ידי המערכת"}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default function EquipmentPage() {
  const router = useRouter()
  const [language, setLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [aiUserPrompt, setAIUserPrompt] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiGeneratedItems, setAIGeneratedItems] = useState([])
  const [aiGeneratedProfile, setAIGeneratedProfile] = useState(null)
  const [openAccordionItem, setOpenAccordionItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImportance, setSelectedImportance] = useState("all")
  const [filteredItems, setFilteredItems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  // Fix: Initialize locale states with null and set them in useEffect
  const [currentLocale, setCurrentLocale] = useState(null)

  const t = translations

  const [newItem, setNewItem] = useState({
    name: "",
    category: "water_food",
    quantity: 1,
    unit: "יחידות", // Default unit
    importance: 3,
    description: "",
    expiryDate: null,
    sendExpiryReminder: false,
    usage_instructions: "",
    recommended_quantity_per_person: "",
  })
  const [itemHistory, setItemHistory] = useState([])
  const [itemToRemove, setItemToRemove] = useState(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [currentListName, setCurrentListName] = useState("")
  const [isListContextLoading, setIsListContextLoading] = useState(false)
  const [lastSavedMessage, setLastSavedMessage] = useState("")

  const isRTL = language === "he" || language === "ar"

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

  // Save list and generate items
  const handleSaveListAndGenerateItems = async () => {
    setIsAILoading(true)
    setError("")
    setLastSavedMessage("")

    if (!currentListName && !(aiGeneratedProfile && Object.keys(aiGeneratedProfile).length > 0)) {
      setError(t.errorProvideListNameOrProfile || "אנא ספק שם לרשימה או פרטי פרופיל ליצירת רשימה מותאמת אישית.")
      setIsAILoading(false)
      return
    }

    let listNameToSave = currentListName
    if (!listNameToSave && aiGeneratedProfile) {
      listNameToSave = `${t.equipmentListFor || "רשימת ציוד עבור"} ${aiGeneratedProfile.adults || 0} ${t.adults || "מבוגרים"}`
    }

    if (!listNameToSave) {
      listNameToSave = t.defaultNewListName || "רשימה חדשה"
    }

    try {
      const listToSave = {
        name: listNameToSave,
        description: "",
        items: aiGeneratedItems.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || t.aiCategories?.default_unit || "יחידות",
          obtained: typeof item.obtained === "boolean" ? item.obtained : false,
          expiryDate: item.expiryDate || null,
          sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
        })),
        profile: aiGeneratedProfile,
      }

      let savedListResponse
      const urlParams = new URLSearchParams(window.location.search)
      const existingListId = urlParams.get("listId")

      if (existingListId) {
        savedListResponse = await EquipmentService.updateEquipmentList(existingListId, listToSave)
        setLastSavedMessage(t.listUpdatedSuccessfully || "הרשימה עודכנה בהצלחה!")
      } else {
        // When creating a new list, items may have aiSuggestedExpiryDate.
        // We want to initialize expiryDate with aiSuggestedExpiryDate if available.
        listToSave.items = listToSave.items.map((it) => ({
          ...it,
          expiryDate: it.expiryDate || it.aiSuggestedExpiryDate || null,
        }))
        savedListResponse = await EquipmentService.createEquipmentList(listToSave)
        setLastSavedMessage(t.listCreatedSuccessfully || "הרשימה נוצרה בהצלחה!")
      }

      router.push("/equipment-lists?refresh=" + new Date().getTime())
    } catch (error) {
      console.error("Error saving list:", error)
      setError(t.errorSavingList || "שגיאה בשמירת הרשימה. נסה שוב.")
    } finally {
      setIsAILoading(false)
    }
  }

  // Load page context
  useEffect(() => {
    // Fix: Import locales dynamically to prevent initialization errors during prerendering
    const loadLocales = async () => {
      try {
        const { he } = await import("date-fns/locale/he")
        const { enUS } = await import("date-fns/locale/en-US")
        setCurrentLocale(language === "he" ? he : enUS)
      } catch (error) {
        console.error("Error loading locales:", error)
        // Fallback to null locale if loading fails
        setCurrentLocale(null)
      }
    }

    const loadPageContext = async () => {
      setIsLoading(true)

      // Get language from document
      const docLang = document.documentElement.lang || "he"
      setLanguage(docLang)

      // Load locales
      await loadLocales()

      // Set translations based on language
      setTranslations(baseTranslations[docLang] || baseTranslations.he)

      // Update newItem's default unit based on the loaded translations
      setNewItem((prev) => ({
        ...prev,
        unit: baseTranslations[docLang]?.aiCategories?.default_unit || "יחידות",
      }))

      setIsLoading(false)

      // Load list data if listId is provided
      setIsListContextLoading(true)
      const urlParams = new URLSearchParams(window.location.search)
      const listId = urlParams.get("listId")

      if (listId) {
        try {
          const listData = await EquipmentService.getEquipmentList(listId)
          if (listData) {
            setCurrentListName(listData.name || listData.title)

            const itemsWithDetails = (listData.items || []).map((item) => ({
              ...item,
              id: item.id || Math.random().toString(36).substr(2, 9),
              obtained: typeof item.obtained === "boolean" ? item.obtained : false,
              importance: item.importance || 3,
              description: item.description || "",
              shelf_life: item.shelf_life || "N/A",
              usage_instructions: item.usage_instructions || "",
              recommended_quantity_per_person: item.recommended_quantity_per_person || "",
              expiryDate: item.expiryDate || item.expiry_date || null,
              aiSuggestedExpiryDate: item.aiSuggestedExpiryDate || null,
              sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
            }))

            setAIGeneratedItems(itemsWithDetails)
            setFilteredItems(itemsWithDetails)

            setAIGeneratedProfile({
              adults: listData.profile?.adults || 1,
              children: listData.profile?.children || 0,
              babies: listData.profile?.babies || 0,
              elderly: listData.profile?.elderly || 0,
              pets: listData.profile?.pets || 0,
              special_needs: listData.profile?.special_needs || baseTranslations[docLang].notSpecified || "לא צוין",
              duration_hours: listData.profile?.duration_hours || 72,
              using_defaults: listData.profile?.using_defaults || {
                adults: false,
                children: false,
                babies: false,
                elderly: false,
                pets: false,
                duration: false,
                special_needs: false,
              },
              loadedFromExisting: true,
            })
            setAIUserPrompt("")
          } else {
            console.warn(`List with ID ${listId} not found.`)
            setCurrentListName("")
            setAIGeneratedProfile(null)
          }
        } catch (error) {
          console.error("Error loading equipment list:", error)
          setCurrentListName("")
          setAIGeneratedProfile(null)
        }
      } else {
        setCurrentListName("")
        setAIGeneratedItems([])
        setFilteredItems([])
        setAIGeneratedProfile(null)
        setAIUserPrompt("")
      }
      setIsListContextLoading(false)
    }

    loadPageContext()
  }, [])

  // Filter items when search or filters change
  useEffect(() => {
    if (aiGeneratedItems.length > 0) {
      let filtered = [...aiGeneratedItems]

      if (searchQuery) {
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      }

      if (selectedCategory && selectedCategory !== "all") {
        filtered = filtered.filter((item) => item.category === selectedCategory)
      }

      if (selectedImportance && selectedImportance !== "all") {
        const importanceMap = {
          הכרחי: 5,
          "חשוב מאוד": 4,
          חשוב: 3,
          מומלץ: 2,
          אופציונלי: 1,
        }
        const importanceValue = importanceMap[selectedImportance]
        if (importanceValue !== undefined) {
          filtered = filtered.filter((item) => item.importance === importanceValue)
        }
      }

      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [searchQuery, selectedCategory, selectedImportance, aiGeneratedItems])

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedImportance("all")
  }

  // Get category display name
  const aiCategories = t.aiCategories || {}
  const getCategoryDisplayName = (categoryKey) => aiCategories[categoryKey] || categoryKey

  // Get missing essential items
  const getMissingEssentialItems = () => {
    return aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained)
  }

  // Get obtained items count
  const getObtainedItemsCount = () => {
    return aiGeneratedItems.filter((item) => item.obtained).length
  }

  // Get total readiness percentage
  const getTotalReadinessPercentage = () => {
    if (aiGeneratedItems.length === 0) return 0
    return Math.round((getObtainedItemsCount() / aiGeneratedItems.length) * 100)
  }

  // Handle back to prompt
  const handleBackToPrompt = () => {
    setAIGeneratedProfile(null)
    setAIGeneratedItems([])
    setFilteredItems([])
    setAIUserPrompt("")
    setOpenAccordionItem(null)
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedImportance("all")
  }

  // Handle AI generate recommendations
  const handleAIGenerateRecommendations = async () => {
    if (!aiUserPrompt.trim()) return
    setIsAILoading(true)
    setAIGeneratedItems([])
    setFilteredItems([])

    try {
      // Use the mock function instead of OpenAI
      const response = await generateAIRecommendations(aiUserPrompt)

      if (response && response.profile && response.items) {
        setAIGeneratedProfile(response.profile)
        setAIGeneratedItems(response.items)
        setFilteredItems(response.items)
      } else {
        console.error("AI response format incorrect or missing data:", response)
      }
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  // Toggle item obtained
  const toggleItemObtained = (itemId) => {
    setAIGeneratedItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, obtained: !item.obtained } : item)),
    )
  }

  // Get essential items count
  const getEssentialItemsCount = () => {
    return aiGeneratedItems.filter((item) => item.importance >= 5).length
  }

  // Update items with history
  const updateItemsWithHistory = (newItems) => {
    setItemHistory((prev) => [...prev, aiGeneratedItems])
    setAIGeneratedItems(newItems)
  }

  // Handle undo
  const handleUndo = () => {
    if (itemHistory.length > 0) {
      const previousItems = itemHistory[itemHistory.length - 1]
      setAIGeneratedItems(previousItems)
      setItemHistory(itemHistory.slice(0, -1))
    }
  }

  // Handle add item
  const handleAddItem = () => {
    setNewItem({
      name: "",
      category: "water_food",
      quantity: 1,
      unit: baseTranslations[language]?.aiCategories?.default_unit || "יחידות",
      importance: 3,
      description: "",
      expiryDate: null,
      sendExpiryReminder: false,
      usage_instructions: "",
      recommended_quantity_per_person: "",
    })
    setIsAddItemDialogOpen(true)
  }

  // Handle save new item
  const handleSaveNewItem = () => {
    if (!newItem.name.trim()) return

    const itemWithId = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      obtained: false,
    }

    updateItemsWithHistory([...aiGeneratedItems, itemWithId])
    setIsAddItemDialogOpen(false)
    setOpenAccordionItem(itemWithId.id)
  }

  // Handle remove item confirm
  const handleRemoveItemConfirm = (item) => {
    setItemToRemove(item)
    setIsConfirmDialogOpen(true)
  }

  // Handle remove item
  const handleRemoveItem = () => {
    if (!itemToRemove) return

    updateItemsWithHistory(aiGeneratedItems.filter((item) => item.id !== itemToRemove.id))
    setFilteredItems(filteredItems.filter((item) => item.id !== itemToRemove.id))
    setItemToRemove(null)
    setIsConfirmDialogOpen(false)
  }

  // Handle save changes
  const handleSaveChanges = async () => {
    setIsEditing(false)
    setItemHistory([])
    setLastSavedMessage("")
    setError("")

    const urlParams = new URLSearchParams(window.location.search)
    const listId = urlParams.get("listId")

    if (!listId) {
      setError(t.errorNoListToUpdate || "לא נבחרה רשימה לעדכון.")
      return
    }

    const itemsToSave = aiGeneratedItems.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || t.aiCategories?.default_unit || "יחידות",
      obtained: typeof item.obtained === "boolean" ? item.obtained : false,
      expiryDate: item.expiryDate || null,
      sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
      description: item.description || "",
      importance: item.importance || 3,
      shelf_life: item.shelf_life || null,
      usage_instructions: item.usage_instructions || "",
    }))

    try {
      await EquipmentService.updateEquipmentList(listId, {
        name: currentListName,
        items: itemsToSave,
        profile: aiGeneratedProfile,
      })

      router.push("/equipment-lists?refresh=" + new Date().getTime())
      return
    } catch (error) {
      console.error("Error saving changes to list:", error)
      setError(t.errorSavingChanges || "שגיאה בשמירת השינויים.")
    }
  }

  // Handle item change
  const handleItemChange = (itemId, field, value) => {
    const updatedItems = aiGeneratedItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    setAIGeneratedItems(updatedItems)
  }

  // Handle expiry date change
  const handleExpiryDateChange = (itemId, date) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null
    handleItemChange(itemId, "expiryDate", formattedDate)
  }

  // Toggle expiry reminder
  const toggleExpiryReminder = (itemId) => {
    const itemToUpdate = aiGeneratedItems.find((item) => item.id === itemId)
    if (itemToUpdate) {
      handleItemChange(itemId, "sendExpiryReminder", !itemToUpdate.sendExpiryReminder)
    }
  }

  // Calculate suggested expiry
  const calculateSuggestedExpiry = (explicitDate, shelfLifeDays) => {
    if (explicitDate) {
      try {
        return format(parseISO(explicitDate), "yyyy-MM-dd")
      } catch (e) {
        console.warn("Invalid date string for explicitDate in calculateSuggestedExpiry:", explicitDate, e)
        return null
      }
    }
    if (shelfLifeDays && !isNaN(Number.parseInt(shelfLifeDays))) {
      const date = new Date()
      date.setDate(date.getDate() + Number.parseInt(shelfLifeDays))
      return format(date, "yyyy-MM-dd")
    }
    return null
  }

  // Render expiry controls
  const renderExpiryControls = (item) => {
    // Fix: Check if currentLocale is available before using it
    if (!currentLocale) return null

    // Determine initial date for picker: user-set, then AI-suggested, then null
    const dateForPicker = item.expiryDate || item.aiSuggestedExpiryDate

    if (isEditing) {
      return (
        <div className="mt-3 space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <Label htmlFor={`expiryDate-${item.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.expiryDate || "תאריך תפוגה"}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${!dateForPicker && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {item.expiryDate ? (
                  format(parseISO(item.expiryDate), "PPP", { locale: currentLocale })
                ) : item.aiSuggestedExpiryDate ? (
                  format(parseISO(item.aiSuggestedExpiryDate), "PPP", { locale: currentLocale })
                ) : (
                  <span>{t.setExpiryDate || "הגדר תאריך תפוגה"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateForPicker ? parseISO(dateForPicker) : undefined}
                onSelect={(date) => handleExpiryDateChange(item.id, date)}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 20}
                locale={currentLocale}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center space-x-2 mt-2 rtl:space-x-reverse">
            <Checkbox
              id={`reminder-${item.id}`}
              checked={!!item.sendExpiryReminder}
              onCheckedChange={() => toggleExpiryReminder(item.id)}
              aria-label={t.sendReminder || "שלח לי תזכורת"}
            />
            <Label
              htmlFor={`reminder-${item.id}`}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {t.sendReminder || "שלח לי תזכורת"}
            </Label>
            {item.sendExpiryReminder ? (
              <Bell className="h-4 w-4 text-purple-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            \
