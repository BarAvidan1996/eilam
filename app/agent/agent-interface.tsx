import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package } from "lucide-react"

interface AgentInterfaceProps {
  results: any[]
  isLoading: boolean
}

export function AgentInterface({ results, isLoading }: AgentInterfaceProps) {
  return (
    <div className="space-y-4">
      {isLoading && <div>טוען...</div>}
      {results.map((result, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">{result.title}</h2>
          <div className="space-y-2">
            {result.steps &&
              result.steps.map((step: any, stepIndex: number) => (
                <div key={stepIndex} className="border rounded-lg p-3">
                  <h3 className="font-medium">שלב {stepIndex + 1}</h3>
                  <p className="text-sm">{step.description}</p>
                  {step.result && (
                    <div className="mt-2">
                      <h4 className="font-semibold">תוצאה:</h4>
                      {renderToolResult(step.result)}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderToolResult(result: any) {
  if (result.type === "text") {
    return <div className="whitespace-pre-wrap">{result.text}</div>
  }

  if (result.type === "image_url") {
    return <img src={result.image_url || "/placeholder.svg"} alt="Result" className="max-w-full" />
  }

  if (result.type === "link") {
    return (
      <a href={result.href} target="_blank" rel="noopener noreferrer">
        {result.text || result.href}
      </a>
    )
  }

  if (result.type === "list") {
    return (
      <ul>
        {result.items.map((item: string, index: number) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }

  if (result.type === "table") {
    return (
      <table>
        <thead>
          <tr>
            {result.headers.map((header: string, index: number) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row: string[], rowIndex: number) => (
            <tr key={rowIndex}>
              {row.map((cell: string, cellIndex: number) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (result.type === "equipment_recommendations") {
    const recommendations = result.recommendations

    // Check if we have structured data from AI recommendations API
    if (recommendations?.items && Array.isArray(recommendations.items)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">המלצות ציוד מותאמות אישית</h3>
            {result.isPersonalized && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ⭐ מותאם אישית
              </Badge>
            )}
          </div>

          {recommendations.profile && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">פרופיל המשפחה:</h4>
              <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
                {recommendations.profile.adults > 0 && <span>מבוגרים: {recommendations.profile.adults}</span>}
                {recommendations.profile.children > 0 && <span>ילדים: {recommendations.profile.children}</span>}
                {recommendations.profile.elderly > 0 && <span>קשישים: {recommendations.profile.elderly}</span>}
                {recommendations.profile.babies > 0 && <span>תינוקות: {recommendations.profile.babies}</span>}
                {recommendations.profile.pets > 0 && <span>חיות מחמד: {recommendations.profile.pets}</span>}
                {recommendations.profile.special_needs && (
                  <span>צרכים מיוחדים: {recommendations.profile.special_needs}</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium">פריטי ציוד מומלצים:</h4>
            {recommendations.items.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.quantity && (
                        <Badge variant="outline" className="text-xs">
                          {item.quantity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {result.source && (
            <div className="text-xs text-gray-500 mt-2">
              מקור: {result.source === "ai-recommendations-api" ? "AI מותאם אישית" : "RAG כללי"}
            </div>
          )}
        </div>
      )
    }

    // Fallback for text-based recommendations
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-lg">המלצות ציוד חירום</h3>
          {result.usedFallback && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              ⚠️ כללי
            </Badge>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="whitespace-pre-wrap text-sm">{result.recommendations}</div>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="text-xs text-gray-500">מקורות: {result.sources.join(", ")}</div>
        )}
      </div>
    )
  }

  return <div>Unsupported result type</div>
}
