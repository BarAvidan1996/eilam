"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Trash2,
  AlertTriangle,
  ListChecks,
  Lightbulb,
  ShieldCheck,
  Filter,
  Search,
  Baby,
  Cat,
  Activity,
  Pill,
  HeartHandshake,
  UsersIcon,
  RotateCcw,
  Info,
  Sparkles,
  FileText,
  Droplets,
  Pencil,
  X,
  Plus,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"
import { EquipmentService } from "@/lib/services/equipment-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

const requiredFieldStyle = "text-red-500 ml-1"

// Define mandatory items that must be included - moved to component level
const MANDATORY_ITEMS = [
  {
    id: "mandatory-1",
    name: "מים (3 ליטר לאדם ליום)",
    category: "water_food",
    importance: 5,
    description: "מים לשתייה ולשימוש בסיסי. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לאחסן במקום קריר ויבש. מומלץ להחליף כל שנה.",
    recommended_quantity_per_person: "3 ליטר ליום",
    is_mandatory: true,
  },
  {
    id: "mandatory-2",
    name: "מזון יבש/משומר",
    category: "water_food",
    importance: 5,
    description: "מזון שאינו דורש קירור או בישול. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לבדוק תאריכי תפוגה ולהחליף בהתאם.",
    recommended_quantity_per_person: "מנה ליום",
    is_mandatory: true,
  },
  {
    id: "mandatory-3",
    name: "ערכת עזרה ראשונה",
    category: "medical",
    importance: 5,
    description: "ערכה בסיסית לטיפול בפציעות קלות. פריט חובה של פיקוד העורף.",
    shelf_life: "שנתיים",
    usage_instructions: "יש לבדוק שלמות ותקינות הפריטים אחת לחצי שנה.",
    recommended_quantity_per_person: "1 ערכה למשפחה",
    is_mandatory: true,
  },
  {
    id: "mandatory-4",
    name: "תרופות קבועות + מרשמים מודפסים",
    category: "medical",
    importance: 5,
    description: "תרופות קבועות לבני המשפחה ומרשמים מודפסים. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לתרופה",
    usage_instructions: "יש לוודא מלאי לפחות לשבוע ימים ולבדוק תאריכי תפוגה.",
    recommended_quantity_per_person: "לפי הצורך הרפואי",
    is_mandatory: true,
  },
  {
    id: "mandatory-5",
    name: "רדיו + סוללות",
    category: "communication",
    importance: 5,
    description: "רדיו המופעל על סוללות לקבלת עדכונים. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
    recommended_quantity_per_person: "1 רדיו למשפחה",
    is_mandatory: true,
  },
  {
    id: "mandatory-6",
    name: "פנסים + סוללות",
    category: "lighting_energy",
    importance: 5,
    description: "פנסים לתאורת חירום. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
    recommended_quantity_per_person: "1 פנס לאדם",
    is_mandatory: true,
  },
  {
    id: "mandatory-7",
    name: "מטענים ניידים לטלפונים",
    category: "communication",
    importance: 5,
    description: "מטענים ניידים לטעינת טלפונים ניידים. פריט חובה של פיקוד העורף.",
    shelf_life: "3 שנים",
    usage_instructions: "יש לוודא שהמטענים טעונים במלואם.",
    recommended_quantity_per_person: "1 מטען לטלפון",
    is_mandatory: true,
  },
  {
    id: "mandatory-8",
    name: "ציוד ייחודי לתינוקות/קשישים/חיות מחמד",
    category: "other",
    importance: 5,
    description: "ציוד ייחודי בהתאם לצרכים המיוחדים של בני המשפחה. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לצרכים הספציפיים של המשפחה.",
    recommended_quantity_per_person: "לפי הצורך",
    is_mandatory: true,
  },
  {
    id: "mandatory-9",
    name: "עותקים של מסמכים חשובים",
    category: "documents_money",
    importance: 5,
    description: "עותקים של תעודות זהות, דרכונים, רישיונות וכו'. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום אטום למים ולעדכן בהתאם לשינויים.",
    recommended_quantity_per_person: "עותק לכל מסמך",
    is_mandatory: true,
  },
  {
    id: "mandatory-10",
    name: "מטף כיבוי אש",
    category: "other",
    importance: 5,
    description: "מטף לכיבוי שריפות קטנות. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לשנה ולתחזק בהתאם להוראות היצרן.",
    recommended_quantity_per_person: "1 מטף למשפחה",
    is_mandatory: true,
  },
  {
    id: "mandatory-11",
    name: "חצי מיכל דלק ברכב",
    category: "other",
    importance: 5,
    description: "שמירה על לפחות חצי מיכל דלק ברכב. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לוודא שהרכב תמיד עם לפחות חצי מיכל דלק.",
    recommended_quantity_per_person: "חצי מיכל",
    is_mandatory: true,
  },
  {
    id: "mandatory-12",
    name: "משחקים ופעילויות לילדים",
    category: "children",
    importance: 5,
    description: "משחקים ופעילויות להפגת מתח ושעמום. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש להתאים לגיל הילדים ולהעדפותיהם.",
    recommended_quantity_per_person: "לפי מספר הילדים",
    is_mandatory: true,
  },
  {
    id: "mandatory-13",
    name: "ציוד בסיסי לחיות מחמד",
    category: "pets",
    importance: 5,
    description: "מזון, מים, ותרופות לחיות המחמד. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לסוג חיית המחמד ולצרכיה.",
    recommended_quantity_per_person: "לפי מספר החיות",
    is_mandatory: true,
  },
]

