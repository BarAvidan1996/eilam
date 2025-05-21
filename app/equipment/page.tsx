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
import { createClient } from "@supabase/supabase-js"
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service"
import { EquipmentService } from "@/lib/services/equipment-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

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
    // חדש - מצבי טעינה
    extractingData: "מחלץ מידע מהתיאור שלך...",
    generatingRecommendations: "יוצר רשימת ציוד מותאמת אישית...",
    processingItems: "מעבד את הפריטים המומלצים...",
    finalizingProcess: "מסיים את התהליך...",
    processingGeneric: "מעבד...",
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
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{getStepText()}</span>
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{state.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
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

    if (!currentListName && !(aiGeneratedProfile && Object.keys(aiGeneratedProfile).length > 0)) {
      setError(t.errorProvideListNameOrProfile || "אנא ספק שם לרשימה או פרטי פרופיל ליצירת רשימה מותאמת אישית.")
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
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(userError.message)
      }

      const userId = userData.user?.id

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
        <Spinner size="lg" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Button onClick={() => setError("")}>{t.tryAgain || "Try Again"}</Button>
      </div>
    )
  }

  // Render AI generation form
  return (
    <div className={`container mx-auto p-4 ${isRTL ? "rtl" : "ltr"}`}>
      <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t.pageDescription}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Generation Form */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">{t.aiModalTitle}</h2>
          <p className="mb-4">{t.aiPromptDescription}</p>

          <Textarea
            value={aiUserPrompt}
            onChange={(e) => setAIUserPrompt(e.target.value)}
            placeholder={t.aiPromptPlaceholder}
            className="mb-4 min-h-[150px]"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t.listNameLabel}</label>
            <Input
              value={currentListName}
              onChange={(e) => setCurrentListName(e.target.value)}
              placeholder={t.aiListNamePlaceholder}
            />
          </div>

          {loadingState.isLoading ? (
            <LoadingIndicator state={loadingState} t={t} />
          ) : (
            <Button
              onClick={handleSaveListAndGenerateItems}
              disabled={isAILoading || !aiUserPrompt.trim()}
              className="w-full"
            >
              {isAILoading ? t.aiGenerating : t.aiGenerateButton}
            </Button>
          )}
        </Card>

        {/* AI Generated Items */}
        {aiGeneratedItems.length > 0 && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t.aiItemsTitle}</h2>
              {itemHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleUndo}>
                  {t.undoAction}
                </Button>
              )}
            </div>

            <div className="mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchItemPlaceholder}
                className="mb-2"
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.categoryFilterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCategories}</SelectItem>
                    {Object.keys(categoryColors).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t.aiCategories[category] || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedImportance} onValueChange={setSelectedImportance}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.importanceFilterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allLevels}</SelectItem>
                    <SelectItem value="essential">{t.aiCategories.essential}</SelectItem>
                    <SelectItem value="very_important">{t.aiCategories.very_important}</SelectItem>
                    <SelectItem value="important">{t.aiCategories.important}</SelectItem>
                    <SelectItem value="recommended">{t.aiCategories.recommended}</SelectItem>
                    <SelectItem value="optional">{t.aiCategories.optional}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || selectedCategory !== "all" || selectedImportance !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setSelectedImportance("all")
                  }}
                >
                  {t.clearFiltersButton}
                </Button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">{t.noItemsFound}</p>
                {(searchQuery || selectedCategory !== "all" || selectedImportance !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                      setSelectedImportance("all")
                    }}
                  >
                    {t.showAllItemsButton}
                  </Button>
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
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.obtained}
                        onCheckedChange={(checked) => handleItemCheckboxChange(item.id, checked)}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            {t.removeItem}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                {t.addItem}
              </Button>
              <Button onClick={saveAIGeneratedList} disabled={isAILoading}>
                {isAILoading ? t.aiGenerating : t.aiSaveList}
              </Button>
            </div>

            {lastSavedMessage && (
              <div className="mt-4 p-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                {lastSavedMessage}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addNewItem}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="item-name" className="text-sm font-medium">
                {t.itemName}
              </label>
              <Input
                id="item-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="item-category" className="text-sm font-medium">
                  {t.itemCategory}
                </label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger id="item-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoryColors).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t.aiCategories[category] || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="item-importance" className="text-sm font-medium">
                  {t.itemImportance}
                </label>
                <Select
                  value={newItem.importance.toString()}
                  onValueChange={(value) => setNewItem({ ...newItem, importance: Number.parseInt(value) })}
                >
                  <SelectTrigger id="item-importance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">{t.aiCategories.essential}</SelectItem>
                    <SelectItem value="4">{t.aiCategories.very_important}</SelectItem>
                    <SelectItem value="3">{t.aiCategories.important}</SelectItem>
                    <SelectItem value="2">{t.aiCategories.recommended}</SelectItem>
                    <SelectItem value="1">{t.aiCategories.optional}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="item-quantity" className="text-sm font-medium">
                  {t.itemQuantity}
                </label>
                <Input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="item-unit" className="text-sm font-medium">
                  {t.itemUnit}
                </label>
                <Input
                  id="item-unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="item-description" className="text-sm font-medium">
                {t.itemDescription}
              </label>
              <Textarea
                id="item-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="item-usage" className="text-sm font-medium">
                {t.itemUsageInstructions}
              </label>
              <Textarea
                id="item-usage"
                value={newItem.usage_instructions}
                onChange={(e) => setNewItem({ ...newItem, usage_instructions: e.target.value })}
                placeholder={t.usageInstructionsPlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="item-recommended" className="text-sm font-medium">
                {t.itemRecommendedQuantity}
              </label>
              <Input
                id="item-recommended"
                value={newItem.recommended_quantity_per_person}
                onChange={(e) => setNewItem({ ...newItem, recommended_quantity_per_person: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAddItem}>{t.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.removeItemConfirm}</DialogTitle>
            <DialogDescription>{t.removeItemDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              {t.cancelRemove}
            </Button>
            <Button variant="destructive" onClick={confirmRemoveItem}>
              {t.confirmRemove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
