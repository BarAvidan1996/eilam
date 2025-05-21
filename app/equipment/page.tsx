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
  CalendarIcon,
  Bell,
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
  BellOff,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
// Fix: Import locales dynamically to prevent initialization errors during prerendering
import { createClient } from "@supabase/supabase-js"
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service"

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
const EquipmentList = {
  async getAll() {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("equipment_lists")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching equipment lists:", error)
      return mockEquipmentLists // Fallback to mock data
    }
  },

  async get(id) {
    try {
      const supabase = createSupabaseClient()

      // Get the list
      const { data: list, error: listError } = await supabase.from("equipment_lists").select("*").eq("id", id).single()

      if (listError) throw listError

      // Get the items for this list
      const { data: items, error: itemsError } = await supabase.from("equipment_items").select("*").eq("list_id", id)

      if (itemsError) throw itemsError

      return { ...list, items: items || [] }
    } catch (error) {
      console.error(`Error fetching equipment list ${id}:`, error)
      return mockEquipmentLists[0] // Fallback to first mock list
    }
  },

  async create(listData) {
    try {
      const supabase = createSupabaseClient()

      // Create the list
      const { data: list, error: listError } = await supabase
        .from("equipment_lists")
        .insert({
          title: listData.name,
          user_id: "705cfb06-546c-49b4-8f60-d970eecc6b9d", // Default user ID
          is_favorite: false,
        })
        .select()
        .single()

      if (listError) throw listError

      // Create the items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: list.id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          obtained: item.obtained || false,
          expiry_date: item.expiryDate,
          send_reminder: item.sendExpiryReminder || false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
        }))

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      return list
    } catch (error) {
      console.error("Error creating equipment list:", error)
      return { id: "mock-id-" + Date.now(), ...listData } // Return mock data with generated ID
    }
  },

  async update(id, listData) {
    try {
      const supabase = createSupabaseClient()

      // Update the list
      const { error: listError } = await supabase.from("equipment_lists").update({ title: listData.name }).eq("id", id)

      if (listError) throw listError

      // Delete existing items
      const { error: deleteError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (deleteError) throw deleteError

      // Create new items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          obtained: item.obtained || false,
          expiry_date: item.expiryDate,
          send_reminder: item.sendExpiryReminder || false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
        }))

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      return { id, ...listData }
    } catch (error) {
      console.error(`Error updating equipment list ${id}:`, error)
      return { id, ...listData } // Return the data that was passed in
    }
  },

  async delete(id) {
    try {
      const supabase = createSupabaseClient()

      // Delete items first (foreign key constraint)
      const { error: itemsError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (itemsError) throw itemsError

      // Delete the list
      const { error: listError } = await supabase.from("equipment_lists").delete().eq("id", id)

      if (listError) throw listError

      return true
    } catch (error) {
      console.error(`Error deleting equipment list ${id}:`, error)
      return false
    }
  },
}

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
        savedListResponse = await EquipmentList.update(existingListId, listToSave)
        setLastSavedMessage(t.listUpdatedSuccessfully || "הרשימה עודכנה בהצלחה!")
      } else {
        // When creating a new list, items may have aiSuggestedExpiryDate.
        // We want to initialize expiryDate with aiSuggestedExpiryDate if available.
        listToSave.items = listToSave.items.map((it) => ({
          ...it,
          expiryDate: it.expiryDate || it.aiSuggestedExpiryDate || null,
        }))
        savedListResponse = await EquipmentList.create(listToSave)
        setLastSavedMessage(t.listCreatedSuccessfully || "הרשימה נוצרה בהצלחה!")
      }

      router.push("/equipment-lists?refresh=" + new Date().getTime())
    } catch (error) {
      console.error("Error saving list:", error)
      setError(t.errorSavingList || "שגיאה בשמירת הרשימה.")
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
          const listData = await EquipmentList.get(listId)
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
      await EquipmentList.update(listId, {
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
            )}
          </div>
        </div>
      )
    } else if (item.expiryDate) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="font-medium">{t.expiryDate || "תאריך תפוגה"}: </span>
          {format(parseISO(item.expiryDate), "PPP", { locale: currentLocale })}
          {item.sendExpiryReminder && <Bell className="h-3 w-3 text-purple-600 inline-block ml-1 rtl:mr-1" />}
        </p>
      )
    } else if (item.aiSuggestedExpiryDate && !isEditing) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="font-medium">{t.expiryDate || "תאריך תפוגה"}: </span>
          {format(parseISO(item.aiSuggestedExpiryDate), "PPP", { locale: currentLocale })}
        </p>
      )
    }
    return !isEditing ? (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.noExpiryDate || "אין תאריך תפוגה"}</p>
    ) : null
  }

  // Loading state
  if (isLoading || isListContextLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loading || "טוען..."}</p>
        </div>
      </div>
    )
  }

  // Fix: Check if currentLocale is available before rendering date-related components
  if (!currentLocale) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">טוען הגדרות שפה...</p>
        </div>
      </div>
    )
  }

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
            <Button
              onClick={handleAIGenerateRecommendations}
              disabled={!aiUserPrompt.trim() || isAILoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
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
                <Card className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-1">
                    {t.categoriesCount || "קטגוריות"}
                  </h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                    {new Set(aiGeneratedItems.map((item) => item.category)).size}
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
                <Card className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-1">
                    {t.missingEssentialItems || "הכרחיים חסרים"}
                  </h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                    {getMissingEssentialItems().length}
                  </p>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                    {t.itemsChecked || "פריטים שנבדקו"}
                  </h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {getObtainedItemsCount()} / {aiGeneratedItems.length}
                  </p>
                </Card>
              </div>
            </CardContent>
          </Card>

          {aiGeneratedProfile && (
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-purple-500" /> {t.aiFamilyComposition}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiAdults}</p>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.adults || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiChildren}</p>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.children || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiBabies}</p>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.babies || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiPets}</p>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.pets || 0}</p>
                  </div>
                  <div className="min-w-28">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.durationHours || "משך זמן (שעות)"}</p>
                    <p className="text-xl font-semibold">{aiGeneratedProfile.duration_hours || 72}</p>
                  </div>

                  {aiGeneratedProfile.special_needs && (
                    <div className="w-full mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.aiSpecialNeeds}</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                        {aiGeneratedProfile.special_needs}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {getMissingEssentialItems().length > 0 && (
            <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> {t.missingEssentialItemsTitle || "פריטים הכרחיים חסרים"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside pl-2">
                  {getMissingEssentialItems()
                    .slice(0, 5)
                    .map((item) => (
                      <li key={item.id} className="text-sm text-red-600 dark:text-red-400">
                        {item.name} - {item.quantity} {item.unit}
                      </li>
                    ))}
                  {getMissingEssentialItems().length > 5 && (
                    <li className="text-xs text-red-500 dark:text-red-500 list-none pt-1">
                      {getMissingEssentialItems().length - 5 === 1
                        ? "יש לרכוש פריט הכרחי נוסף אחד לשלמות הציוד"
                        : `יש לרכוש ${getMissingEssentialItems().length - 5} פריטים הכרחיים נוספים לשלמות הציוד`}
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
                          {aiCategories[key] || key}
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
                      <SelectItem value="הכרחי">{t.aiCategories.essential || "הכרחי"} (5)</SelectItem>
                      <SelectItem value="חשוב מאוד">{t.aiCategories.very_important || "חשוב מאוד"} (4)</SelectItem>
                      <SelectItem value="חשוב">{t.aiCategories.important || "חשוב"} (3)</SelectItem>
                      <SelectItem value="מומלץ">{t.aiCategories.recommended || "מומלץ"} (2)</SelectItem>
                      <SelectItem value="אופציונלי">{t.aiCategories.optional || "אופציונלי"} (1)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={clearFilters} className="flex items-center gap-1">
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
                                onCheckedChange={() => toggleItemObtained(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-green-600"
                              />
                              <Badge
                                variant="outline"
                                className={`text-xs transition-colors px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0 max-w-[120px] sm:max-w-none ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBg} ${categoryStyle.darkText} border-${item.category === "other" ? "gray" : item.category.split("_")[0]}-200 dark:border-${item.category === "other" ? "gray" : item.category.split("_")[0]}-800`}
                              >
                                {categoryStyle.icon &&
                                  React.cloneElement(categoryStyle.icon, { className: "h-3 w-3 flex-shrink-0" })}
                                <span className="truncate">
                                  {getCategoryDisplayName(item.category) || item.category}
                                </span>
                              </Badge>
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
                                    handleRemoveItemConfirm(item)
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
                                {renderExpiryControls(item)}
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
                    <Button variant="link" onClick={clearFilters} className="mt-2">
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
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleAddItem}>
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
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2" onClick={handleSaveChanges}>
                      <Save className="h-4 w-4" />
                      {t.saveChanges}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                    {t.editList}
                  </Button>
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
                  {Object.keys(aiCategories)
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
                        {aiCategories[key]}
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

            <div className="grid gap-2">
              <Label htmlFor="newItemExpiryDate">{t.expiryDate || "תאריך תפוגה"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="newItemExpiryDate"
                    className={`w-full justify-start text-left font-normal ${!newItem.expiryDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newItem.expiryDate ? (
                      format(parseISO(newItem.expiryDate), "PPP", { locale: currentLocale })
                    ) : (
                      <span>{t.setExpiryDate || "הגדר תאריך תפוגה"}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newItem.expiryDate ? parseISO(newItem.expiryDate) : undefined}
                    onSelect={(date) =>
                      setNewItem({ ...newItem, expiryDate: date ? format(date, "yyyy-MM-dd") : null })
                    }
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 20}
                    locale={currentLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="newItemSendReminder"
                checked={newItem.sendExpiryReminder}
                onCheckedChange={(checked) => setNewItem({ ...newItem, sendExpiryReminder: !!checked })}
              />
              <Label
                htmlFor="newItemSendReminder"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {t.sendReminder || "שלח לי תזכורת"}
              </Label>
              {newItem.sendExpiryReminder ? (
                <Bell className="h-4 w-4 text-purple-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)} className="w-full sm:w-auto">
              {t.cancel || "ביטול"}
            </Button>
            <Button
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
              onClick={handleSaveNewItem}
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
            <AlertDialogAction onClick={handleRemoveItem} className="bg-red-500 hover:bg-red-600">
              {t.confirmRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
