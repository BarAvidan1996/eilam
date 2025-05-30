"use client"

import type React from "react"

import { useState, useEffect } from "react"

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<string>("")

  useEffect(() => {
    // Attempt to get language from local storage or browser settings
    const storedLanguage = localStorage.getItem("language")
    const browserLanguage = navigator.language.split("-")[0]

    // Set default language to Hebrew if no language is stored or detected
    const defaultLanguage = "he"

    const initialLanguage = storedLanguage || browserLanguage || defaultLanguage

    setLanguage(initialLanguage)
    localStorage.setItem("language", initialLanguage) // Ensure local storage is updated
  }, [])

  useEffect(() => {
    if (language) {
      document.documentElement.lang = language
      localStorage.setItem("language", language)
    }
  }, [language])

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
  }

  return (
    <div dir={language === "he" ? "rtl" : "ltr"}>
      {/* Language Switcher (Example) */}
      <div>
        <button onClick={() => handleLanguageChange("en")}>English</button>
        <button onClick={() => handleLanguageChange("he")}>עברית</button>
      </div>

      {children}
    </div>
  )
}

export default ClientLayout