// Helper functions for calculating quantities and units
function calculateQuantity(itemName: string, profile: any): number {
  if (!profile) return 1

  const totalPeople = (profile.adults || 1) + (profile.children || 0) + (profile.babies || 0) + (profile.elderly || 0)
  const days = Math.ceil((profile.duration_hours || 72) / 24)

  if (itemName.includes("מים")) {
    return 3 * totalPeople * days // 3 liters per person per day
  } else if (itemName.includes("מזון")) {
    return totalPeople * days // 1 unit per person per day
  } else if (itemName.includes("חיות מחמד") && profile.pets) {
    return profile.pets // 1 unit per pet
  } else if (itemName.includes("משחקים") && profile.children) {
    return profile.children // 1 unit per child
  }

  return 1
}

function getUnitForItem(itemName: string): string {
  if (itemName.includes("מים")) return "ליטרים"
  if (itemName.includes("מזון")) return "מנות"
  return "יחידות"
}

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
    removeItem: "Remove Item",
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
    saveList: "שמור רשימה",
  },
  en: {
    pageTitle: "Emergency Equipment Management",
    pageDescription: "Create, edit, and manage essential equipment lists for emergencies.",
    createListAI: "Create List with AI",
    createListManual: "Create List Manually",
    myLists: "My Lists",
    noListsYet: "You haven't created any equipment lists yet.",
    noListsYetDescription: "Click 'Create List Manually' or 'Create List with AI' to get started.",
    selectListPrompt: "Select a list to display or create a new one.",
    createNewListButtonPrompt: "Create New List",
    exportList: "Export List",
    editListDetails: "Edit List Details",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "Category:",
    expiryLabel: "Expires:",
    addItemToList: "Add Item to List",
    reminders: "Reminders",
    deleteItem: "Delete Item",
    createListModalTitle: "Create New List",
    listNameLabel: "List Name",
    listDescriptionLabel: "Description (optional)",
    cancel: "Cancel",
    aiModalTitle: "Smart AI Equipment List Creation",
    aiPromptDescription:
      "Tell us about yourself and your household so we can customize the recommended equipment list for you.",
    aiPromptPlaceholder:
      "For example: I live in an apartment with my husband and a 5-year-old daughter. We have a cat. I have a mobility disability and use a walker. We live on the 2nd floor without an elevator.",
    aiGenerateButton: "Generate AI Recommendations",
    aiGenerating: "Generating personalized list...",
    aiItemsTitle: "AI Recommended Items",
    aiListNamePlaceholder: "e.g., Smart Family Emergency List",
    aiSaveList: "Save Recommended List",
    aiSavedSuccess: "List saved successfully!",
    aiGoToList: "Go to List",
    aiBack: "Back",
    aiFamilyComposition: "Family Composition",
    aiAdults: "Adults",
    aiChildren: "Children",
    aiBabies: "Babies",
    aiPets: "Pets",
    aiSpecialNeeds: "Special Needs",
    aiNeedsAttention: "Needs Attention",
    aiCategories: {
      water_food: "Water & Food",
      medical: "Medical Equipment",
      hygiene: "Hygiene",
      lighting_energy: "Lighting & Energy",
      communication: "Communication",
      documents_money: "Documents & Money",
      children: "Children",
      pets: "Pets",
      elderly: "Elderly",
      special_needs: "Special Needs",
      other: "General Equipment",
      essential: "Essential",
      very_important: "Very Important",
      important: "Important",
      recommended: "Recommended",
      optional: "Optional",
      recommended_quantity_per_person_label: "Recommended Quantity per Person",
      usage_instructions_label: "Usage Instructions",
      shelf_life_label: "Shelf Life",
      default_unit: "Units",
    },
    categories: [
      "Food & Water",
      "Medical & Hygiene",
      "Lighting & Energy",
      "Communication",
      "Documents & Money",
      "Clothing & Miscellaneous",
    ],
    summaryTitle: "Your Equipment Summary",
    categoriesCount: "Categories",
    totalReadiness: "Total Readiness",
    missingEssentialItems: "Essential Missing",
    itemsChecked: "Items Checked",
    backToAI: "Back to AI Prompt",
    missingEssentialItemsTitle: "Missing Essential Items",
    andMoreMissing: "And {count} more essential items missing...",
    allItemsTitle: "All Items in List",
    searchItemPlaceholder: "Search item...",
    categoryFilterPlaceholder: "Category",
    allCategories: "All Categories",
    importanceFilterPlaceholder: "Importance",
    allLevels: "All Levels",
    clearFiltersButton: "Clear",
    noItemsFound: "No items found matching your search",
    showAllItemsButton: "Show All Items",
    description: "Description",
    quantity: "Quantity",
    important: "Important",
    durationHours: "Duration (hours)",
    moreEssentialsMissing: "You need to acquire {count} more essential items for complete preparedness",
    editList: "Edit List",
    cancelEditing: "Cancel Editing",
    addItem: "Add Item",
    saveChanges: "Save Changes",
    addNewItem: "Add New Item",
    itemName: "Item Name",
    itemCategory: "Category",
    itemQuantity: "Quantity",
    itemUnit: "Unit",
    itemImportance: "Importance",
    itemDescription: "Description",
    itemShelfLife: "Shelf Life",
    itemUsageInstructions: "Usage Instructions",
    itemRecommendedQuantity: "Recommended Quantity per Person",
    cancel: "Cancel",
    add: "Add",
    undoAction: "Undo Last Action",
    removeItem: "Remove Item",
    removeItemConfirm: "Are you sure you want to remove this item?",
    removeItemDescription: "This action will remove the item from the list and cannot be undone.",
    confirmRemove: "Remove",
    cancelRemove: "Cancel",
    enterListNamePrompt: "Enter a name for the new list:",
    defaultNewListName: "New List",
    listNameCannotBeEmpty: "List name cannot be empty.",
    notSpecified: "Not Specified",
    errorProvideListNameOrProfile: "Please provide a list name or profile details to create a personalized list.",
    equipmentListFor: "Equipment list for",
    adults: "adults",
    listUpdatedSuccessfully: "List updated successfully!",
    listCreatedSuccessfully: "List created successfully!",
    errorSavingList: "Error saving list. Please try again.",
    errorNoListToUpdate: "No list selected for updating.",
    changesSavedSuccessfully: "Changes saved successfully!",
    errorSavingChanges: "Error saving changes.",
    expiryDate: "Expiry Date",
    setExpiryDate: "Set Expiry Date",
    sendReminder: "Send me a reminder",
    aiSuggestedExpiry: "AI Suggested Expiry: ",
    noExpiryDate: "No expiry date",
    days: "days",
    unknownItem: "Unknown Item",
    usageInstructionsPlaceholder: "Usage instructions and important notes",
    saveList: "Save List",
  },
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
  emergency: <ShieldCheck className="h-5 w-5" />,
  food: <Droplets className="h-5 w-5" />,
  pet: <Cat className="h-5 w-5" />,
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
        <span className="text-sm font-medium text-[#005c72] dark:text-[#d3e3fd]">{getStepText()}</span>
        <span className="text-sm font-medium text-[#005c72] dark:text-[#d3e3fd]">{state.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-[#005c72] dark:bg-[#d3e3fd] h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${state.progress}%` }}
        ></div>
      </div>
    </div>
  )
}

