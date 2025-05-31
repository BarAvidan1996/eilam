"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  AlertTriangle,
  MapPin,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import type { JSX } from "react"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"

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

type ExecutionStatus = "pending" | "approved" | "executing" | "completed" | "failed" | "skipped"

interface ToolExecution {
  tool: Tool
  status: ExecutionStatus
  result?: ExecutionResult
  editedParameters?: Record<string, any>
}

export default function AgentInterface() {
  const [prompt, setPrompt] = useState("")
  const [plan, setPlan] = useState<Plan | null>(null)
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [currentExecutionIndex, setCurrentExecutionIndex] = useState(-1)
  const [editingTool, setEditingTool] = useState<string | null>(null)
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})

  // Create execution plan
  const createPlan = async () => {
    if (!prompt.trim()) return

    setIsPlanning(true)
    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const planData = await response.json()
      setPlan(planData)

      // Initialize executions
      const initialExecutions: ToolExecution[] = planData.tools.map((tool: Tool) => ({
        tool,
        status: "pending" as ExecutionStatus,
      }))
      setExecutions(initialExecutions)
      setCurrentExecutionIndex(-1)
    } catch (error) {
      console.error("Failed to create plan:", error)
    } finally {
      setIsPlanning(false)
    }
  }

  // Approve tool for execution
  const approveTool = (index: number) => {
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

  // Toggle result expansion
  const toggleResultExpansion = (toolId: string) => {
    setExpandedResults((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }))
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

      // Auto-expand the result
      setExpandedResults((prev) => ({
        ...prev,
        [execution.tool.id]: true,
      }))
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
        return <Spinner size="small" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "skipped":
        return <XCircle className="h-4 w-4 text-gray-400" />
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
    }
  }

  const getToolIcon = (toolId: string) => {
    switch (toolId) {
      case "rag_chat":
        return <Search className="h-4 w-4" />
      case "find_shelters":
        return <MapPin className="h-4 w-4" />
      case "recommend_equipment":
        return <Package className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
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
            placeholder="תאר את המצב או מה שאתה צריך... (למשל: 'יש אזעקה ואני עם 2 ילדים בתל אביב')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="text-right"
          />
          <Button onClick={createPlan} disabled={!prompt.trim() || isPlanning} className="w-full">
            {isPlanning ? (
              <>
                <Spinner size="small" className="mr-2" /> מתכנן...
              </>
            ) : (
              "צור תוכנית פעולה"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plan Analysis */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>ניתוח המצב</CardTitle>
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
              <span>תוכנית ביצוע</span>
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
                isExpanded={expandedResults[execution.tool.id] || false}
                onApprove={() => approveTool(index)}
                onSkip={() => skipTool(index)}
                onEdit={() => editTool(index)}
                onSaveEdit={(params) => saveEditedParameters(index, params)}
                onCancelEdit={() => setEditingTool(null)}
                onToggleExpand={() => toggleResultExpansion(execution.tool.id)}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getToolIcon={getToolIcon}
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
  isExpanded: boolean
  onApprove: () => void
  onSkip: () => void
  onEdit: () => void
  onSaveEdit: (params: Record<string, any>) => void
  onCancelEdit: () => void
  onToggleExpand: () => void
  getStatusIcon: (status: ExecutionStatus) => JSX.Element
  getStatusColor: (status: ExecutionStatus) => string
  getToolIcon: (toolId: string) => JSX.Element
}

function ToolExecutionCard({
  execution,
  index,
  isEditing,
  isExpanded,
  onApprove,
  onSkip,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleExpand,
  getStatusIcon,
  getStatusColor,
  getToolIcon,
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
          <div className="flex items-center gap-1">
            {getToolIcon(execution.tool.id)}
            <h3 className="font-medium">{execution.tool.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(execution.status)}
            <Badge className={`text-xs ${getStatusColor(execution.status)}`}>{execution.status}</Badge>
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
      </div>

      {/* Reasoning */}
      <p className="text-sm text-gray-600">{execution.tool.reasoning}</p>

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
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">תוצאות:</h4>
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {execution.result.success ? (
            <div className="text-sm bg-blue-50 p-3 rounded">
              <div className="font-medium text-green-700 mb-2">✅ הושלם בהצלחה</div>

              {isExpanded && (
                <div className="mt-3">
                  {execution.result.result.type === "rag_chat" && <RagChatResult result={execution.result.result} />}

                  {execution.result.result.type === "shelter_search" && (
                    <ShelterSearchResult result={execution.result.result} />
                  )}

                  {execution.result.result.type === "equipment_recommendations" && (
                    <EquipmentResult result={execution.result.result} />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-700 bg-red-50 p-3 rounded">❌ שגיאה: {execution.result.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

// RAG Chat Result Component
function RagChatResult({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-white rounded border border-blue-100">
        <p className="whitespace-pre-wrap">{result.answer}</p>
      </div>

      {result.sources && result.sources.length > 0 && (
        <div>
          <h5 className="text-xs font-medium mb-1">מקורות:</h5>
          <div className="text-xs space-y-1">
            {result.sources.map((source: any, i: number) => (
              <div key={i} className="p-2 bg-gray-50 rounded">
                {source.title || source.url}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/chat" passHref>
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            <ExternalLink size={12} />
            המשך בצ'אט מלא
          </Button>
        </Link>
      </div>
    </div>
  )
}

// Shelter Search Result Component
function ShelterSearchResult({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-medium">מיקום: </span>
          <span className="text-xs">{result.location}</span>
        </div>
        <div>
          <span className="text-xs font-medium">רדיוס: </span>
          <span className="text-xs">{result.radius} מטר</span>
        </div>
      </div>

      {result.shelters && result.shelters.length > 0 ? (
        <div className="space-y-2">
          {result.shelters.map((shelter: any, i: number) => (
            <div key={i} className="p-2 bg-white rounded border border-blue-100">
              <div className="font-medium">{shelter.name}</div>
              <div className="text-xs text-gray-600">{shelter.address}</div>
              <div className="flex justify-between mt-1 text-xs">
                <span>מרחק: {shelter.distance_text}</span>
                <span>זמן הליכה: {shelter.duration_text}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 bg-yellow-50 rounded text-yellow-700 text-xs">
          לא נמצאו מקלטים במיקום זה או שאירעה שגיאה בחיפוש.
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/shelters" passHref>
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            <ExternalLink size={12} />
            חיפוש מקלטים מתקדם
          </Button>
        </Link>
      </div>
    </div>
  )
}

// Equipment Recommendations Result Component
function EquipmentResult({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-medium">פרופיל: </span>
          <span className="text-xs">{result.familyProfile}</span>
        </div>
        <div>
          <span className="text-xs font-medium">משך זמן: </span>
          <span className="text-xs">{result.duration} שעות</span>
        </div>
      </div>

      {result.recommendations && result.recommendations.categories ? (
        <div className="space-y-2">
          {Object.entries(result.recommendations.categories).map(([category, items]: [string, any]) => (
            <div key={category} className="p-2 bg-white rounded border border-blue-100">
              <div className="font-medium">{category}</div>
              <ul className="list-disc list-inside text-xs">
                {items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 bg-yellow-50 rounded text-yellow-700 text-xs">
          לא נמצאו המלצות ציוד או שאירעה שגיאה בחיפוש.
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/equipment-lists" passHref>
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            <ExternalLink size={12} />
            רשימות ציוד מלאות
          </Button>
        </Link>
      </div>
    </div>
  )
}
