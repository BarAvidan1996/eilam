import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="text-center">
        <Spinner size="large" className="mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">טוען היסטוריית שיחות...</p>
      </div>
    </div>
  )
}
