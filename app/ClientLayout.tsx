"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import AppLayout from "@/components/app-layout"
import { LanguageProvider } from "@/contexts/language-context"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <AppLayout>{children}</AppLayout>
        <style jsx global>{`
          /* עדכון צבעי כפתורים */
          .bg-purple-600 {
            background-color: #005c72 !important;
          }
          .hover\\:bg-purple-700:hover {
            background-color: #004a5d !important;
          }
          .dark .bg-purple-600 {
            background-color: #d3e3fd !important;
          }
          .dark .hover\\:bg-purple-700:hover {
            background-color: #b1c9f8 !important;
          }
          .text-purple-600 {
            color: #005c72 !important;
          }
          .dark .text-purple-400 {
            color: #d1d1d1 !important;
          }
          .border-purple-600 {
            border-color: #005c72 !important;
          }
          .dark .border-purple-400 {
            border-color: #d1d1d1 !important;
          }
          .fill-purple-500, .text-purple-500 {
            color: #005c72 !important;
            fill: #005c72 !important;
          }
          .dark .fill-purple-400, .dark .text-purple-400 {
            color: #d1d1d1 !important;
            fill: #d1d1d1 !important;
          }
          /* צבע טקסט שחור לכפתורים במצב דארק מוד */
          .dark .bg-purple-600, .dark .hover\\:bg-purple-700:hover {
            color: #000000 !important;
          }
        `}</style>
      </LanguageProvider>
    </ThemeProvider>
  )
}
