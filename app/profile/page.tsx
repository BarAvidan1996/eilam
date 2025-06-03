import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { ts, isTranslating } = useTranslation()

  return (
    <div>
      <h1>{isTranslating ? <Loader2 className="h-5 w-5 animate-spin" /> : <T>Profile</T>}</h1>
      <h2>
        <T>Personal Information</T>
      </h2>
      <h2>
        <T>Settings</T>
      </h2>
    </div>
  )
}
