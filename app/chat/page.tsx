"use client"

import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function ChatPage() {
  const { ts, isTranslating } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isTranslating && <Loader2 className="inline mr-2 h-6 w-6 animate-spin" />}
          <T>Chat with AI</T>
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          <T>Get help and guidance from our AI assistant</T>
        </p>
      </div>

      {/* Add your chat content here */}
      <div className="text-center py-16">
        <p className="text-lg text-gray-500">
          <T>Chat functionality will be implemented here</T>
        </p>
      </div>
    </div>
  )
}
