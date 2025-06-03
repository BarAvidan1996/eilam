"use client"

import { useLanguage } from "@/contexts/language-context"
import { translateText, translateObject } from "@/components/utils/translate"
import { useState, useCallback } from "react"

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>()

// Static translations for common UI elements
const staticTranslations: Record<string, Record<string, string>> = {
  he: {
    // Navigation
    Dashboard: "לוח בקרה",
    Equipment: "ציוד",
    "Equipment Lists": "רשימות ציוד",
    Shelters: "מקלטים",
    "Favorite Shelters": "מקלטים מועדפים",
    Chat: "צ'אט",
    "Chat History": "היסטוריית צ'אט",
    Documentation: "תיעוד",
    FAQ: "שאלות נפוצות",
    Profile: "פרופיל",
    Agent: "סוכן AI",

    // Common actions
    Save: "שמור",
    Cancel: "ביטול",
    Delete: "מחק",
    Edit: "ערוך",
    Add: "הוסף",
    Create: "צור",
    Search: "חפש",
    Filter: "סנן",
    Sort: "מיין",
    Loading: "טוען",
    Error: "שגיאה",
    Success: "הצלחה",
    Warning: "אזהרה",
    Info: "מידע",

    // Equipment
    "All Equipment Lists": "כל רשימות הציוד",
    "Create New List": "צור רשימה חדשה",
    "Edit List": "ערוך רשימה",
    "Delete List": "מחק רשימה",
    "List Name": "שם הרשימה",
    Items: "פריטים",
    "Add Item": "הוסף פריט",
    "Item Name": "שם הפריט",
    Quantity: "כמות",
    Category: "קטגוריה",
    Priority: "עדיפות",
    Status: "סטטוס",
    "Expiry Date": "תאריך תפוגה",

    // Shelters
    "Find Shelters": "מצא מקלטים",
    "Search Location": "חפש מיקום",
    Distance: "מרחק",
    Capacity: "קיבולת",
    Type: "סוג",
    Address: "כתובת",
    Phone: "טלפון",
    "Add to Favorites": "הוסף למועדפים",
    "Remove from Favorites": "הסר ממועדפים",

    // Chat
    "Send Message": "שלח הודעה",
    "Type your message": "הקלד את ההודעה שלך",
    "Chat with AI": "צ'אט עם AI",
    "New Chat": "צ'אט חדש",
    "Clear History": "נקה היסטוריה",

    // Profile
    "Personal Information": "מידע אישי",
    Settings: "הגדרות",
    Language: "שפה",
    Notifications: "התראות",
    Privacy: "פרטיות",
    Logout: "התנתק",
    Login: "התחבר",
    Register: "הירשם",

    // Time
    Today: "היום",
    Yesterday: "אתמול",
    "This Week": "השבוע",
    "This Month": "החודש",
    "Last Month": "החודש שעבר",

    // Status
    Active: "פעיל",
    Inactive: "לא פעיל",
    Pending: "ממתין",
    Completed: "הושלם",
    "In Progress": "בתהליך",
    Failed: "נכשל",
  },
  ar: {
    // Navigation
    Dashboard: "لوحة التحكم",
    Equipment: "المعدات",
    "Equipment Lists": "قوائم المعدات",
    Shelters: "الملاجئ",
    "Favorite Shelters": "الملاجئ المفضلة",
    Chat: "الدردشة",
    "Chat History": "تاريخ الدردشة",
    Documentation: "التوثيق",
    FAQ: "الأسئلة الشائعة",
    Profile: "الملف الشخصي",
    Agent: "وكيل الذكي",

    // Common actions
    Save: "حفظ",
    Cancel: "إلغاء",
    Delete: "حذف",
    Edit: "تعديل",
    Add: "إضافة",
    Create: "إنشاء",
    Search: "بحث",
    Filter: "تصفية",
    Sort: "ترتيب",
    Loading: "جاري التحميل",
    Error: "خطأ",
    Success: "نجح",
    Warning: "تحذير",
    Info: "معلومات",
  },
  ru: {
    // Navigation
    Dashboard: "Панель управления",
    Equipment: "Оборудование",
    "Equipment Lists": "Списки оборудования",
    Shelters: "Убежища",
    "Favorite Shelters": "Избранные убежища",
    Chat: "Чат",
    "Chat History": "История чата",
    Documentation: "Документация",
    FAQ: "Часто задаваемые вопросы",
    Profile: "Профиль",
    Agent: "ИИ агент",

    // Common actions
    Save: "Сохранить",
    Cancel: "Отмена",
    Delete: "Удалить",
    Edit: "Редактировать",
    Add: "Добавить",
    Create: "Создать",
    Search: "Поиск",
    Filter: "Фильтр",
    Sort: "Сортировка",
    Loading: "Загрузка",
    Error: "Ошибка",
    Success: "Успех",
    Warning: "Предупреждение",
    Info: "Информация",
  },
}

export function useTranslation() {
  const { language } = useLanguage()
  const [isTranslating, setIsTranslating] = useState(false)

  // Function to translate text
  const t = useCallback(
    async (
      text: string,
      options?: {
        fallback?: string
        useStatic?: boolean
      },
    ): Promise<string> => {
      if (!text) return ""

      // If target language is English, return as-is
      if (language === "en") {
        return text
      }

      // Check static translations first (if enabled)
      if (options?.useStatic !== false && staticTranslations[language]?.[text]) {
        return staticTranslations[language][text]
      }

      // Check cache
      const cacheKey = `${text}_${language}`
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!
      }

      // Use dynamic translation
      try {
        setIsTranslating(true)
        const translated = await translateText(text, language)
        translationCache.set(cacheKey, translated)
        return translated
      } catch (error) {
        console.error("Translation error:", error)
        return options?.fallback || text
      } finally {
        setIsTranslating(false)
      }
    },
    [language],
  )

  // Synchronous function for static translations only
  const ts = useCallback(
    (text: string, fallback?: string): string => {
      if (!text) return ""

      // If target language is English, return as-is
      if (language === "en") {
        return text
      }

      // Return static translation or fallback
      return staticTranslations[language]?.[text] || fallback || text
    },
    [language],
  )

  // Function to translate objects
  const tObj = useCallback(
    async (obj: Record<string, any>): Promise<Record<string, any>> => {
      if (language === "en") {
        return obj
      }

      try {
        setIsTranslating(true)
        return await translateObject(obj, language)
      } catch (error) {
        console.error("Object translation error:", error)
        return obj
      } finally {
        setIsTranslating(false)
      }
    },
    [language],
  )

  return {
    t, // Async translation (dynamic + static)
    ts, // Sync translation (static only)
    tObj, // Object translation
    language,
    isTranslating,
  }
}

// Hook for component-level translations
export function usePageTranslation(pageTranslations?: Record<string, Record<string, string>>) {
  const { language } = useLanguage()
  const { t, ts, tObj, isTranslating } = useTranslation()

  // Get page-specific translation
  const tp = useCallback(
    (key: string, fallback?: string): string => {
      if (!key) return ""

      // If target language is English, return key as-is
      if (language === "en") {
        return fallback || key
      }

      // Check page translations first
      if (pageTranslations?.[language]?.[key]) {
        return pageTranslations[language][key]
      }

      // Fall back to static translations
      return ts(key, fallback)
    },
    [language, pageTranslations, ts],
  )

  return {
    t, // Global async translation
    ts, // Global sync translation
    tp, // Page-specific translation
    tObj, // Object translation
    language,
    isTranslating,
  }
}
