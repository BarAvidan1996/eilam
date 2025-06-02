"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { LocationSelector } from "@/components/location-selector"
import {
  Bot,
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  AlertTriangle,
  Loader2,
  Brain,
  Zap,
  MapPin,
  Shield,
  Home,
  Backpack,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  ExternalLink,
  Navigation,
  Star,
  Package,
  User,
} from "lucide-react"
import type { JSX } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface Tool {
  id: string
  name: string
  priority: number
  reasoning: string
  parameters: Record<string, any>
  missingFields?: string[]
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
  type: "current" | "address" | "map"
  lat?: number
  lng?: number
  address?: string
  displayName?: string
}

// Parameter descriptions with units and data types
const parameterDescriptions: Record<string, Record<string, string>> = {
  rag_chat: {
    query: "השאלה או הבקשה למידע (טקסט חופשי)",
  },
  find_shelters: {
    location: "מיקום לחיפוש - כתובת או שם מקום (טקסט)",
    radius: "רדיוס החיפוש במטרים (מספר, ברירת מחדל: 1000)",
    maxResults: "מספר מקסימלי של תוצאות (מספר, ברירת מחדל: 5)",
    lat: "קו רוחב גיאוגרפי (מספר עשרונית)",
    lng: "קו אורך גיאוגרפי (מספר עשרונית)",
  },
  recommend_equipment: {
    familyProfile: "תיאור המשפחה או האדם (טקסט, למשל: משפחה עם ילדים, אדם עם סכרת)",
    duration: "משך הזמן בשעות (מספר, ברירת מחדל: 72)",
  },
}

