export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">דף לא נמצא</h2>
      <p className="mb-6">לא הצלחנו למצוא את הדף המבוקש</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        חזרה לדף הבית
      </a>
    </div>
  )
}
