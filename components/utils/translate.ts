/**
 * Translates text using built-in fetch API instead of axios
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code ('EN', 'HE', 'AR', 'RU')
 * @returns {Promise<string>} - Translated text
 */

// Add at the top after imports
const translationCache = new Map<string, string>()
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return ""

  // Check cache first
  const cacheKey = `${text}_${targetLang}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // For testing/debugging - simple passthrough without API calls
  console.log(`Would translate to ${targetLang}: ${text}`)

  // Return the original text as a fallback if API fails
  try {
    // Always-succeed basic translation dictionary for common phrases
    // This serves as a fallback when the API is down
    const basicTranslations: Record<string, Record<string, string>> = {
      // English -> Hebrew
      en_he: {
        "All Equipment Lists": "כל רשימות הציוד",
        "Manage all your equipment lists in one place": "נהל את כל רשימות הציוד שלך במקום אחד",
        items: "פריטים",
        "You haven't created any equipment lists yet": "עדיין לא יצרת רשימות ציוד",
        "You can create new lists from the equipment management page": "ניתן ליצור רשימות חדשות מעמוד ניהול הציוד",
        "Create New List": "צור רשימה חדשה",
        "Edit Name": "ערוך שם",
        "Delete List": "מחק רשימה",
        "Confirm Deletion": "אישור מחיקה",
        Cancel: "ביטול",
        Delete: "מחק",
        "Edit List Name": "ערוך שם רשימה",
        "New List Name": "שם רשימה חדש",
        Save: "שמור",
        "Loading lists...": "טוען רשימות...",
        "Error loading lists": "שגיאה בטעינת רשימות",
        "Error deleting list": "שגיאה במחיקת הרשימה",
        "Try Again": "נסה שוב",
      },
      // English -> Arabic
      en_ar: {
        "All Equipment Lists": "جميع قوائم المعدات",
        "Manage all your equipment lists in one place": "إدارة جميع قوائم المعدات الخاصة بك في مكان واحد",
        items: "عناصر",
        "You haven't created any equipment lists yet": "لم تقم بإنشاء أي قوائم معدات حتى الآن",
        "You can create new lists from the equipment management page": "يمكنك إنشاء قوائم جديدة من صفحة إدارة المعدات",
        "Create New List": "إنشاء قائمة جديدة",
        "Edit Name": "تعديل الاسم",
        "Delete List": "حذف القائمة",
        "Confirm Deletion": "تأكيد الحذف",
        Cancel: "إلغاء",
        Delete: "حذف",
        "Edit List Name": "تعديل اسم القائمة",
        "New List Name": "اسم القائمة الجديد",
        Save: "حفظ",
        "Loading lists...": "جارٍ تحميل القوائم...",
        "Error loading lists": "خطأ في تحميل القوائم",
        "Error deleting list": "خطأ في حذف القائمة",
        "Try Again": "حاول مرة أخرى",
      },
      // English -> Russian
      en_ru: {
        "All Equipment Lists": "Все списки оборудования",
        "Manage all your equipment lists in one place": "Управляйте всеми своими списками оборудования в одном месте",
        items: "элементов",
        "You haven't created any equipment lists yet": "Вы еще не создали ни одного списка оборудования",
        "You can create new lists from the equipment management page":
          "Вы можете создавать новые списки на странице управления оборудованием",
        "Create New List": "Создать новый список",
        "Edit Name": "Изменить название",
        "Delete List": "Удалить список",
        "Confirm Deletion": "Подтверждение удаления",
        Cancel: "Отмена",
        Delete: "Удалить",
        "Edit List Name": "Изменить название списка",
        "New List Name": "Новое название списка",
        Save: "Сохранить",
        "Loading lists...": "Загрузка списков...",
        "Error loading lists": "Ошибка при загрузке списков",
        "Error deleting list": "Ошибка при удалении списка",
        "Try Again": "Повторить попытку",
      },
    }

    // Build translation key
    const fromLang = "en" // Always using English as source
    const toLang = targetLang.toLowerCase()
    const translationKey = `${fromLang}_${toLang}`

    // If we're translating to English or we don't have this language pair, return as-is
    if (toLang === "en" || !basicTranslations[translationKey]) {
      return text
    }

    // Check if we have this exact phrase in our dictionary
    if (basicTranslations[translationKey][text]) {
      const translatedText = basicTranslations[translationKey][text]
      translationCache.set(cacheKey, translatedText)
      return translatedText
    }

    // Convert language codes to DeepL format
    const langMap: Record<string, string> = {
      he: "EN-US", // DeepL doesn't support Hebrew as target language, force to English
      en: "EN-US",
      ar: "AR",
      ru: "RU",
    }

    const DEEPL_API_KEY = process.env.DEEPL_API || "9f8a89de-1c2b-4e30-86b8-54cb777e7292:fx"
    const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate"

    // Try to use the API but with better error handling
    try {
      const response = await fetch(DEEPL_API_URL, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [text],
          target_lang: langMap[targetLang] || "EN-US",
        }),
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      const translatedText = data.translations[0].text
      translationCache.set(cacheKey, translatedText)
      return translatedText
    } catch (apiError) {
      console.error("Translation API error:", apiError)
      translationCache.set(cacheKey, text)
      return text // Return original if API fails
    }
  } catch (error) {
    console.error("Translation system error:", error)
    translationCache.set(cacheKey, text)
    return text // Return original text if translation fails
  }
}

/**
 * Translates an object with text values
 * @param {Object} obj - Object with text values
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} - Object with translated values
 */
export async function translateObject(obj: Record<string, any>, targetLang: string): Promise<Record<string, any>> {
  if (!obj) return {}

  const translatedObj: Record<string, any> = {}

  // If translating to English, return the original
  if (targetLang === "en") {
    return obj
  }

  for (const key in obj) {
    if (typeof obj[key] === "string") {
      translatedObj[key] = await translateText(obj[key], targetLang)
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      translatedObj[key] = await translateObject(obj[key], targetLang)
    } else {
      translatedObj[key] = obj[key]
    }
  }

  return translatedObj
}

// Simple cache for translations
export const translationCacheOld = {
  _cache: {} as Record<string, string>,

  get(text: string, targetLang: string): string | null {
    const key = `${text}_${targetLang}`
    return this._cache[key] || null
  },

  set(text: string, targetLang: string, translation: string): void {
    const key = `${text}_${targetLang}`
    this._cache[key] = translation
  },
}