// Define category colors
const categoryColors = {
  water_food: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900/20",
    darkText: "dark:text-blue-300",
    icon: categoryIcons.water_food,
  },
  medical: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/20",
    darkText: "dark:text-red-300",
    icon: categoryIcons.medical,
  },
  hygiene: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/20",
    darkText: "dark:text-green-300",
    icon: categoryIcons.hygiene,
  },
  lighting_energy: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    darkBg: "dark:bg-yellow-900/20",
    darkText: "dark:text-yellow-300",
    icon: categoryIcons.lighting_energy,
  },
  communication: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    darkBg: "dark:bg-purple-900/20",
    darkText: "dark:text-purple-300",
    icon: categoryIcons.communication,
  },
  documents_money: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-900/20",
    darkText: "dark:text-gray-300",
    icon: categoryIcons.documents_money,
  },
  children: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    darkBg: "dark:bg-pink-900/20",
    darkText: "dark:text-pink-300",
    icon: categoryIcons.children,
  },
  pets: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    darkBg: "dark:bg-orange-900/20",
    darkText: "dark:text-orange-300",
    icon: categoryIcons.pets,
  },
  elderly: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    darkBg: "dark:bg-teal-900/20",
    darkText: "dark:text-teal-300",
    icon: categoryIcons.elderly,
  },
  special_needs: {
    bg: "bg-lime-50",
    text: "text-lime-700",
    darkBg: "dark:bg-lime-900/20",
    darkText: "dark:text-lime-300",
    icon: categoryIcons.special_needs,
  },
  other: {
    bg: "bg-stone-50",
    text: "text-stone-700",
    darkBg: "dark:bg-stone-900/20",
    darkText: "dark:text-stone-300",
    icon: categoryIcons.other,
  },
  emergency: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
    icon: categoryIcons.emergency,
  },
  food: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
    icon: categoryIcons.food,
  },
  pet: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    darkBg: "dark:bg-orange-900/30",
    darkText: "dark:text-orange-400",
    icon: categoryIcons.pet,
  },
}

