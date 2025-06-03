"use client"

import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { ts, isTranslating } = useTranslation()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isTranslating && <Loader2 className="inline mr-2 h-6 w-6 animate-spin" />}
          <T>Profile</T>
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          <T>Manage your account settings and preferences</T>
        </p>
      </div>

      {/* Add your profile content here */}
      <div className="text-center py-16">
        <p className="text-lg text-gray-500">
          <T>Profile functionality will be implemented here</T>
        </p>
      </div>
    </div>
  )
}
