import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"

export default function SheltersPage() {
  const { ts, isTranslating } = useTranslation()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <T>Find Shelters</T>
        {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        <T>Browse a list of available shelters in your area.</T>
      </p>
    </div>
  )
}
