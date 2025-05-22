import type React from "react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <title>עיל״ם - עוזר ייעודי למצבי חירום</title>
        <meta
          name="description"
          content="מערכת רספונסיבית מבוססת צ'אט וחיפוש גיאוגרפי, שתפקידה לסייע למשתמשים בזמן אמת במצבי חירום ביטחוניים ואזרחיים"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

export const metadata = {
  generator: "v0.dev",
}
