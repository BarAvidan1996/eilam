import AgentInterface from "./agent-interface"

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">🤖 סוכן AI לחירום</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            סוכן חכם שמנתח את המצב שלך ומתכנן פעולות מותאמות אישית עם בקרה מלאה על כל שלב
          </p>
        </div>

        <AgentInterface />
      </div>
    </div>
  )
}
