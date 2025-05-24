"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">משהו השתבש</h2>
      <p className="mb-6">אירעה שגיאה בטעינת הדף</p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          נסה שוב
        </button>
        <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
