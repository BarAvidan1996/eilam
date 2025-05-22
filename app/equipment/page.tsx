"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  PlusCircle,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  ListChecks,
  Lightbulb,
  ShieldCheck,
  Save,
  Filter,
  Search,
  Baby,
  Cat,
  Activity,
  Droplets,
  Pill,
  HeartHandshake,
  UsersIcon,
  X,
  Package,
  RotateCcw,
  Undo,
  Info,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { useRouter } from "next/navigation"
// Fix: Import locales dynamically to prevent initialization errors during prerendering
import { createClient } from "@supabase/supabase-js"
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service"
import { EquipmentService } from "@/lib/services/equipment-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
        <span className="text-sm font-medium text-[#005c72] dark:text-[#4db6c9]">{getStepText()}</span>
        <span className="text-sm font-medium text-[#005c72] dark:text-[#4db6c9]">{state.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-[#005c72] dark:bg-[#4db6c9] h-2.5 rounded-full transition-all duration-300 ease-in-out"
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
  // חדש: מעקב אחרי שדות שבהם נעשה שימוש בערכי ברירת מחדל
  const [defaultFields, setDefaultFields] = useState([])

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
    is_mandatory: false,
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
      const extractResponse = await fetch("/api/extract-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiUserPrompt }),
      })

      if (!extractResponse.ok) {
        throw new Error("Failed to extract data from prompt")
      }

      const extractedData = await extractResponse.json()

      // שמירת השדות שבהם נעשה שימוש בערכי ברירת מחדל
      if (extractedData.using_defaults && Array.isArray(extractedData.using_defaults)) {
        setDefaultFields(extractedData.using_defaults)
      }

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
        setAIGeneratedProfile(recommendations.profile || extractedData)

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
      is_mandatory: false,
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

  // Handle going back to the prompt screen
  const handleBackToPrompt = () => {
    setAIGeneratedProfile(null)
    setAIGeneratedItems([])
    setDefaultFields([])
    setCurrentListName("")
    setLoadingState({
      isLoading: false,
      step: "",
      progress: 0,
    })
  }

  // Initialize component
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Set default language and translations
        setLanguage("he")
        setTranslations(baseTranslations.he)

        // Load locales
        try {
          const { he } = await import("date-fns/locale/he")
          setCurrentLocale(he)
        } catch (error) {
          console.error("Error loading locales:", error)
        }

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
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 ${isRTL ? "rtl" : "ltr"}`}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {currentListName ? `${t.pageTitle}: ${currentListName}` : t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t.pageDescription}</p>
      </header>
      {lastSavedMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-center">
          {lastSavedMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-center">
          {error}
        </div>
      )}
      {!aiGeneratedProfile && !isListContextLoading ? (
        <Card className="shadow-lg dark:bg-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">{t.aiModalTitle}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">{t.aiPromptDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Textarea
                placeholder={t.aiPromptPlaceholder}
                value={aiUserPrompt}
                onChange={(e) => setAIUserPrompt(e.target.value)}
                className="h-40 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                rows={8}
              />
            </div>

            {loadingState.isLoading && (
              <div className="my-4">
                <LoadingIndicator state={loadingState} t={t} />
              </div>
            )}

            <Button
              onClick={handleSaveListAndGenerateItems}
              disabled={!aiUserPrompt.trim() || isAILoading}
              className="w-full bg-[#005c72] hover:bg-[#004a5d] text-white flex items-center justify-center gap-2"
            >
              {isAILoading ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              {t.aiGenerateButton}
            </Button>
          </CardContent>
        </Card>
      ) : aiGeneratedProfile && !isListContextLoading ? (
        <div className="space-y-6">
          {!aiGeneratedProfile.loadedFromExisting && (
            <Button onClick={handleBackToPrompt} variant="outline" className="mb-4 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {t.backToAI || "חזור ליצירת רשימה"}
            </Button>
          )}

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
                    {aiGeneratedItems.filter((item) => item.obtained).length} / {aiGeneratedItems.length}
                  </p>
                </Card>
                <Card className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-1">
                    {t.missingEssentialItems || "הכרחיים חסרים"}
                  </h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                    {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length}
                  </p>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-1">
                    {t.totalReadiness || "מוכנות כוללת"}
                  </h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                    {aiGeneratedItems.length > 0
                      ? Math.round(
                          (aiGeneratedItems.filter((item) => item.obtained).length / aiGeneratedItems.length) * 100,
                        )
                      : 0}
                    %
                  </p>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-1">
                    {t.categoriesCount || "קטגוריות"}
                  </h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                    {new Set(aiGeneratedItems.map((item) => item.category)).size}
                  </p>
                </Card>
              </div>
            </CardContent>
          </Card>

          {aiGeneratedProfile && (
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-500" /> {t.aiFamilyComposition}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiAdults}</p>
                      {defaultFields.includes("adults") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.adults || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiChildren}</p>
                      {defaultFields.includes("children") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.children || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiBabies}</p>
                      {defaultFields.includes("babies") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.babies || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.elderly}</p>
                      {defaultFields.includes("elderly") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.elderly || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiPets}</p>
                      {defaultFields.includes("pets") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.pets || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.durationHours || "משך זמן (שעות)"}</p>
                      {defaultFields.includes("duration_hours") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{t.defaultValueUsed}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.duration_hours || 72}</p>
                  </div>

                  {aiGeneratedProfile.special_needs && (
                    <div className="w-full mt-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.aiSpecialNeeds}</p>
                        {defaultFields.includes("special_needs") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{t.defaultValueUsed}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        {aiGeneratedProfile.special_needs}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length > 0 && (
            <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> {t.missingEssentialItemsTitle || "פריטים הכרחיים חסרים"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside pl-2">
                  {aiGeneratedItems
                    .filter((item) => item.importance >= 5 && !item.obtained)
                    .slice(0, 5)
                    .map((item) => (
                      <li key={item.id} className="text-sm text-red-600 dark:text-red-400">
                        {item.name} - {item.quantity} {item.unit}
                      </li>
                    ))}
                  {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length > 5 && (
                    <li className="text-xs text-red-500 dark:text-red-500 list-none pt-1">
                      {aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length - 5 === 1
                        ? "יש לרכוש פריט הכרחי נוסף אחד לשלמות הציוד"
                        : `יש לרכוש ${aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained).length - 5} פריטים הכרחיים נוספים לשלמות הציוד`}
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center mb-6">
                <div className="flex flex-1 md:max-w-md relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t.searchItemPlaceholder || "חפש פריט..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full ${isRTL ? "pr-10" : "pl-10"}`}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder={t.categoryFilterPlaceholder || "קטגוריה"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allCategories || "כל הקטגוריות"}</SelectItem>
                      {[
                        "water_food",
                        "medical",
                        "hygiene",
                        "lighting_energy",
                        "communication",
                        "documents_money",
                        "children",
                        "pets",
                        "elderly",
                        "special_needs",
                        "other",
                      ].map((key) => (
                        <SelectItem key={key} value={key}>
                          {t.aiCategories[key] || key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedImportance} onValueChange={setSelectedImportance}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder={t.importanceFilterPlaceholder || "חשיבות"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allLevels || "כל הרמות"}</SelectItem>
                      <SelectItem value="essential">{t.aiCategories.essential || "הכרחי"} (5)</SelectItem>
                      <SelectItem value="very_important">{t.aiCategories.very_important || "חשוב מאוד"} (4)</SelectItem>
                      <SelectItem value="important">{t.aiCategories.important || "חשוב"} (3)</SelectItem>
                      <SelectItem value="recommended">{t.aiCategories.recommended || "מומלץ"} (2)</SelectItem>
                      <SelectItem value="optional">{t.aiCategories.optional || "אופציונלי"} (1)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                      setSelectedImportance("all")
                    }}
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    {t.clearFiltersButton || "נקה"}
                  </Button>
                </div>
              </div>

              <Accordion
                type="single"
                collapsible
                className="w-full space-y-2"
                value={openAccordionItem}
                onValueChange={setOpenAccordionItem}
              >
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const categoryStyle = getCategoryStyle(item.category)
                    return (
                      <AccordionItem
                        value={item.id}
                        key={item.id}
                        className={`border dark:border-gray-700 rounded-lg transition-all duration-200 overflow-hidden ${
                          openAccordionItem === item.id
                            ? "bg-white dark:bg-gray-800 shadow-lg"
                            : "bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                        }`}
                      >
                        <AccordionTrigger
                          className={`p-3 sm:p-4 hover:no-underline group w-full ${isRTL ? "text-right" : "text-left"}`}
                        >
                          <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={item.obtained}
                                onCheckedChange={() => handleItemCheckboxChange(item.id, !item.obtained)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-green-600"
                              />
                              <Badge
                                variant="outline"
                                className={`text-xs transition-colors px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0 max-w-[120px] sm:max-w-none ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBg} ${categoryStyle.darkText} border-${item.category === "other" ? "gray" : item.category.split("_")[0]}-200 dark:border-${item.category === "other" ? "gray" : item.category.split("_")[0]}-800`}
                              >
                                {categoryStyle.icon &&
                                  React.cloneElement(categoryStyle.icon, { className: "h-3 w-3 flex-shrink-0" })}
                                <span className="truncate">{t.aiCategories[item.category] || item.category}</span>
                              </Badge>
                              {item.is_mandatory && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                >
                                  {t.mandatoryItem || "פריט חובה"}
                                </Badge>
                              )}
                            </div>

                            <div
                              className={`flex flex-col items-start gap-0.5 sm:gap-1 min-w-0 flex-1 ${isRTL ? "order-1 sm:order-2 text-right" : "order-2 sm:order-2 text-left"}`}
                            >
                              <span
                                className={`font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate w-full ${item.obtained ? "line-through text-gray-400 dark:text-gray-500" : ""}`}
                              >
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="truncate">
                                  {item.quantity} {item.unit}
                                </span>
                                {item.shelf_life && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                                    <span className="hidden sm:inline truncate">{item.shelf_life}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div
                              className={`flex flex-col xs:flex-row items-end xs:items-center gap-1 xs:gap-2 shrink-0 ${isRTL ? "order-3 sm:order-3 mr-auto" : "order-3 sm:order-3 ml-auto"}`}
                            >
                              {getImportanceBadge(item.importance, true)}

                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveItem(item.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                          <div className="pt-2 border-t dark:border-gray-700">
                            <div className="grid gap-3 sm:gap-4 mt-2">
                              {item.description && (
                                <div>
                                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                    {t.description || "תיאור"}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    {item.description}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {item.recommended_quantity_per_person && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.recommended_quantity_per_person_label}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.recommended_quantity_per_person}
                                    </p>
                                  </div>
                                )}
                                {item.usage_instructions && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.usage_instructions_label}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.usage_instructions}
                                    </p>
                                  </div>
                                )}
                                {item.shelf_life && (
                                  <div className="block sm:hidden">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.shelf_life_label}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.shelf_life}
                                    </p>
                                  </div>
                                )}
                                {item.personalized_note && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      הערה מותאמת אישית
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.personalized_note}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t.noItemsFound || "לא נמצאו פריטים התואמים את החיפוש"}
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                        setSelectedImportance("all")
                      }}
                      className="mt-2"
                    >
                      {t.showAllItemsButton || "הצג את כל הפריטים"}
                    </Button>
                  </div>
                )}
              </Accordion>

              <div className="mt-6">
                {error && <div className="text-red-500 mb-4">{error}</div>}
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button variant="destructive" className="flex-1 gap-2" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                      {t.cancelEditing}
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsAddItemDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                      {t.addItem}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleUndo}
                      disabled={itemHistory.length === 0}
                    >
                      <Undo className="h-4 w-4" />
                      {t.undoAction}
                    </Button>
                    <Button
                      className="flex-1 bg-[#005c72] hover:bg-[#004a5d] text-white gap-2"
                      onClick={saveAIGeneratedList}
                    >
                      <Save className="h-4 w-4" />
                      {t.saveChanges}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4" />
                      {t.editList}
                    </Button>
                    <Button
                      className="flex-1 bg-[#005c72] hover:bg-[#004a5d] text-white gap-2"
                      onClick={saveAIGeneratedList}
                    >
                      <Save className="h-4 w-4" />
                      {t.aiSaveList}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent
          className={`max-w-md ${isRTL ? "rtl" : "ltr"} sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto`}
        >
          <DialogHeader>
            <DialogTitle>{t.addNewItem || "הוספת פריט חדש"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName">{t.itemName || "שם הפריט"} *</Label>
              <Input
                id="itemName"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="itemCategory">{t.itemCategory || "קטגוריה"}</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger id="itemCategory" className="w-full">
                  <SelectValue placeholder={t.itemCategory} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(t.aiCategories)
                    .filter(
                      (key) =>
                        ![
                          "default_unit",
                          "recommended_quantity_per_person_label",
                          "usage_instructions_label",
                          "shelf_life_label",
                          "essential",
                          "very_important",
                          "important",
                          "recommended",
                          "optional",
                        ].includes(key),
                    )
                    .map((key) => (
                      <SelectItem key={key} value={key}>
                        {t.aiCategories[key]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemQuantity">{t.itemQuantity || "כמות"}</Label>
                <Input
                  id="itemQuantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemUnit">{t.itemUnit || "יחידת מידה"}</Label>
                <Input
                  id="itemUnit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="itemImportance">{t.itemImportance || "חשיבות"}</Label>
              <Select
                value={String(newItem.importance)}
                onValueChange={(value) => setNewItem({ ...newItem, importance: Number.parseInt(value) })}
              >
                <SelectTrigger id="itemImportance" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{t.aiCategories?.essential || "הכרחי"} (5)</SelectItem>
                  <SelectItem value="4">{t.aiCategories?.very_important || "חשוב מאוד"} (4)</SelectItem>
                  <SelectItem value="3">{t.aiCategories?.important || "חשוב"} (3)</SelectItem>
                  <SelectItem value="2">{t.aiCategories?.recommended || "מומלץ"} (2)</SelectItem>
                  <SelectItem value="1">{t.aiCategories?.optional || "אופציונלי"} (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="is_mandatory"
                checked={newItem.is_mandatory}
                onCheckedChange={(checked) => setNewItem({ ...newItem, is_mandatory: !!checked })}
              />
              <Label htmlFor="is_mandatory">{t.mandatoryItem || "פריט חובה"}</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="itemDescription">{t.itemDescription || "תיאור"}</Label>
              <Textarea
                id="itemDescription"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="itemUsageInstructions">{t.itemUsageInstructions || "הוראות שימוש"}</Label>
              <Textarea
                id="itemUsageInstructions"
                value={newItem.usage_instructions}
                onChange={(e) => setNewItem({ ...newItem, usage_instructions: e.target.value })}
                placeholder={t.usageInstructionsPlaceholder || "הוראות שימוש והערות חשובות"}
                className="w-full min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)} className="w-full sm:w-auto">
              {t.cancel || "ביטול"}
            </Button>
            <Button
              className="w-full sm:w-auto bg-[#005c72] hover:bg-[#004a5d] text-white"
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
            >
              {t.add || "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.removeItemConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.removeItemDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel>{t.cancelRemove}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem} className="bg-red-500 hover:bg-red-600">
              {t.confirmRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
