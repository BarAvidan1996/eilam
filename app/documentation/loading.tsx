import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <Spinner size="large" className="border-purple-600" />
    </div>
  )
}
