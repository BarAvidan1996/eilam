"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LocationSelector } from "@/components/location-selector"
import { Bot, CheckCircle, XCircle, Edit3, Clock, AlertTriangle, Loader2, Brain, Zap, MapPin } from "lucide-react"
import type { JSX } from "react"

interface Tool {
  id: string
  name: string
  priority: number
  reasoning: string
  parameters: Record<string, any>
}

interface Plan {
  analysis: string
  tools: Tool[]
  needsClarification: boolean
  clarificationQuestions: string[]
  availableTools: any[]
}

interface ExecutionResult {
  success: boolean
  toolId: string
  result: any
  timestamp: string
  error?: string
}

type ExecutionStatus = "pending" | "approved" | "executing" | "completed" | "failed" | "skipped" | "waiting_location"

interface ToolExecution {
  tool: Tool
  status: ExecutionStatus
  result?: ExecutionResult
  editedParameters?: Record<string, any>
}

interface LocationData {
  type: "current" | "address"
  lat?: number
  lng?: number
  address?: string
  displayName?: string
}

export default function AgentInterface() {
  const [prompt, setPrompt] = useState("")
  const [plan, setPlan] = useState<Plan | null>(null)
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [planningError, setPlanningError] = useState<string | null>(null)
  const [currentExecutionIndex, setCurrentExecutionIndex] = useState(-1)
  const [editingTool, setEditingTool] = useState<string | null>(null)
  const [retryingTool, setRetryingTool] = useState<string | null>(null)
  const [showLocationSelector, setShowLocationSelector] = useState(false)
  const [pendingLocationToolIndex, setPendingLocationToolIndex] = useState<number | null>(null)

  // Create execution plan
  const createPlan = async () => {
    if (!prompt.trim()) return

    setIsPlanning(true)
    setPlanningError(null)
    setPlan(null)
    setExecutions([])

    try {
      console.log("🚀 שולח בקשה לתכנון...")

      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      console.log("📡 תגובה התקבלה:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const planData = await response.json()
      console.log("📋 נתוני תוכנית:", planData)

      if (planData.error) {
        throw new Error(planData.error)
      }

      // Validate plan data
      if (!planData.tools || !Array.isArray(planData.tools)) {
        console.error("❌ מבנה תוכנית לא תקין:", planData)
        throw new Error("Invalid plan structure received")
      }

      setPlan(planData)

      // Initialize executions and check for location requirements
      const initialExecutions: ToolExecution[] = planData.tools.map((tool: Tool) => {
        // Check if this tool needs location and doesn't have specific coordinates
        if (tool.id === "find_shelters" && (!tool.parameters.lat || !tool.parameters.lng)) {
          return {
            tool,
            status: "waiting_location" as ExecutionStatus,
          }
        }
        return {
          tool,
          status: "pending" as ExecutionStatus,
        }
      })

      setExecutions(initialExecutions)
      setCurrentExecutionIndex(-1)

      console.log("✅ תוכנית הוגדרה בהצלחה")
    } catch (error) {
      console.error("❌ שגיאה ביצירת תוכנית:", error)
      setPlanningError(error instanceof Error ? error.message : "שגיאה לא ידועה")
    } finally {
      setIsPlanning(false)
    }
  }

  // Handle location selection
  const handleLocationSelected = (location: LocationData) => {
    if (pendingLocationToolIndex !== null) {
      setExecutions((prev) =>
        prev.map((exec, i) => {
          if (i === pendingLocationToolIndex && exec.tool.id === "find_shelters") {
            const updatedParameters = {
              ...exec.tool.parameters,
              lat: location.lat,
              lng: location.lng,
              location: location.displayName || location.address || "מיקום נוכחי",
              locationType: location.type,
            }
            return {
              ...exec,
              status: "pending" as ExecutionStatus,
              editedParameters: updatedParameters,
            }
          }
          return exec
        }),
      )
    }
    setShowLocationSelector(false)
    setPendingLocationToolIndex(null)
  }

  // Request location for shelter search
  const requestLocation = (toolIndex: number) => {
    setPendingLocationToolIndex(toolIndex)
    setShowLocationSelector(true)
  }

  // Approve tool for execution
  const approveTool = (index: number) => {
    const execution = executions[index]

    // Check if this is a shelter search without location
    if (
      execution.tool.id === "find_shelters" &&
      (!execution.tool.parameters.lat || !execution.tool.parameters.lng) &&
      (!execution.editedParameters?.lat || !execution.editedParameters?.lng)
    ) {
      requestLocation(index)
      return
    }

    setExecutions((prev) => prev.map((exec, i) => (i === index ? { ...exec, status: "approved" } : exec)))
  }

  // Skip tool
  const skipTool = (index: number) => {
    setExecutions((prev) => prev.map((exec, i) => (i === index ? { ...exec, status: "skipped" } : exec)))
  }

  // Edit tool parameters
  const editTool = (index: number) => {
    setEditingTool(`${index}`)
  }

  // Save edited parameters
  const saveEditedParameters = (index: number, newParams: Record<string, any>) => {
    setExecutions((prev) => prev.map((exec, i) => (i === index ? { ...exec, editedParameters: newParams } : exec)))
    setEditingTool(null)
  }

  const retryTool = async (index: number) => {
    setRetryingTool(`${index}`)
    setExecutions((prev) =>
      prev.map((exec, i) => (i === index ? { ...exec, status: "executing", result: undefined } : exec)),
    )

    try {
      const execution = executions[index]
      const parameters = execution.editedParameters || execution.tool.parameters

      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: execution.tool.id,
          parameters,
        }),
      })

      const result = await response.json()

      setExecutions((prev) =>
        prev.map((exec, i) =>
          i === index
            ? {
                ...exec,
                status: result.success ? "completed" : "failed",
                result,
              }
            : exec,
        ),
      )
    } catch (error) {
      setExecutions((prev) =>
        prev.map((exec, i) =>
          i === index
            ? {
                ...exec,
                status: "failed",
                result: { success: false, error: "Retry failed" },
              }
            : exec,
        ),
      )
    } finally {
      setRetryingTool(null)
    }
  }

  // Execute next approved tool
  const executeNext = async () => {
    const nextIndex = executions.findIndex((exec) => exec.status === "approved")
    if (nextIndex === -1) return

    setCurrentExecutionIndex(nextIndex)
    setExecutions((prev) => prev.map((exec, i) => (i === nextIndex ? { ...exec, status: "executing" } : exec)))

    try {
      const execution = executions[nextIndex]
      const parameters = execution.editedParameters || execution.tool.parameters

      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: execution.tool.id,
          parameters,
        }),
      })

      const result = await response.json()

      setExecutions((prev) =>
        prev.map((exec, i) =>
          i === nextIndex
            ? {
                ...exec,
                status: result.success ? "completed" : "failed",
                result,
              }
            : exec,
        ),
      )
    } catch (error) {
      setExecutions((prev) =>
        prev.map((exec, i) =>
          i === nextIndex
            ? {
                ...exec,
                status: "failed",
                result: { success: false, error: "Execution failed" },
              }
            : exec,
        ),
      )
    }
  }

  // Execute all approved tools
  const executeAll = async () => {
    const approvedIndices = executions
      .map((exec, index) => (exec.status === "approved" ? index : -1))
      .filter((index) => index !== -1)

    for (const index of approvedIndices) {
      await executeNext()
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "executing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "skipped":
        return <XCircle className="h-4 w-4 text-gray-400" />
      case "waiting_location":
        return <MapPin className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-600"
      case "approved":
        return "bg-green-100 text-green-700"
      case "executing":
        return "bg-blue-100 text-blue-700"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-700"
      case "skipped":
        return "bg-gray-100 text-gray-500"
      case "waiting_location":
        return "bg-orange-100 text-orange-700"
    }
  }

  const renderResult = (result: any) => {
    if (!result?.result) return null

    const { type } = result.result

    switch (type) {
      case "rag_chat":
        return (
          <div className="space-y-2">
            <div className="font-medium text-blue-700">💬 תשובת מערכת המידע:</div>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="whitespace-pre-wrap">{result.result.answer}</p>
              {result.result.sources && result.result.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="text-xs text-blue-600 font-medium">מקורות:</div>
                  <ul className="text-xs text-blue-600 list-disc list-inside">
                    {result.result.sources.map((source: string, i: number) => (
                      <li key={i}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case "shelter_search":
        return (
          <div className="space-y-2">
            <div className="font-medium text-green-700">🏠 מקלטים שנמצאו:</div>
            <div className="bg-green-50 p-3 rounded text-sm space-y-2">
              {result.result.shelters && result.result.shelters.length > 0 ? (
                result.result.shelters.map((shelter: any, i: number) => (
                  <div key={i} className="border border-green-200 rounded p-2 bg-white">
                    <div className="font-medium">{shelter.name}</div>
                    <div className="text-gray-600">{shelter.address}</div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>📍 {shelter.distance} ק"מ</span>
                      {shelter.duration && <span>🚶 {Math.round(shelter.duration / 60)} דק' הליכה</span>}
                      <span>🏷️ {shelter.type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">לא נמצאו מקלטים באזור</div>
              )}
            </div>
          </div>
        )

      case "equipment_recommendations":
        return (
          <div className="space-y-2">
            <div className="font-medium text-purple-700">🎒 המלצות ציוד:</div>
            <div className="bg-purple-50 p-3 rounded text-sm">
              {result.result.recommendations && typeof result.result.recommendations === "object" ? (
                <div className="space-y-2">
                  {Object.entries(result.result.recommendations).map(([category, items]: [string, any]) => (
                    <div key={category}>
                      <div className="font-medium text-purple-800 mb-1">{category}:</div>
                      {Array.isArray(items) ? (
                        <ul className="list-disc list-inside text-purple-700 text-xs">
                          {items.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-purple-700 text-xs">{String(items)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-purple-800 text-xs">
                  {JSON.stringify(result.result.recommendations, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-sm bg-gray-50 p-3 rounded">
            <pre className="text-xs overflow-auto">{JSON.stringify(result.result, null, 2)}</pre>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Location Selector Modal */}
      <LocationSelector
        isVisible={showLocationSelector}
        onLocationSelected={handleLocationSelected}
        onCancel={() => {
          setShowLocationSelector(false)
          setPendingLocationToolIndex(null)
        }}
      />

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            סוכן AI לחירום - תכנון ובקרה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="תאר את המצב או מה שאתה צריך... (למשל: 'יש אזעקה ואני עם 2 ילדים')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="text-right"
          />
          <Button onClick={createPlan} disabled={!prompt.trim() || isPlanning} className="w-full">
            {isPlanning ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Brain className="h-4 w-4" />
                מתכנן פעולות...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                צור תוכנית פעולה
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Planning Status */}
      {isPlanning && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">מתכנן פעולות...</div>
                <div className="text-sm text-blue-600">מנתח את המצב ובוחר כלים מתאימים</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planning Error */}
      {planningError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>שגיאה ביצירת תוכנית: {planningError}</AlertDescription>
        </Alert>
      )}

      {/* Plan Analysis */}
      {plan && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ניתוח המצב
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{plan.analysis}</p>
            {plan.needsClarification && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">נדרשות הבהרות:</span>
                </div>
                <ul className="list-disc list-inside text-yellow-700">
                  {plan.clarificationQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tools Execution Plan */}
      {executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-between justify-between">
              <span>תוכנית ביצוע ({executions.length} כלים)</span>
              <div className="flex gap-2">
                <Button onClick={executeNext} disabled={!executions.some((e) => e.status === "approved")} size="sm">
                  בצע הבא
                </Button>
                <Button
                  onClick={executeAll}
                  disabled={!executions.some((e) => e.status === "approved")}
                  size="sm"
                  variant="outline"
                >
                  בצע הכל
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {executions.map((execution, index) => (
              <ToolExecutionCard
                key={index}
                execution={execution}
                index={index}
                isEditing={editingTool === `${index}`}
                onApprove={() => approveTool(index)}
                onSkip={() => skipTool(index)}
                onEdit={() => editTool(index)}
                onSaveEdit={(params) => saveEditedParameters(index, params)}
                onCancelEdit={() => setEditingTool(null)}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                renderResult={renderResult}
                retryingTool={retryingTool}
                retryTool={retryTool}
                requestLocation={() => requestLocation(index)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Tool Execution Card Component
interface ToolExecutionCardProps {
  execution: ToolExecution
  index: number
  isEditing: boolean
  onApprove: () => void
  onSkip: () => void
  onEdit: () => void
  onSaveEdit: (params: Record<string, any>) => void
  onCancelEdit: () => void
  getStatusIcon: (status: ExecutionStatus) => JSX.Element
  getStatusColor: (status: ExecutionStatus) => string
  renderResult: (result: any) => JSX.Element | null
  retryingTool: string | null
  retryTool: (index: number) => Promise<void>
  requestLocation: () => void
}

function ToolExecutionCard({
  execution,
  index,
  isEditing,
  onApprove,
  onSkip,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  getStatusIcon,
  getStatusColor,
  renderResult,
  retryingTool,
  retryTool,
  requestLocation,
}: ToolExecutionCardProps) {
  const [editedParams, setEditedParams] = useState(execution.tool.parameters)

  const handleSave = () => {
    onSaveEdit(editedParams)
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Tool Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            עדיפות {execution.tool.priority}
          </Badge>
          <h3 className="font-medium">{execution.tool.name}</h3>
          <div className="flex items-center gap-1">
            {getStatusIcon(execution.status)}
            <Badge className={`text-xs ${getStatusColor(execution.status)}`}>
              {execution.status === "pending" && "ממתין לאישור"}
              {execution.status === "approved" && "מאושר"}
              {execution.status === "executing" && "מבצע..."}
              {execution.status === "completed" && "הושלם"}
              {execution.status === "failed" && "נכשל"}
              {execution.status === "skipped" && "דולג"}
              {execution.status === "waiting_location" && "ממתין למיקום"}
            </Badge>
          </div>
        </div>

        {execution.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={onApprove}>
              אשר
            </Button>
            <Button size="sm" variant="outline" onClick={onSkip}>
              דלג
            </Button>
          </div>
        )}
        {execution.status === "waiting_location" && (
          <Button size="sm" onClick={requestLocation}>
            <MapPin className="h-3 w-3 mr-1" />
            בחר מיקום
          </Button>
        )}
        {execution.status === "failed" && (
          <Button size="sm" variant="outline" onClick={() => retryTool(index)} disabled={retryingTool === `${index}`}>
            {retryingTool === `${index}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "נסה שוב"}
          </Button>
        )}
      </div>

      {/* Reasoning */}
      <p className="text-sm text-gray-600">{execution.tool.reasoning}</p>

      {execution.status === "executing" && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          {execution.tool.id === "rag_chat" && "🔍 בודק מידע במערכת פיקוד העורף..."}
          {execution.tool.id === "find_shelters" && "🏠 מחפש מקלטים באזור המבוקש..."}
          {execution.tool.id === "recommend_equipment" && "🎒 מכין המלצות ציוד מותאמות..."}
        </div>
      )}

      {execution.status === "waiting_location" && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          📍 נדרש מיקום לחיפוש מקלטים. לחץ על "בחר מיקום" כדי להמשיך.
        </div>
      )}

      {/* Parameters */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">פרמטרים:</h4>
        {isEditing ? (
          <div className="space-y-3 p-3 bg-gray-50 rounded">
            {Object.entries(editedParams).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1">{key}:</label>
                <Input
                  value={value as string}
                  onChange={(e) =>
                    setEditedParams((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                שמור
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                בטל
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm bg-gray-50 p-3 rounded">
            {Object.entries(execution.editedParameters || execution.tool.parameters).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span>{value as string}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {execution.result && (
        <div className="space-y-2">
          <Separator />
          <h4 className="text-sm font-medium">תוצאות:</h4>
          {execution.result.success ? (
            renderResult(execution.result)
          ) : (
            <div className="text-sm bg-red-50 p-3 rounded">
              <div className="text-red-700">❌ שגיאה: {execution.result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
