export default function Loading() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">טוען רשימות ציוד...</p>
      </div>
    </div>
  )
}
