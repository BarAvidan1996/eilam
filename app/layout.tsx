import type React from "react"
import ClientLayout from "./ClientLayout"

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
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
