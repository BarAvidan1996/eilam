"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// סוגי השפות הנתמכות
export type Language = "he" | "en" | "ar" | "ru"

// מבנה הקונטקסט
type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  isRTL: boolean
  dir: "rtl" | "ltr"
}

// יצירת הקונטקסט עם ערכי ברירת מחדל - עברית כברירת מחדל
const LanguageContext = createContext<LanguageContextType>({
  language: "he",
  setLanguage: () => {},
  isRTL: true,
  dir: "rtl",
})

// הוק מותאם אישית לשימוש בקונטקסט
export const useLanguage = () => useContext(LanguageContext)

// ספק הקונטקסט
export function LanguageProvider({ children }: { children: ReactNode }) {
  // אתחול עם עברית כברירת מחדל
  const [language, setLanguageState] = useState<Language>("he")
  const [isRTL, setIsRTL] = useState(true)
  const [dir, setDir] = useState<"rtl" | "ltr">("rtl")

  // פונקציה לשינוי השפה
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)

    // עדכון כיוון הטקסט
    const isRightToLeft = lang === "he" || lang === "ar"
    setIsRTL(isRightToLeft)
    setDir(isRightToLeft ? "rtl" : "ltr")

    // עדכון ה-HTML
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang
      document.documentElement.dir = isRightToLeft ? "rtl" : "ltr"

      // שמירה ב-localStorage
      localStorage.setItem("eilam-language", lang)
    }
  }

  // טעינת השפה מה-localStorage או ברירת מחדל לעברית
  useEffect(() => {
    if (typeof window !== "undefined") {
      // בדיקה אם יש שפה שמורה ב-localStorage
      const savedLanguage = localStorage.getItem("eilam-language") as Language

      if (savedLanguage && ["he", "en", "ar", "ru"].includes(savedLanguage)) {
        setLanguage(savedLanguage)
      } else {
        // ברירת מחדל לעברית
        setLanguage("he")
        // הגדרת HTML לעברית
        document.documentElement.lang = "he"
        document.documentElement.dir = "rtl"
      }
    }
  }, [])

  return <LanguageContext.Provider value={{ language, setLanguage, isRTL, dir }}>{children}</LanguageContext.Provider>
}