export default function EquipmentPage({ initialList = null }: { initialList?: any }) {
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
  const [selectedItemType, setSelectedItemType] = useState("all") // "all", "mandatory", "personalized"
  const [filteredItems, setFilteredItems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  // Fix: Initialize locale states with null and set them in useEffect
  const [currentLocale, setCurrentLocale] = useState(null)
  // חדש: מעקב אחרי שדות שבהם נעשה שימוש בערכי ברירת מחדל
  const [defaultFields, setDefaultFields] = useState([])
  const { toast } = useToast()

  // חדש: מצב טעינה מפורט
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    step: "", // "extracting", "generating", "processing", "finalizing"
    progress: 0, // 0-100
  })

  const t = translations

  const [newItem, setnewItem] = useState({
    name: "",
    category: "water_food",
    quantity: 1,
    unit: "יחידות", // Default unit
    importance: 3,
    description: "",
    expiryDate: null,
    sms_notification: false,
    usage_instructions: "",
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
      // הכנת הנתונים לשמירה
      const listToSave = {
        name: currentListName,
        items: aiGeneratedItems.map((item) => ({
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          obtained: item.obtained || false,
          importance: item.importance || 3,
          description: item.description || "",
          expiryDate: item.expiryDate || null,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
        })),
      }

      console.log("💾 Saving list with name:", currentListName)
      console.log("📋 List has", listToSave.items.length, "items")

      let savedList
      if (initialList && initialList.id) {
        console.log("🔄 Updating existing list with ID:", initialList.id)
        savedList = await EquipmentService.updateList(initialList.id, listToSave)
        setLastSavedMessage(t.changesSavedSuccessfully || "השינויים נשמרו בהצלחה!")
      } else {
        console.log("➕ Creating new list")
        savedList = await EquipmentService.createList(listToSave)
        setLastSavedMessage(t.listCreatedSuccessfully || "הרשימה נוצרה בהצלחה!")

        // מעבר לדף הרשימה החדשה
        if (savedList && savedList.id) {
          console.log("✅ List created with ID:", savedList.id)
          setTimeout(() => {
            router.push(`/equipment/${savedList.id}`)
          }, 1000)
        } else {
          console.error("❌ Created list has no ID:", savedList)
          setError("הרשימה נוצרה אך חסר מזהה. נא לרענן את הדף.")
        }
      }
    } catch (error) {
      console.error("❌ Error saving list:", error)
      setError(t.errorSavingList || "שגיאה בשמירת הרשימה. נסה שוב.")
    } finally {
      setIsAILoading(false)
    }
  }

  // Filter items based on search query, category, importance, and item type
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
      const matchesItemType =
        selectedItemType === "all" ||
        (selectedItemType === "mandatory" && item.is_mandatory) ||
        (selectedItemType === "personalized" && !item.is_mandatory)

      return matchesSearch && matchesCategory && matchesImportance && matchesItemType
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
    setnewItem({
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

        // אם יש רשימה קיימת, טען אותה
        if (initialList) {
          setAIGeneratedItems(initialList.items || [])
          setAIGeneratedProfile(initialList.profile || JSON.parse(initialList.description || "{}"))
          setCurrentListName(initialList.name || initialList.title)
          setIsLoading(false)
          return
        }

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
  }, [initialList])

  // Update filtered items when search query, category, importance, or item type changes
  useEffect(() => {
    setFilteredItems(filterItems(aiGeneratedItems))
  }, [searchQuery, selectedCategory, selectedImportance, selectedItemType, aiGeneratedItems])

  // Count mandatory and personalized items
  const mandatoryItemsCount = aiGeneratedItems.filter((item) => item.is_mandatory).length
  const personalizedItemsCount = aiGeneratedItems.filter((item) => !item.is_mandatory).length

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
              className="w-full bg-[#005c72] hover:bg-[#005c72]/90 dark:bg-[#d3e3fd] dark:hover:bg-[#d3e3fd]/90 text-white dark:text-black flex items-center justify-center gap-2"
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

              {/* New summary for mandatory and personalized items */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                    {t.mandatoryItemsCount || "פריטי חובה"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{mandatoryItemsCount}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ShieldCheck className="h-5 w-5 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{t.mandatoryItemTooltip || "ציוד מומלץ על-פי פיקוד העורף"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Card>
                <Card className="bg-[#005c72]/10 dark:bg-[#005c72]/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-[#005c72] dark:text-white mb-1">
                    {t.personalizedItemsCount || "פריטים מותאמים אישית"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-[#005c72] dark:text-white">{personalizedItemsCount}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Sparkles className="h-5 w-5 text-[#005c72] dark:text-white" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{t.personalizedItemTooltip || "פריט שהותאם במיוחד לצרכים שלך"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                        {typeof aiGeneratedProfile.special_needs === "object"
                          ? JSON.stringify(aiGeneratedProfile.special_needs)
                          : aiGeneratedProfile.special_needs}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
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

                  {/* New filter for item type */}
                  <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="סוג פריט" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.showAllItems || "הצג את כל הפריטים"}</SelectItem>
                      <SelectItem value="mandatory">{t.showMandatoryOnly || "הצג רק פריטי חובה"}</SelectItem>
                      <SelectItem value="personalized">
                        {t.showPersonalizedOnly || "הצג רק פריטים מותאמים אישית"}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                      setSelectedImportance("all")
                      setSelectedItemType("all")
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
                        } ${!item.is_mandatory ? "border-l-4 border-l-[#005c72] dark:border-l-[#005c72]" : ""}`}
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
                                className={`text-xs transition-colors px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0 max-w-[120px] sm:max-w-none ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.darkBg} ${categoryStyle.darkText}`}
                              >
                                {getCategoryStyle(item.category).icon}
                                <span className="truncate">{t.aiCategories[item.category] || item.category}</span>
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

                              {item.is_mandatory && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className="text-xs ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                      >
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        {t.mandatoryItem}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{t.mandatoryItemTooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {!item.is_mandatory && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className="text-xs ml-1 bg-[#005c72]/10 text-[#005c72] dark:bg-[#005c72]/20 dark:text-white border-[#005c72]/20 dark:border-[#005c72]/40"
                                      >
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {t.personalizedItem}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{t.personalizedItemTooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditItem(item)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

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
                                <div>
                                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                    כמות ויחידה
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    {item.quantity} {item.unit}
                                  </p>
                                </div>

                                {item.shelf_life && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.shelf_life_label || "חיי מדף"}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.shelf_life}
                                    </p>
                                  </div>
                                )}

                                {item.recommended_quantity_per_person && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.recommended_quantity_per_person_label || "כמות מומלצת לאדם"}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.recommended_quantity_per_person}
                                    </p>
                                  </div>
                                )}

                                {item.usage_instructions && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.aiCategories.usage_instructions_label || "הוראות שימוש"}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.usage_instructions}
                                    </p>
                                  </div>
                                )}

                                {item.expiryDate && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                                      {t.expiryDate || "תאריך תפוגה"}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {item.expiryDate}
                                    </p>
                                  </div>
                                )}

                                {item.personalized_note && (
                                  <div className="sm:col-span-2">
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
                    <p className="text-gray-500 dark:text-gray-400">{t.noItemsFound || "לא נמצאו פריטים"}</p>
                  </div>
                )}
              </Accordion>

              <div className="mt-6">
                <div className="flex flex-col md:flex-row gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddItemDialogOpen(true)}
                        className="w-full md:w-1/2 py-6 md:py-4 flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        {t.addNewItem || "הוספת פריט חדש"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleUndo}
                        disabled={itemHistory.length === 0}
                        className="w-full md:w-1/2 py-6 md:py-4 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-5 w-5" />
                        {t.undoAction || "בטל פעולה אחרונה"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full py-6 md:py-4 flex items-center justify-center gap-2"
                    >
                      <Pencil className="h-5 w-5" />
                      {t.editList || "ערוך רשימה"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-2 mt-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="w-full md:w-1/2 py-6 md:py-4 flex items-center justify-center gap-2 text-white bg-red-600 hover:text-white hover:bg-red-700 dark:text-white dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        <X className="h-5 w-5" />
                        {t.cancelEditing || "צא מעריכה"}
                      </Button>

                      <Button
                        className="w-full md:w-1/2 py-6 md:py-4 bg-[#005c72] hover:bg-[#005c72]/90 dark:bg-[#d3e3fd] dark:hover:bg-[#d3e3fd]/90 text-white dark:text-black flex items-center justify-center gap-2"
                        onClick={handleSaveChanges}
                        disabled={isAILoading}
                      >
                        {isAILoading ? (
                          <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {t.saveChanges || "שמור שינויים"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full py-6 md:py-4 bg-[#005c72] hover:bg-[#005c72]/90 dark:bg-[#d3e3fd] dark:hover:bg-[#d3e3fd]/90 text-white dark:text-black flex items-center justify-center gap-2"
                      onClick={saveAIGeneratedList}
                      disabled={isAILoading}
                    >
                      {isAILoading ? (
                        <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                          <FileText className="h-5 w-5" />
                          )}
                          {t.saveList || "שמור רשימה"}
                          </Button>
                          )}
                          </div>
                          </div>
                          </CardContent>
                          </Card>
        
                          {/* Add Item Dialog */}
                          {isAddItemDialogOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-3 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h3 className="text-lg font-medium">{t.addNewItem || "הוספת פריט חדש"}</h3>
                            </div>
                            <div className="p-3 space-y-3">
                            <div>
                            <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t.itemName || "שם הפריט"}
                            </label>
                            <Input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setnewItem({ ...newItem, name: e.target.value })}
                            className="mt-1"
                            required
                            />
                            </div>
                            <div>
                            <label
                            htmlFor="item-category"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.itemCategory || "קטגוריה"}
                            </label>
                            <Select value={newItem.category} onValueChange={(value) => setnewItem({ ...newItem, category: value })}>
                            <SelectTrigger id="item-category" className="mt-1">
                            <SelectValue placeholder={t.categoryFilterPlaceholder || "קטגוריה"} />
                            </SelectTrigger>
                            <SelectContent>
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
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                            <div>
                            <label
                            htmlFor="item-quantity"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.itemQuantity || "כמות"}
                            </label>
                            <Input
                            id="item-quantity"
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => setnewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                            className="mt-1"
                            />
                            </div>
                            <div>
                            <label htmlFor="item-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t.itemUnit || "יחידת מידה"}
                            </label>
                            <Input
                            type="text"
                            value={newItem.unit}
                            onChange={(e) => setnewItem({ ...newItem, unit: e.target.value })}
                            className="mt-1"
                            />
                            </div>
                            </div>
                            <div>
                            <label
                            htmlFor="item-importance"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.itemImportance || "חשיבות"}
                            </label>
                            <Select
                            value={newItem.importance.toString()}
                            onChange={(value) => setnewItem({ ...newItem, importance: Number.parseInt(value) })}
                            >
                            <SelectTrigger id="item-importance" className="mt-1">
                            <SelectValue placeholder={t.importanceFilterPlaceholder || "חשיבות"} />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="5">{t.aiCategories.essential || "הכרחי"} (5)</SelectItem>
                            <SelectItem value="4">{t.aiCategories.very_important || "חשוב מאוד"} (4)</SelectItem>
                            <SelectItem value="3">{t.aiCategories.important || "חשוב"} (3)</SelectItem>
                            <SelectItem value="2">{t.aiCategories.recommended || "מומלץ"} (2)</SelectItem>
                            <SelectItem value="1">{t.aiCategories.optional || "אופציונלי"} (1)</SelectItem>
                            </SelectContent>
                            </Select>
                            </div>
                            <div>
                            <label
                            htmlFor="item-description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.itemDescription || "תיאור"}
                            </label>
                            <Textarea
                            id="item-description"
                            value={newItem.description}
                            onChange={(e) => setnewItem({ ...newItem, description: e.target.value })}
                            className="mt-1"
                            rows="2"
                            ></Textarea>
                            </div>
                            <div>
                            <label
                            htmlFor="item-expiry-date"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.estimatedExpiryDate || "תאריך תפוגה משוער"}
                            </label>
                            <Input
                            id="item-expiry-date"
                            type="date"
                            value={newItem.expiryDate || ""}
                            onChange={(e) => setnewItem({ ...newItem, expiryDate: e.target.value })}
                            className="mt-1"
                            />
                            </div>
                            <div className="flex items-center">
                            <input
                            type="checkbox"
                            checked={newItem.sms_notification}
                            onChange={(e) => setnewItem({ ...newItem, sms_notification: e.target.checked })}
                            className="mr-2"
                            />
                            <label className="text-sm">{t.sendReminder}</label>
                            </div>
                            <div>
                            <label
                            htmlFor="item-usage-instructions"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                            {t.itemUsageInstructions || "הוראות שימוש"}
                            </label>
                            <Textarea
                            id="item-usage-instructions"
                            value={newItem.usage_instructions}
                            onChange={(e) => setnewItem({ ...newItem, usage_instructions: e.target.value })}
                            className="mt-1"
                            placeholder={t.usageInstructionsPlaceholder || "הוראות שימוש והערות חשובות"}
                            rows="2"
                            ></Textarea>
                            </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
                            {t.cancel || "ביטול"}
                            </Button>
                            <Button
                            onClick={handleAddItem}
                            className="bg-[#005c72] hover:bg-[#005c72]/90 dark:bg-[#d3e3fd] dark:hover:bg-[#d3e3fd]/90 text-white dark:text-black"
                            disabled={!newItem.name.trim()}
                            >
                            {t.add || "הוסף"}
                            </Button>
                            </div>
                            </div>
                            </div>
                            )}
        
                            {/* Confirm Remove Dialog */}
                            {isConfirmDialogOpen && (
                              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                              <h2 className="text-xl font-semibold mb-2">{t.removeItemConfirm}</h2>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">{t.removeItemDescription}</p>
                              <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                              {t.cancelRemove || "ביטול"}
                              </Button>
                              <Button variant="destructive" onClick={confirmRemoveItem}>
                              {t.confirmRemove || "הסר"}
                              </Button>
                              </div>
                              </div>
                              </div>
                              )}
                              </div>
                              </TooltipProvider>
                              )
}
</div>
                              </div>
                              )}
                              </div>
                              </TooltipProvider>
                              )
                              }
