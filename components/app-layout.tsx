```tsx file="app/page.tsx"
[v0-no-op-code-block-prefix]import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"

export default function Home() {
  const { ts, isTranslating } = useTranslation()

  return (
    <main>
      <h1><T>כותרת</T></h1>
      <p><T>תיאור</T></p>
      <button><T>טקסט כפתור</T></button>
    </main>
  )
}
