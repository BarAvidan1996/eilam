"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

interface LanguageContextProps {
  currentLanguage: string
  setLanguage: (lang: string) => void
  clearTranslationCache: () => void
}

const LanguageContext = createContext<LanguageContextProps>({
  currentLanguage: "en",
  setLanguage: () => {},
  clearTranslationCache: () => {},
})

export { LanguageContext }

interface LanguageProviderProps {
  children: React.ReactNode
}

const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  // בתוך ה-context, הוסף פונקציה לניקוי cache
  const clearTranslationCache = () => {
    if (typeof window !== "undefined") {
      // Clear translation cache when language changes
      window.dispatchEvent(new CustomEvent("clearTranslationCache"))
    }
  }

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang)
    clearTranslationCache()
    localStorage.setItem("language", lang)
  }

  useEffect(() => {
    const storedLanguage = localStorage.getItem("language")
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage)
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, clearTranslationCache }}>
      {children}
    </LanguageContext.Provider>
  )
}

const useLanguage = () => useContext(LanguageContext)

export { LanguageProvider, useLanguage, LanguageContext }
