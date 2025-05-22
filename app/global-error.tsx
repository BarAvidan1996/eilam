"use client"

import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">שגיאה כללית</h2>
          <p className="mb-6">אירעה שגיאה כללית באפליקציה</p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              נסה שוב
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
