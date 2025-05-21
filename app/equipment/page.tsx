"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  AlertTriangle,
  ListChecks,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  Droplets,
  Pill,
  HeartHandshake,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
// Fix: Import locales dynamically to prevent initialization errors during prerendering
import { createClient } from "@supabase/supabase-js"
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service"
import { EquipmentService } from "@/lib/services/equipment-service"

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
    // חדש - מצבי טעינה
    extractingData: "מחלץ מידע מהתיאור שלך...",
    generatingRecommendations: "יוצר רשימת ציוד מותאמת אישית...",
    processingItems: "מעבד את הפריטים המומלצים...",
    finalizingProcess: "מסיים את התהליך...",
    processingGeneric: "מעבד...",
    autoGeneratedListName: "שם הרשימה יווצר אוטומטית לפי המאפיינים שלך",
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
let supabaseClient = null
const createSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
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

// רכיב חדש להצגת מצב הטעינה
const LoadingIndicator = ({ state, t }) => {
  const getStepText = () => {
    switch (state.step) {
      case "extracting":
        return t.extractingData || "מחלץ מידע מהתיאור שלך..."
      case "generating":
        return t.generatingRecommendations || "יוצר רשימת ציוד מותאמת אישית..."
      case "processing":
        return t.processingItems || "מעבד את הפריטים המומלצים..."
      case "finalizing":
        return t.finalizingProcess || "מסיים את התהליך..."
      default:
        return t.processingGeneric || "מעבד..."
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{getStepText()}</span>
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{state.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${state.progress}%` }}
        ></div>
      </div>
    </div>
  )
}

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

  // חדש: מצב טעינה מפורט
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    step: "", // "extracting", "generating", "processing", "finalizing"
    progress: 0, // 0-100
  })

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

    if (!aiUserPrompt.trim()) {
      setError("אנא הזן תיאור של משק הבית שלך")
      setIsAILoading(false)
      return
    }

    try {
      // Update loading state
      setLoadingState({
        isLoading: true,
        step: "extracting",
        progress: 10,
      })

      // Extract data from user prompt
      const extractedData = await fetch("/api/extract-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiUserPrompt }),
      }).then((res) => res.json())

      // Update loading state
      setLoadingState({
        isLoading: true,
        step: "generating",
        progress: 30,
      })

      // Generate recommendations based on extracted data
      const recommendations = await generateAIRecommendations(aiUserPrompt)

      // Update loading state
      setLoadingState({
        isLoading: true,
        step: "processing",
        progress: 70,
      })

      if (recommendations && recommendations.items) {
        setAIGeneratedItems(recommendations.items)
        setAIGeneratedProfile(recommendations.profile || {})

        // Generate list name based on profile if not provided
        if (!currentListName && recommendations.profile) {
          const profile = recommendations.profile
          let generatedName = "רשימת ציוד חירום"

          if (profile.adults > 0 || profile.children > 0 || profile.babies > 0) {
            generatedName += " למשפחה עם "
            const parts = []
            if (profile.adults > 0) parts.push(`${profile.adults} מבוגרים`)
            if (profile.children > 0) parts.push(`${profile.children} ילדים`)
            if (profile.babies > 0) parts.push(`${profile.babies} תינוקות`)
            generatedName += parts.join(", ")
          }

          if (profile.pets > 0) {
            generatedName += ` ו-${profile.pets} חיות מחמד`
          }

          if (profile.special_needs && profile.special_needs !== "לא צוין") {
            generatedName += ` (${profile.special_needs})`
          }

          setCurrentListName(generatedName)
        }
      } else {
        setError("Failed to generate recommendations. Please try again.")
      }

      // Update loading state
      setLoadingState({
        isLoading: true,
        step: "finalizing",
        progress: 90,
      })

      // Simulate a short delay for the final step
      setTimeout(() => {
        setLoadingState({
          isLoading: false,
          step: "",
          progress: 100,
        })
        setIsAILoading(false)
      }, 500)
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
      setError("An error occurred while generating recommendations. Please try again.")
      setIsAILoading(false)
      setLoadingState({
        isLoading: false,
        step: "",
        progress: 0,
      })
    }
  }

  // Save AI generated list
  const saveAIGeneratedList = async () => {
    setIsAILoading(true)
    setError("")

    if (!currentListName) {
      setError(t.listNameCannotBeEmpty || "שם הרשימה אינו יכול להיות ריק.")
      setIsAILoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()

      // Get the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      if (!sessionData.session) {
        throw new Error("Auth session missing!")
      }

      const userId = sessionData.session.user.id

      if (!userId) {
        router.push("/login")
        return
      }

      const newList = {
        name: currentListName,
        description: aiGeneratedProfile ? JSON.stringify(aiGeneratedProfile) : "",
        user_id: userId,
        items: aiGeneratedItems.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
      }

      const { data, error: saveError } = await EquipmentList.createList(newList)

      if (saveError) {
        throw new Error(saveError.message)
      }

      setLastSavedMessage(t.aiSavedSuccess || "הרשימה נשמרה בהצלחה!")
      setTimeout(() => {
        router.push(`/equipment-lists?list=${data.id}`)
      }, 1500)
    } catch (error) {
      console.error("Error saving list:", error)
      setError(t.errorSavingList || "שגיאה בשמירת הרשימה. נסה שוב.")
    } finally {
      setIsAILoading(false)
    }
  }

  // Filter items based on search query, category, and importance
  const filterItems = (items) => {
    if (!items) return []

    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesImportance =
        selectedImportance === "all" ||
        (selectedImportance === "essential" && item.importance >= 5) ||
        (selectedImportance === "very_important" && item.importance >= 4 && item.importance < 5) ||
        (selectedImportance === "important" && item.importance >= 3 && item.importance < 4) ||
        (selectedImportance === "recommended" && item.importance >= 2 && item.importance < 3) ||
        (selectedImportance === "optional" && item.importance < 2)

      return matchesSearch && matchesCategory && matchesImportance
    })
  }

  // Handle adding a new item
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      setError(t.itemNameCannotBeEmpty || "שם הפריט אינו יכול להיות ריק.")
      return
    }

    const itemId = crypto.randomUUID()
    const itemToAdd = {
      ...newItem,
      id: itemId,
      obtained: false,
    }

    setAIGeneratedItems((prevItems) => [...prevItems, itemToAdd])
    setItemHistory((prevHistory) => [...prevHistory, { action: "add", item: itemToAdd }])
    setIsAddItemDialogOpen(false)
    setNewItem({
      name: "",
      category: "water_food",
      quantity: 1,
      unit: "יחידות",
      importance: 3,
      description: "",
      expiryDate: null,
      sendExpiryReminder: false,
      usage_instructions: "",
      recommended_quantity_per_person: "",
    })
  }

  // Handle removing an item
  const handleRemoveItem = (itemId) => {
    const itemToRemove = aiGeneratedItems.find((item) => item.id === itemId)
    setItemToRemove(itemToRemove)
    setIsConfirmDialogOpen(true)
  }

  // Confirm item removal
  const confirmRemoveItem = () => {
    if (!itemToRemove) return

    const updatedItems = aiGeneratedItems.filter((item) => item.id !== itemToRemove.id)
    setAIGeneratedItems(updatedItems)
    setItemHistory((prevHistory) => [...prevHistory, { action: "remove", item: itemToRemove }])
    setIsConfirmDialogOpen(false)
    setItemToRemove(null)
  }

  // Undo last action
  const handleUndo = () => {
    if (itemHistory.length === 0) return

    const lastAction = itemHistory[itemHistory.length - 1]
    setItemHistory((prevHistory) => prevHistory.slice(0, -1))

    if (lastAction.action === "add") {
      setAIGeneratedItems((prevItems) => prevItems.filter((item) => item.id !== lastAction.item.id))
    } else if (lastAction.action === "remove") {
      setAIGeneratedItems((prevItems) => [...prevItems, lastAction.item])
    }
  }

  // Handle item checkbox change
  const handleItemCheckboxChange = (itemId, checked) => {
    setAIGeneratedItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, obtained: checked } : item)),
    )
  }

  // Initialize component
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Set default language and translations
        setLanguage("he")
        setTranslations(baseTranslations.he)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing equipment page:", error)
        setError("Failed to initialize page. Please try again.")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update filtered items when search query, category, or importance changes
  useEffect(() => {
    setFilteredItems(filterItems(aiGeneratedItems))
  }, [searchQuery, selectedCategory, selectedImportance, aiGeneratedItems])

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">שגיאה: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => setError("")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {t.tryAgain || "נסה שוב"}
        </button>
      </div>
    )
  }

  // Render AI generation form
  return (
    <div className={`container mx-auto p-4 ${isRTL ? "rtl" : "ltr"}`}>
      <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t.pageDescription}</p>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Generation Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t.aiModalTitle}</h2>
          <p className="mb-4">{t.aiPromptDescription}</p>

          <textarea
            value={aiUserPrompt}
            onChange={(e) => setAIUserPrompt(e.target.value)}
            placeholder={t.aiPromptPlaceholder}
            className="w-full p-3 border border-gray-300 rounded-md mb-4 min-h-[150px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.autoGeneratedListName}</p>

          {loadingState.isLoading ? (
            <LoadingIndicator state={loadingState} t={t} />
          ) : (
            <button
              onClick={handleSaveListAndGenerateItems}
              disabled={isAILoading || !aiUserPrompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAILoading ? t.aiGenerating : t.aiGenerateButton}
            </button>
          )}
        </div>

        {/* AI Generated Items */}
        {aiGeneratedItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t.aiItemsTitle}</h2>
              {itemHistory.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  {t.undoAction}
                </button>
              )}
            </div>

            {/* סיכום סטטוס הציוד */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">{t.summaryTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.categoriesCount}</div>
                  <div className="text-xl font-bold">
                    {
                      Object.keys(
                        aiGeneratedItems.reduce((acc, item) => {
                          acc[item.category] = true
                          return acc
                        }, {}),
                      ).length
                    }
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.totalReadiness}</div>
                  <div className="text-xl font-bold">
                    {Math.round(
                      (aiGeneratedItems.filter((item) => item.obtained).length / aiGeneratedItems.length) * 100,
                    )}
                    %
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.missingEssentialItems}</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.itemsChecked}</div>
                  <div className="text-xl font-bold">
                    {aiGeneratedItems.filter((item) => item.obtained).length}/{aiGeneratedItems.length}
                  </div>
                </div>
              </div>
            </div>

            {/* פריטים הכרחיים חסרים */}
            {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-red-600 dark:text-red-400">
                  {t.missingEssentialItemsTitle}
                </h3>
                <div className="space-y-2">
                  {aiGeneratedItems
                    .filter((item) => item.importance >= 5 && !item.obtained)
                    .slice(0, 3)
                    .map((item) => (
                      <div key={`missing-${item.id}`} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span>{item.name}</span>
                      </div>
                    ))}
                  {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.andMoreMissing.replace(
                        "{count}",
                        (
                          aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length - 3
                        ).toString(),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-3">{t.allItemsTitle}</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchItemPlaceholder}
                className="w-full p-2 border border-gray-300 rounded-md mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">{t.allCategories}</option>
                  {Object.keys(categoryColors).map((category) => (
                    <option key={category} value={category}>
                      {t.aiCategories[category] || category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">{t.allLevels}</option>
                  <option value="essential">{t.aiCategories.essential}</option>
                  <option value="very_important">{t.aiCategories.very_important}</option>
                  <option value="important">{t.aiCategories.important}</option>
                  <option value="recommended">{t.aiCategories.recommended}</option>
                  <option value="optional">{t.aiCategories.optional}</option>
                </select>
              </div>

              {(searchQuery || selectedCategory !== "all" || selectedImportance !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setSelectedImportance("all")
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t.clearFiltersButton}
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">{t.noItemsFound}</p>
                {(searchQuery || selectedCategory !== "all" || selectedImportance !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                      setSelectedImportance("all")
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                  >
                    {t.showAllItemsButton}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredItems.map((item) => {
                  const categoryStyle = getCategoryStyle(item.category)
                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={item.obtained}
                        onChange={(e) => handleItemCheckboxChange(item.id, e.target.checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 items-start justify-between mb-1">
                          <label
                            htmlFor={`item-${item.id}`}
                            className={`font-medium ${item.obtained ? "line-through text-gray-500 dark:text-gray-400" : ""}`}
                          >
                            {item.name}
                          </label>
                          {getImportanceBadge(item.importance)}
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="flex items-center gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBg} ${categoryStyle.darkText}`}
                            >
                              {categoryStyle.icon}
                              <span className="ml-1">{t.aiCategories[item.category] || item.category}</span>
                            </span>
                          </span>
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                        )}

                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 text-sm px-2 py-1 rounded"
                          >
                            {t.removeItem}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsAddItemDialogOpen(true)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded"
              >
                {t.addItem}
              </button>
              <button
                onClick={saveAIGeneratedList}
                disabled={isAILoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAILoading ? t.aiGenerating : t.aiSaveList}
              </button>
            </div>

            {lastSavedMessage && (
              <div className="mt-4 p-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                {lastSavedMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      {isAddItemDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t.addNewItem}</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium mb-1">
                  {t.itemName}
                </label>
                <input
                  id="item-name"
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item-category" className="block text-sm font-medium mb-1">
                    {t.itemCategory}
                  </label>
                  <select
                    id="item-category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.keys(categoryColors).map((category) => (
                      <option key={category} value={category}>
                        {t.aiCategories[category] || category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="item-importance" className="block text-sm font-medium mb-1">
                    {t.itemImportance}
                  </label>
                  <select
                    id="item-importance"
                    value={newItem.importance}
                    onChange={(e) => setNewItem({ ...newItem, importance: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="5">{t.aiCategories.essential}</option>
                    <option value="4">{t.aiCategories.very_important}</option>
                    <option value="3">{t.aiCategories.important}</option>
                    <option value="2">{t.aiCategories.recommended}</option>
                    <option value="1">{t.aiCategories.optional}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item-quantity" className="block text-sm font-medium mb-1">
                    {t.itemQuantity}
                  </label>
                  <input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="item-unit" className="block text-sm font-medium mb-1">
                    {t.itemUnit}
                  </label>
                  <input
                    id="item-unit"
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="item-description" className="block text-sm font-medium mb-1">
                  {t.itemDescription}
                </label>
                <textarea
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="item-usage" className="block text-sm font-medium mb-1">
                  {t.itemUsageInstructions}
                </label>
                <textarea
                  id="item-usage"
                  value={newItem.usage_instructions}
                  onChange={(e) => setNewItem({ ...newItem, usage_instructions: e.target.value })}
                  placeholder={t.usageInstructionsPlaceholder}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="item-recommended" className="block text-sm font-medium mb-1">
                  {t.itemRecommendedQuantity}
                </label>
                <input
                  id="item-recommended"
                  type="text"
                  value={newItem.recommended_quantity_per_person}
                  onChange={(e) => setNewItem({ ...newItem, recommended_quantity_per_person: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddItemDialogOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">{t.removeItemConfirm}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.removeItemDescription}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmDialogOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded"
              >
                {t.cancelRemove}
              </button>
              <button
                onClick={confirmRemoveItem}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                {t.confirmRemove}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
