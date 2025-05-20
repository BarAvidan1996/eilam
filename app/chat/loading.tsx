import { Spinner } from "@/components/ui/spinner"

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden items-center justify-center">
      <Spinner size="large" />
      <p className="mt-4 text-gray-600 dark:text-gray-300">טוען את הצ'אט...</p>
    </div>
  )
}