// Required parameters for each tool
const requiredParameters: Record<string, string[]> = {
  rag_chat: ["query"],
  find_shelters: ["location"],
  recommend_equipment: ["familyProfile"],
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
  const [collapsedTools, setCollapsedTools] = useState<Set<number>>(new Set())
  const [progress, setProgress] = useState(0)
  const { theme } = useTheme()
  const [isExecutionStopped, setIsExecutionStopped] = useState(false)

  // Calculate progress
  useEffect(() => {
    if (executions.length > 0) {
      const completed = executions.filter((exec) => exec.status === "completed" || exec.status === "skipped").length
      const newProgress = (completed / executions.length) * 100
      setProgress(newProgress)
    } else {
      setProgress(0)
    }
  }, [executions])

  // Auto-approve tools with all required parameters (Nielsen: Reduce user memory load)
  useEffect(() => {
    if (executions.length > 0) {
      const updatedExecutions = executions.map((execution) => {
        if (execution.status !== "pending") {
          return execution
        }

        const required = requiredParameters[execution.tool.id] || []
        const parameters = execution.editedParameters || execution.tool.parameters
        const allRequiredFilled = required.every((param) => parameters[param] && parameters[param] !== "")

        if (allRequiredFilled) {
          return { ...execution, status: "approved" as ExecutionStatus }
        }

        return execution
      })

      if (JSON.stringify(updatedExecutions) !== JSON.stringify(executions)) {
        setExecutions(updatedExecutions)
      }
    }
  }, [executions])

  // Auto-execute approved tools (Nielsen: Minimize user actions)
  useEffect(() => {
    const hasApproved = executions.some((exec) => exec.status === "approved")
    if (hasApproved && currentExecutionIndex === -1) {
      const timer = setTimeout(() => {
        executeNext()
      }, 500) // Small delay for better UX
      return () => clearTimeout(timer)
    }
  }, [executions, currentExecutionIndex])

  const createPlan = async () => {
    if (!prompt.trim()) return

    setIsPlanning(true)
    setPlanningError(null)
    setPlan(null)
    setExecutions([])
    setCollapsedTools(new Set())
    setProgress(0)

    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const planData = await response.json()

      if (planData.error) {
        throw new Error(planData.error)
      }

      if (!planData.tools || !Array.isArray(planData.tools)) {
        throw new Error("Invalid plan structure received")
      }

      setPlan(planData)

      // Set default values for shelter search
      const initialExecutions: ToolExecution[] = planData.tools.map((tool: Tool) => {
        if (tool.id === "find_shelters") {
          const updatedTool = {
            ...tool,
            parameters: {
              ...tool.parameters,
              radius: tool.parameters.radius || 1000,
              maxResults: tool.parameters.maxResults || 5,
            },
          }

          // If we have location from AI, mark as pending, otherwise wait for location
          if (tool.parameters.location && tool.parameters.location !== null) {
            return {
              tool: updatedTool,
              status: "pending" as ExecutionStatus,
            }
          } else {
            return {
              tool: updatedTool,
              status: "waiting_location" as ExecutionStatus,
            }
          }
        }
        return {
          tool,
          status: "pending" as ExecutionStatus,
        }
      })

      setExecutions(initialExecutions)
      setCurrentExecutionIndex(-1)
    } catch (error) {
      console.error("❌ שגיאה ביצירת תוכנית:", error)
      setPlanningError(error instanceof Error ? error.message : "שגיאה לא ידועה")
    } finally {
      setIsPlanning(false)
    }
  }

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
              status: "approved" as ExecutionStatus,
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

  const requestLocation = (toolIndex: number) => {
    setPendingLocationToolIndex(toolIndex)
    setShowLocationSelector(true)
  }

  const approveTool = (index: number) => {
    const execution = executions[index]

    if (execution.tool.id === "find_shelters") {
      // Check if location is missing
      if (!execution.tool.parameters.location || execution.tool.parameters.location === null) {
        // Show location selector instead
        requestLocation(index)
        return
      }
    }

    setExecutions((prev) => prev.map((exec, i) => (i === index ? { ...exec, status: "approved" } : exec)))
  }

  const skipTool = (index: number) => {
    setExecutions((prev) => prev.map((exec, i) => (i === index ? { ...exec, status: "skipped" } : exec)))
  }

  const editTool = (index: number) => {
    setEditingTool(`${index}`)
  }

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
          sessionId: "current-session", // TODO: Get from context
          planContext: plan,
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
          sessionId: "current-session", // TODO: Get from context
          planContext: plan,
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

      // Auto-collapse completed tools (Nielsen: Reduce visual clutter)
      if (result.success) {
        const newCollapsedTools = new Set(collapsedTools)
        newCollapsedTools.add(nextIndex)
        setCollapsedTools(newCollapsedTools)
      }
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
    } finally {
      setCurrentExecutionIndex(-1)
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "executing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "skipped":
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case "waiting_location":
        return <MapPin className="h-4 w-4 text-accent" />
    }
  }

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground"
      case "approved":
        return "bg-primary/10 text-primary"
      case "executing":
        return "bg-primary/10 text-primary"
      case "completed":
        return "bg-primary/10 text-primary"
      case "failed":
        return "bg-destructive/10 text-destructive"
      case "skipped":
        return "bg-muted text-muted-foreground"
      case "waiting_location":
        return "bg-accent/10 text-accent"
    }
  }

  const renderShelterResults = (shelters: any[], searchLocation?: any) => {
    if (!shelters || shelters.length === 0) {
      return <div className="text-muted-foreground">לא נמצאו מקלטים באזור</div>
    }

    return (
      <div className="space-y-3">
        {shelters.map((shelter: any, i: number) => (
          <div key={i} className="border rounded-lg p-3 bg-card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-medium">{shelter.name}</div>
                <div className="text-sm text-muted-foreground">{shelter.address}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Create proper navigation URL with origin and destination
                  const origin = searchLocation ? `${searchLocation.lat},${searchLocation.lng}` : "current+location"
                  const destination = `${shelter.location.lat},${shelter.location.lng}`
                  const url = `https://www.google.com/maps/dir/${origin}/${destination}`
                  window.open(url, "_blank")
                }}
                className="ml-2"
              >
                <Navigation className="h-3 w-3 mr-1" />
                נווט
              </Button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>📍 {shelter.distance.toFixed(1)} ק"מ</span>
              {shelter.duration && <span>🚶 {Math.round(shelter.duration / 60)} דק' הליכה</span>}
              <span>🏷️ {shelter.type}</span>
              {shelter.rating && <span>⭐ {shelter.rating}</span>}
            </div>
          </div>
        ))}

        {/* Map link for all shelters */}
        {searchLocation && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const origin = `${searchLocation.lat},${searchLocation.lng}`
              const url = `https://www.google.com/maps/search/מקלט/@${searchLocation.lat},${searchLocation.lng},15z`
              window.open(url, "_blank")
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            הצג את כל המקלטים במפה
          </Button>
        )}
      </div>
    )
  }

  const renderEquipmentRecommendations = (recommendations: any, familyProfile: string, isPersonalized: boolean) => {
    // Handle structured recommendations (new format)
    if (recommendations.categories && Array.isArray(recommendations.categories)) {
      return (
        <div className="space-y-4">
          {/* Personalized Analysis */}
          {recommendations.personalizedAnalysis && (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">ניתוח מותאם אישית</span>
                {isPersonalized && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    מותאם אישית
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed">{recommendations.personalizedAnalysis}</p>
            </div>
          )}

          {/* Equipment Categories */}
          {recommendations.categories.map((category: any, categoryIndex: number) => (
            <div key={categoryIndex} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge
                    variant={
                      category.priority === "critical"
                        ? "destructive"
                        : category.priority === "important"
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {category.priority === "critical" && "🚨 חיוני"}
                    {category.priority === "important" && "⚠️ חשוב"}
                    {category.priority === "recommended" && "💡 מומלץ"}
                  </Badge>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {category.items.map((item: any, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg",
                      item.specificToProfile ? "bg-accent/10 border border-accent/20" : "bg-muted/20",
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">({item.quantity})</span>
                        {item.specificToProfile && (
                          <Star className="h-3 w-3 text-accent" title="מותאם אישית לפרופיל שלך" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Special Considerations */}
          {recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0 && (
            <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span className="font-medium text-accent">שיקולים מיוחדים</span>
              </div>
              <ul className="text-sm space-y-1">
                {recommendations.specialConsiderations.map((consideration: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Storage Advice */}
          {recommendations.storageAdvice && (
            <div className="bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">עצות אחסון</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{recommendations.storageAdvice}</p>
            </div>
          )}
        </div>
      )
    }

    // Handle fallback text format (old format)
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium">המלצות עבור: {familyProfile}</span>
          {!isPersonalized && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              כללי
            </Badge>
          )}
        </div>
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{recommendations}</pre>
        </div>
      </div>
    )
  }

  const renderResult = (result: any) => {
    if (!result?.result) return null

    const { type } = result.result

    switch (type) {
      case "rag_chat":
        return (
          <div className="space-y-3">
            <div className="font-medium text-primary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              תשובת מערכת המידע
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <p className="whitespace-pre-wrap leading-relaxed">{result.result.answer}</p>
              {result.result.sources && result.result.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <div className="text-xs text-primary font-medium mb-1">מקורות:</div>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {result.result.sources.map((source: any, i: number) => (
                      <li key={i}>
                        {source.storage_path && source.storage_path.startsWith("http") ? (
                          <a
                            href={source.storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {source.title || source}
                          </a>
                        ) : (
                          source.title || source
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case "shelter_search":
        return (
          <div className="space-y-3">
            <div className="font-medium text-primary flex items-center gap-2">
              <Home className="h-4 w-4" />
              מקלטים שנמצאו ({result.result.shelters?.length || 0})
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              {renderShelterResults(result.result.shelters, result.result.coordinates)}
            </div>
          </div>
        )

      case "equipment_recommendations":
        return (
          <div className="space-y-3">
            <div className="font-medium text-primary flex items-center gap-2">
              <Backpack className="h-4 w-4" />
              המלצות ציוד חירום
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              {renderEquipmentRecommendations(
                result.result.recommendations,
                result.result.familyProfile,
                result.result.isPersonalized,
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-sm bg-muted p-3 rounded">
            <pre className="text-xs overflow-auto">{JSON.stringify(result.result, null, 2)}</pre>
          </div>
        )
    }
  }

  const toggleCollapse = (index: number) => {
    const newCollapsedTools = new Set(collapsedTools)
    if (newCollapsedTools.has(index)) {
      newCollapsedTools.delete(index)
    } else {
      newCollapsedTools.add(index)
    }
    setCollapsedTools(newCollapsedTools)
  }

  const isRequired = (toolId: string, paramName: string) => {
    const required = requiredParameters[toolId] || []
    return required.includes(paramName)
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <LocationSelector
          isVisible={showLocationSelector}
          onLocationSelected={handleLocationSelected}
          onCancel={() => {
            setShowLocationSelector(false)
            setPendingLocationToolIndex(null)
          }}
        />

        {/* Header */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <div className="text-xl">סוכן AI לחירום</div>
                <div className="text-sm font-normal text-muted-foreground">תכנון ובקרה אוטומטיים</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Textarea
              placeholder="תאר את המצב או מה שאתה צריך... (למשל: 'יש אזעקה ואני עם 2 ילדים בתל אביב')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="text-right resize-none"
            />
            <Button
              onClick={createPlan}
              disabled={!prompt.trim() || isPlanning}
              className="w-full bg-primary hover:bg-primary/90 h-12"
              size="lg"
            >
              {isPlanning ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <Brain className="h-5 w-5" />
                  מתכנן פעולות...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  צור תוכנית פעולה
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {executions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>התקדמות ביצוע</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planning Status */}
        {isPlanning && (
          <Card className="border-primary/20 bg-primary/5 shadow-md animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <div className="font-medium text-primary">מתכנן פעולות...</div>
                  <div className="text-sm text-muted-foreground">מנתח את המצב ובוחר כלים מתאימים</div>
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
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                ניתוח המצב
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="leading-relaxed">{plan.analysis}</p>
              {plan.needsClarification && (
                <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    <span className="font-medium text-accent">נדרשות הבהרות:</span>
                  </div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
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
          <div className="space-y-4">
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span>תוכנית ביצוע ({executions.length} כלים)</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {executions.filter((e) => e.status === "completed").length} מתוך {executions.length} הושלמו
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

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
                isCollapsed={collapsedTools.has(index)}
                toggleCollapse={() => toggleCollapse(index)}
                isRequired={isRequired}
                setIsExecutionStopped={setIsExecutionStopped}
                setExecutions={setExecutions}
                setCurrentExecutionIndex={setCurrentExecutionIndex}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
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
  isCollapsed: boolean
  toggleCollapse: () => void
  isRequired: (toolId: string, paramName: string) => boolean
  setIsExecutionStopped: (isStopped: boolean) => void
  setExecutions: (executions: ToolExecution[]) => void
  setCurrentExecutionIndex: (index: number) => void
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
  isCollapsed,
  toggleCollapse,
  isRequired,
  setIsExecutionStopped,
  setExecutions,
  setCurrentExecutionIndex,
}: ToolExecutionCardProps) {
  const [editedParams, setEditedParams] = useState(execution.tool.parameters)
  // הוסף אחרי השורה של editedParams
  const [tempLocation, setTempLocation] = useState<LocationData | null>(null)
  const [showLocationSelectorInEdit, setShowLocationSelectorInEdit] = useState(false)

  const handleSave = () => {
    let finalParams = { ...editedParams }

    // אם יש מיקום זמני, עדכן את הפרמטרים
    if (tempLocation) {
      finalParams = {
        ...finalParams,
        location: tempLocation.displayName || tempLocation.address || "מיקום נוכחי",
        lat: tempLocation.lat,
        lng: tempLocation.lng,
        locationType: tempLocation.type,
      }
    }

    onSaveEdit(finalParams)
    setTempLocation(null) // נקה את המיקום הזמני
  }

  const getToolIcon = (toolId: string) => {
    switch (toolId) {
      case "rag_chat":
        return <Shield className="h-5 w-5" />
      case "find_shelters":
        return <Home className="h-5 w-5" />
      case "recommend_equipment":
        return <Backpack className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getToolColor = (toolId: string) => {
    switch (toolId) {
      case "rag_chat":
        return "text-primary"
      case "find_shelters":
        return "text-primary"
      case "recommend_equipment":
        return "text-primary"
      default:
        return "text-primary"
    }
  }

  const handleLocationSelectedInEdit = (location: LocationData) => {
    setTempLocation(location)
    setShowLocationSelectorInEdit(false)

    // עדכן את השדה location בתצוגה (אבל לא שומר עדיין)
    setEditedParams((prev) => ({
      ...prev,
      location: location.displayName || location.address || "מיקום נוכחי",
    }))
  }

  return (
    <>
      <LocationSelector
        isVisible={showLocationSelectorInEdit}
        onLocationSelected={handleLocationSelectedInEdit}
        onCancel={() => setShowLocationSelectorInEdit(false)}
      />
      <Card
        className={cn(
          "border-2 shadow-md transition-all duration-300",
          execution.status === "executing" && "border-primary/50 shadow-lg",
          execution.status === "completed" && "border-primary/30",
          execution.status === "failed" && "border-destructive/30",
          isCollapsed && "opacity-75",
        )}
      >
        <CardHeader
          className={cn(
            "p-4 cursor-pointer transition-colors",
            "bg-gradient-to-r from-primary/5 to-accent/5",
            "hover:from-primary/10 hover:to-accent/10",
          )}
          onClick={toggleCollapse}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className={getToolColor(execution.tool.id)}>{getToolIcon(execution.tool.id)}</div>
              <Badge variant="outline" className="text-xs">
                עדיפות {execution.tool.priority}
              </Badge>
              <h3 className="font-medium">{execution.tool.name}</h3>
              <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                {execution.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSkip()
                      }}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      דלג
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                      }}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">ערוך</span>
                      <span className="sm:hidden">ערוך</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onApprove()
                      }}
                      className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      אשר
                    </Button>
                  </>
                )}
                {execution.status === "executing" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExecutionStopped(true)
                      setExecutions((prev) =>
                        prev.map((exec, i) =>
                          i === index
                            ? { ...exec, status: "failed", result: { success: false, error: "הופסק על ידי המשתמש" } }
                            : exec,
                        ),
                      )
                      setCurrentExecutionIndex(-1)
                    }}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    עצור
                  </Button>
                )}
                {(execution.status === "completed" || execution.status === "failed") && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                      }}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">ערוך</span>
                      <span className="sm:hidden">ערוך</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        retryTool(index)
                      }}
                      disabled={retryingTool === `${index}`}
                      className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {retryingTool === `${index}` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      הרץ מחדש
                    </Button>
                  </>
                )}
                {execution.status === "waiting_location" && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      requestLocation()
                    }}
                    className="bg-accent hover:bg-accent/90 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    בחר מיקום
                  </Button>
                )}
                {execution.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      retryTool(index)
                    }}
                    disabled={retryingTool === `${index}`}
                    className="border-destructive text-destructive hover:bg-destructive/10 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {retryingTool === `${index}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "נסה שוב"}
                  </Button>
                )}
              </div>

              <Button size="sm" variant="ghost" className="p-1 h-8 w-8 rounded-full">
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-4 space-y-4 animate-slide-down">
            <p className="text-sm text-muted-foreground leading-relaxed">{execution.tool.reasoning}</p>

            {execution.status === "executing" && (
              <div className="text-sm text-primary bg-primary/10 p-3 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {execution.tool.id === "rag_chat" && "בודק מידע במערכת פיקוד העורף..."}
                  {execution.tool.id === "find_shelters" && "מחפש מקלטים באזור המבוקש..."}
                  {execution.tool.id === "recommend_equipment" && "מכין המלצות ציוד מותאמות אישית..."}
                </div>
              </div>
            )}

            {execution.status === "waiting_location" && (
              <div className="text-sm text-accent bg-accent/10 p-3 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  נדרש מיקום לחיפוש מקלטים. לחץ על "בחר מיקום" כדי להמשיך.
                </div>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">פרמטרים:</h4>
              {isEditing ? (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  {Object.entries(editedParams).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium flex items-center gap-2">
                        {key}
                        {isRequired(execution.tool.id, key) && <span className="text-destructive text-xs">*</span>}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{parameterDescriptions[execution.tool.id]?.[key] || "פרמטר לכלי"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      {key === "location" && execution.tool.id === "find_shelters" ? (
                        <div className="space-y-2">
                          <Input
                            value={value as string}
                            onChange={(e) =>
                              setEditedParams((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className={cn(
                              "text-sm",
                              isRequired(execution.tool.id, key) &&
                                (!value || value === "") &&
                                "border-destructive focus:border-destructive",
                            )}
                            placeholder="הזן כתובת או שם מקום"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowLocationSelectorInEdit(true)
                            }}
                            className="w-full"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            בחר מיקום על המפה או השתמש במיקום נוכחי
                          </Button>
                        </div>
                      ) : (
                        <Input
                          value={value as string}
                          onChange={(e) =>
                            setEditedParams((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className={cn(
                            "text-sm",
                            isRequired(execution.tool.id, key) &&
                              (!value || value === "") &&
                              "border-destructive focus:border-destructive",
                          )}
                          placeholder={
                            key === "radius" ? "1000" : key === "maxResults" ? "5" : key === "duration" ? "72" : ""
                          }
                        />
                      )}
                      {isRequired(execution.tool.id, key) && (!value || value === "") && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          שדה חובה
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90">
                      שמור שינויים
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancelEdit}>
                      בטל
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                  {tempLocation && (
                    <div className="text-xs text-accent bg-accent/10 p-2 rounded border border-accent/20">
                      מיקום חדש נבחר: {tempLocation.displayName || tempLocation.address || "מיקום נוכחי"}
                      (יישמר לאחר לחיצה על "שמור שינויים")
                    </div>
                  )}
                  {Object.entries(execution.editedParameters || execution.tool.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="font-medium flex items-center gap-1">
                        {key}:
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{parameterDescriptions[execution.tool.id]?.[key] || "פרמטר לכלי"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="text-muted-foreground">{value as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {execution.result && (
              <div className="space-y-3">
                <Separator />
                <h4 className="text-sm font-medium">תוצאות:</h4>
                {execution.result.success ? (
                  renderResult(execution.result)
                ) : (
                  <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <div className="text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">שגיאה:</span>
                      <span>{execution.result.error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </>
  )
}
