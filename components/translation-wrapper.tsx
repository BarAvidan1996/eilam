"use client"

import type React from "react"

import { useTranslation } from "@/hooks/use-translation"
import { useEffect, useState } from "react"

interface TranslationWrapperProps {
  text: string
  fallback?: string
  className?: string
  useStatic?: boolean
  children?: (translatedText: string, isLoading: boolean) => React.ReactNode
}

export function TranslationWrapper({ text, fallback, className, useStatic = true, children }: TranslationWrapperProps) {
  const { t, ts, language, isTranslating } = useTranslation()
  const [translatedText, setTranslatedText] = useState<string>(useStatic ? ts(text, fallback) : text)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (language === "en") {
      setTranslatedText(text)
      return
    }

    // Try static first
    const staticTranslation = ts(text)
    if (staticTranslation !== text) {
      setTranslatedText(staticTranslation)
      return
    }

    // Use dynamic translation
    if (!useStatic) {
      setIsLoading(true)
      t(text, { fallback }).then((translated) => {
        setTranslatedText(translated)
        setIsLoading(false)
      })
    }
  }, [text, language, fallback, useStatic, t, ts])

  if (children) {
    return <>{children(translatedText, isLoading)}</>
  }

  return <span className={className}>{isLoading ? fallback || text : translatedText}</span>
}

// Simple component for quick translations
export function T({
  children,
  fallback,
  className,
  useStatic = true,
}: {
  children: string
  fallback?: string
  className?: string
  useStatic?: boolean
}) {
  return <TranslationWrapper text={children} fallback={fallback} className={className} useStatic={useStatic} />
}
