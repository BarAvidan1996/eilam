import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"

export default function AgentPage() {
  const { ts, isTranslating } = useTranslation()

  return (
    <div>
      <h1>
        {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        <T>Agent</T>
      </h1>
      <p>
        <T>תיאור</T>
      </p>
    </div>
  )
}
