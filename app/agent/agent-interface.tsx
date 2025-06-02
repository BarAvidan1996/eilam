import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package, User, Star } from "lucide-react"

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
    return (
      <div className="space-y-3">
        <div className="font-medium text-primary flex items-center gap-2">
          <Package className="h-4 w-4" />
          המלצות ציוד חירום
          {result.result.isPersonalized && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              ⭐ מותאם אישית
            </Badge>
          )}
          {result.result.usedFallback && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              ⚠️ כללי
            </Badge>
          )}
        </div>
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          {/* Check if we have structured AI recommendations */}
          {result.result.recommendations?.items && Array.isArray(result.result.recommendations.items) ? (
            <div className="space-y-4">
              {/* Profile info */}
              {result.result.recommendations.profile && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">פרופיל המשפחה</span>
                  </div>
                  <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
                    {result.result.recommendations.profile.adults > 0 && (
                      <span>מבוגרים: {result.result.recommendations.profile.adults}</span>
                    )}
                    {result.result.recommendations.profile.children > 0 && (
                      <span>ילדים: {result.result.recommendations.profile.children}</span>
                    )}
                    {result.result.recommendations.profile.elderly > 0 && (
                      <span>קשישים: {result.result.recommendations.profile.elderly}</span>
                    )}
                    {result.result.recommendations.profile.babies > 0 && (
                      <span>תינוקות: {result.result.recommendations.profile.babies}</span>
                    )}
                    {result.result.recommendations.profile.pets > 0 && (
                      <span>חיות מחמד: {result.result.recommendations.profile.pets}</span>
                    )}
                    {result.result.recommendations.profile.special_needs && (
                      <span>צרכים מיוחדים: {result.result.recommendations.profile.special_needs}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment items */}
              <div className="space-y-3">
                <h4 className="font-medium">פריטי ציוד מומלצים:</h4>
                {result.result.recommendations.items.map((item: any, index: number) => (
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
                          {item.specificToProfile && (
                            <Star className="h-3 w-3 text-accent" title="מותאם אישית לפרופיל שלך" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : result.result.recommendations && typeof result.result.recommendations === "object" ? (
            // Handle object format (legacy)
            <div className="space-y-3">
              {Object.entries(result.result.recommendations).map(([category, items]: [string, any]) => (
                <div key={category}>
                  <div className="font-medium text-primary mb-2">{category}:</div>
                  {Array.isArray(items) ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm">{String(items)}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Handle text format (fallback)
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">המלצות עבור: {result.result.familyProfile}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.result.recommendations}</pre>
            </div>
          )}

          {/* Source info */}
          {result.result.source && (
            <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/20">
              מקור: {result.result.source === "ai-recommendations-api" ? "AI מותאם אישית" : "RAG משופר"}
            </div>
          )}
        </div>
      </div>
    )
  }

  return <div>Unsupported result type</div>
}
