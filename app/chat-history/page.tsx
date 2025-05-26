"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, MessageSquare, Save, X, Plus, Calendar, Eye, Edit2, Bot, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

interface ChatSession {
  id: string
  title: string
  created_at: string
  ai_summary?: string
  message_count?: number
  last_message_at?: string
}

interface AIGenerationError {
  sessionId: string
  error: string
  timestamp: Date
}

export default function ChatHistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [pendingAIGeneration, setPendingAIGeneration] = useState<string[]>([])
  const [aiGenerationErrors, setAIGenerationErrors] = useState<AIGenerationError[]>([])
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null)

  // טעינת משתמש נוכחי
  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("❌ שגיאה בטעינת משתמש:", error)
        return null
      }

      console.log("👤 משתמש נוכחי:", user?.id)
      setCurrentUser(user)
      return user
    } catch (error) {
      console.error("❌ שגיאה כללית בטעינת משתמש:", error)
      return null
    }
  }

  // יצירת תקציר fallback מההודעה הראשונה
  const createFallbackSummary = (messagesData: any[]) => {
    if (!messagesData || messagesData.length === 0) {
      return "שיחה ללא הודעות"
    }

    const userMessages = messagesData.filter((m) => m.role === "user")
    if (userMessages.length === 0) {
      return "שיחה ללא שאלות"
    }

    const firstUserMessage = userMessages[userMessages.length - 1]?.content || ""
    return firstUserMessage.length > 100 ? firstUserMessage.substring(0, 100) + "..." : firstUserMessage
  }

  // הוספת שגיאה לרשימה
  const addAIGenerationError = (sessionId: string, error: string) => {
    console.error(`❌ שגיאה ביצירת AI לשיחה ${sessionId}:`, error)
    setAIGenerationErrors((prev) => [
      ...prev.filter((e) => e.sessionId !== sessionId), // הסרת שגיאות קודמות לאותה שיחה
      { sessionId, error, timestamp: new Date() },
    ])
  }

  // הסרת שגיאה
  const removeAIGenerationError = (sessionId: string) => {
    setAIGenerationErrors((prev) => prev.filter((e) => e.sessionId !== sessionId))
  }

  // טעינת שיחות מהדטאבייס
  const fetchChatSessions = async () => {
    setIsLoading(true)

    try {
      const user = await loadCurrentUser()
      if (!user) {
        console.log("❌ אין משתמש מחובר")
        setChatSessions([])
        setIsLoading(false)
        return
      }

      console.log("🔍 טוען שיחות עבור משתמש:", user.id)

      // שאילתה לטבלת chat_sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*, ai_summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (sessionsError) {
        console.error("❌ שגיאה בשאילתת שיחות:", sessionsError)
        setChatSessions([])
        setIsLoading(false)
        return
      }

      console.log("📋 נמצאו שיחות:", sessionsData?.length || 0, sessionsData)

      if (!sessionsData || sessionsData.length === 0) {
        setChatSessions([])
        setIsLoading(false)
        return
      }

      // הוספת מידע נוסף לכל שיחה
      const enrichedSessions = await Promise.all(
        sessionsData.map(async (session) => {
          console.log("🔍 מעבד שיחה:", session.id)

          // שאילתה להודעות השיחה
          const { data: messagesData, error: messagesError } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })

          if (messagesError) {
            console.error("❌ שגיאה בטעינת הודעות לשיחה:", session.id, messagesError)
          }

          const messageCount = messagesData?.length || 0
          const lastMessageAt = messagesData?.[0]?.created_at || session.created_at

          console.log(`📊 שיחה ${session.id}: ${messageCount} הודעות`)

          return {
            ...session,
            message_count: messageCount,
            last_message_at: lastMessageAt,
          }
        }),
      )

      console.log("✅ שיחות מעובדות:", enrichedSessions.length)

      // סינון שיחות שיש בהן לפחות הודעה אחת
      const filteredSessions = enrichedSessions.filter((session) => session.message_count > 0)
      console.log("🔍 שיחות עם הודעות:", filteredSessions.length)

      setChatSessions(filteredSessions)

      // זיהוי שיחות שצריכות AI generation (אבל לא יצירה מיידית)
      const sessionsNeedingAI = filteredSessions.filter((session) => {
        const needsSummary = !session.ai_summary && session.message_count >= 2
        const needsTitle =
          (!session.title || session.title === "" || session.title === "שיחה חדשה") && session.message_count >= 2
        return needsSummary || needsTitle
      })

      if (sessionsNeedingAI.length > 0) {
        console.log(`🤖 זוהו ${sessionsNeedingAI.length} שיחות שצריכות AI generation`)
        setPendingAIGeneration(sessionsNeedingAI.map((s) => s.id))

        // יצירה הדרגתית - רק השיחה הראשונה
        if (sessionsNeedingAI.length > 0) {
          console.log("🚀 מתחיל יצירת AI לשיחה הראשונה:", sessionsNeedingAI[0].id)
          await processNextAIGeneration(sessionsNeedingAI[0].id)
        }
      }
    } catch (error) {
      console.error("❌ שגיאה כללית בטעינת שיחות:", error)
      setChatSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // עיבוד הדרגתי של AI generation
  const processNextAIGeneration = async (sessionId: string) => {
    const startTime = Date.now()
    console.log(`🚀 מתחיל עיבוד AI לשיחה ${sessionId} בשעה ${new Date().toLocaleTimeString()}`)

    setCurrentlyProcessing(sessionId)

    // טיימר לזיהוי תקיעות (60 שניות)
    const timeoutId = setTimeout(() => {
      console.error(`⏰ TIMEOUT: עיבוד AI לשיחה ${sessionId} נתקע למעלה מ-60 שניות`)
      addAIGenerationError(sessionId, "הזמן הקצוב לעיבוד עבר - נסה שוב מאוחר יותר")
      setCurrentlyProcessing(null)

      // המשך לשיחה הבאה
      setPendingAIGeneration((prev) => {
        const newList = prev.filter((id) => id !== sessionId)
        if (newList.length > 0) {
          setTimeout(() => processNextAIGeneration(newList[0]), 1000)
        }
        return newList
      })
    }, 60000) // 60 שניות

    try {
      const session = chatSessions.find((s) => s.id === sessionId)
      if (!session) {
        console.error(`❌ לא נמצאה שיחה עם ID: ${sessionId}`)
        addAIGenerationError(sessionId, "שיחה לא נמצאה")
        clearTimeout(timeoutId)
        setCurrentlyProcessing(null)
        return
      }

      console.log(`📊 שיחה ${sessionId}: ${session.message_count} הודעות`)

      // בדיקה אם צריך כותרת
      if (!session.title || session.title === "" || session.title === "שיחה חדשה") {
        console.log(`🏷️ יוצר כותרת AI לשיחה ${sessionId}`)
        const titleSuccess = await generateAITitle(sessionId)
        if (!titleSuccess) {
          addAIGenerationError(sessionId, "נכשל ביצירת כותרת")
          clearTimeout(timeoutId)
          setCurrentlyProcessing(null)
          return
        }
      }

      // בדיקה אם צריך תקציר
      if (!session.ai_summary) {
        console.log(`🤖 יוצר תקציר AI לשיחה ${sessionId}`)
        const summarySuccess = await generateAISummary(sessionId)
        if (!summarySuccess) {
          addAIGenerationError(sessionId, "נכשל ביצירת תקציר")
          clearTimeout(timeoutId)
          setCurrentlyProcessing(null)
          return
        }
      }

      // הצלחה!
      clearTimeout(timeoutId)
      setCurrentlyProcessing(null)
      removeAIGenerationError(sessionId)

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      console.log(`✅ סיים עיבוד AI לשיחה ${sessionId} תוך ${duration} שניות`)

      // הסרה מרשימת הממתינים
      setPendingAIGeneration((prev) => {
        const newList = prev.filter((id) => id !== sessionId)

        // אם יש עוד שיחות ממתינות, עבד את הבאה אחרי 2 שניות
        if (newList.length > 0) {
          console.log(`⏭️ עובר לשיחה הבאה: ${newList[0]} (נותרו ${newList.length})`)
          setTimeout(() => {
            processNextAIGeneration(newList[0])
          }, 2000) // המתנה של 2 שניות בין יצירות
        } else {
          console.log("🎉 סיים עיבוד כל השיחות!")
        }

        return newList
      })
    } catch (error) {
      clearTimeout(timeoutId)
      setCurrentlyProcessing(null)
      console.error(`❌ שגיאה כללית בעיבוד AI לשיחה ${sessionId}:`, error)
      addAIGenerationError(sessionId, `שגיאה כללית: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`)

      // הסרה מהרשימה גם במקרה של שגיאה והמשך לבאה
      setPendingAIGeneration((prev) => {
        const newList = prev.filter((id) => id !== sessionId)
        if (newList.length > 0) {
          setTimeout(() => processNextAIGeneration(newList[0]), 3000) // המתנה ארוכה יותר אחרי שגיאה
        }
        return newList
      })
    }
  }

  // יצירת תקציר AI
  const generateAISummary = async (sessionId: string): Promise<boolean> => {
    setIsGeneratingSummary(sessionId)

    try {
      console.log(`🤖 מתחיל יצירת תקציר לשיחה: ${sessionId}`)

      // קבלת הודעות השיחה
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error(`❌ שגיאה בקבלת הודעות לשיחה ${sessionId}:`, error)
        return false
      }

      if (!messages || messages.length === 0) {
        console.log(`❌ אין הודעות לשיחה ${sessionId}`)
        return false
      }

      console.log(`📨 נמצאו ${messages.length} הודעות לשיחה ${sessionId}`)

      // שליחה ל-API לתקציר
      console.log(`🌐 שולח בקשה ל-API summarize עבור שיחה ${sessionId}`)
      const response = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ שגיאה בקריאה ל-API summarize (${response.status}):`, errorText)
        return false
      }

      const { summary } = await response.json()
      console.log(`✅ תקציר נוצר לשיחה ${sessionId}:`, summary)

      // עדכון התקציר בטבלה
      console.log(`💾 מעדכן תקציר בדטאבייס לשיחה ${sessionId}`)
      const { error: updateError } = await supabase
        .from("chat_sessions")
        .update({ ai_summary: summary })
        .eq("id", sessionId)

      if (updateError) {
        console.error(`❌ שגיאה בעדכון תקציר בדטאבייס לשיחה ${sessionId}:`, updateError)
        return false
      }

      // עדכון המצב המקומי
      setChatSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, ai_summary: summary } : session)),
      )

      console.log(`✅ תקציר עודכן בהצלחה לשיחה ${sessionId}`)
      return true
    } catch (error) {
      console.error(`❌ שגיאה ביצירת תקציר לשיחה ${sessionId}:`, error)
      return false
    } finally {
      setIsGeneratingSummary(null)
    }
  }

  // יצירת כותרת AI
  const generateAITitle = async (sessionId: string): Promise<boolean> => {
    setIsGeneratingTitle(sessionId)

    try {
      console.log(`🏷️ מתחיל יצירת כותרת לשיחה: ${sessionId}`)

      // קבלת הודעות השיחה
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error(`❌ שגיאה בקבלת הודעות לשיחה ${sessionId}:`, error)
        return false
      }

      if (!messages || messages.length === 0) {
        console.log(`❌ אין הודעות לשיחה ${sessionId}`)
        return false
      }

      console.log(`📨 נמצאו ${messages.length} הודעות לשיחה ${sessionId}`)

      // שליחה ל-API לכותרת
      console.log(`🌐 שולח בקשה ל-API title עבור שיחה ${sessionId}`)
      const response = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ שגיאה בקריאה ל-API title (${response.status}):`, errorText)
        return false
      }

      const { title } = await response.json()
      console.log(`✅ כותרת נוצרה לשיחה ${sessionId}:`, title)

      // עדכון הכותרת בטבלה
      console.log(`💾 מעדכן כותרת בדטאבייס לשיחה ${sessionId}`)
      const { error: updateError } = await supabase.from("chat_sessions").update({ title: title }).eq("id", sessionId)

      if (updateError) {
        console.error(`❌ שגיאה בעדכון כותרת בדטאבייס לשיחה ${sessionId}:`, updateError)
        return false
      }

      // עדכון המצב המקומי
      setChatSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, title: title } : session)),
      )

      console.log(`✅ כותרת עודכנה בהצלחה לשיחה ${sessionId}`)
      return true
    } catch (error) {
      console.error(`❌ שגיאה ביצירת כותרת לשיחה ${sessionId}:`, error)
      return false
    } finally {
      setIsGeneratingTitle(null)
    }
  }

  // יצירה ידנית של תקציר (כפתור)
  const manualGenerateAISummary = async (sessionId: string) => {
    console.log(`🖱️ יצירה ידנית של תקציר לשיחה ${sessionId}`)
    // הסרה מרשימת הממתינים אם קיימת
    setPendingAIGeneration((prev) => prev.filter((id) => id !== sessionId))
    removeAIGenerationError(sessionId)

    const success = await generateAISummary(sessionId)
    if (!success) {
      addAIGenerationError(sessionId, "נכשל ביצירת תקציר ידני")
    }
  }

  // ניסיון חוזר לשיחה עם שגיאה
  const retryAIGeneration = async (sessionId: string) => {
    console.log(`🔄 ניסיון חוזר לשיחה ${sessionId}`)
    removeAIGenerationError(sessionId)
    setPendingAIGeneration((prev) => [...prev, sessionId])
    await processNextAIGeneration(sessionId)
  }

  // עריכת שם שיחה
  const startEditing = (session: ChatSession) => {
    setEditingId(session.id)
    setEditingTitle(session.title)
  }

  const saveTitle = async () => {
    if (!editingId || !editingTitle.trim()) return

    try {
      console.log("💾 שומר כותרת חדשה:", editingTitle)

      const { error } = await supabase.from("chat_sessions").update({ title: editingTitle.trim() }).eq("id", editingId)

      if (error) {
        console.error("❌ שגיאה בשמירת כותרת:", error)
        return
      }

      setChatSessions((prev) =>
        prev.map((session) => (session.id === editingId ? { ...session, title: editingTitle.trim() } : session)),
      )

      console.log("✅ כותרת נשמרה")
    } catch (error) {
      console.error("❌ שגיאה בשמירת כותרת:", error)
    } finally {
      setEditingId(null)
      setEditingTitle("")
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  // מחיקת שיחה
  const deleteSession = async (sessionId: string) => {
    setSessionToDelete(sessionId)
    setIsOpen(true)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      console.log("🗑️ מוחק שיחה:", sessionToDelete)

      // הסרה מרשימת הממתינים ושגיאות
      setPendingAIGeneration((prev) => prev.filter((id) => id !== sessionToDelete))
      removeAIGenerationError(sessionToDelete)

      // מחיקת הודעות תחילה
      const { error: messagesError } = await supabase.from("chat_messages").delete().eq("session_id", sessionToDelete)

      if (messagesError) {
        console.error("❌ שגיאה במחיקת הודעות:", messagesError)
        return
      }

      // מחיקת השיחה
      const { error: sessionError } = await supabase.from("chat_sessions").delete().eq("id", sessionToDelete)

      if (sessionError) {
        console.error("❌ שגיאה במחיקת שיחה:", sessionError)
        return
      }

      setChatSessions((prev) => prev.filter((session) => session.id !== sessionToDelete))
      console.log("✅ שיחה נמחקה")
    } catch (error) {
      console.error("❌ שגיאה במחיקת שיחה:", error)
    } finally {
      setIsOpen(false)
      setSessionToDelete(null)
    }
  }

  useEffect(() => {
    fetchChatSessions()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">טוען היסטוריית שיחות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      {/* Content Container */}
      <div className="max-w-4xl mx-auto">
        {/* Header - aligned to the right within the content area */}
        <div className="text-right mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-start gap-2">
            <History className="h-8 w-8" />
            היסטוריית שיחות צ'אט
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            נהל את השיחות שלך עם עיל"ם ({chatSessions.length} שיחות)
            {pendingAIGeneration.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400 mr-2">
                • מעבד {pendingAIGeneration.length} תקצירים...
                {currentlyProcessing && (
                  <span className="text-sm"> (כרגע: {currentlyProcessing.substring(0, 8)}...)</span>
                )}
              </span>
            )}
            {aiGenerationErrors.length > 0 && (
              <span className="text-red-600 dark:text-red-400 mr-2">• {aiGenerationErrors.length} שגיאות</span>
            )}
          </p>
        </div>

        {/* Error Messages */}
        {aiGenerationErrors.length > 0 && (
          <div className="mb-4 space-y-2">
            {aiGenerationErrors.map((error) => (
              <Alert key={error.sessionId} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    שגיאה בעיבוד שיחה {error.sessionId.substring(0, 8)}...: {error.error}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryAIGeneration(error.sessionId)}
                    className="mr-2"
                  >
                    נסה שוב
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* New Chat Button - positioned above the list, aligned to the left within content area */}
        <div className="flex justify-start mb-4">
          <Link href="/chat">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:text-black">
              <Plus className="h-4 w-4 ml-2" />
              שיחה חדשה
            </Button>
          </Link>
        </div>

        {/* Sessions List */}
        {chatSessions.length > 0 ? (
          <div className="space-y-4">
            {chatSessions.map((session) => {
              const hasError = aiGenerationErrors.some((e) => e.sessionId === session.id)
              const isPending = pendingAIGeneration.includes(session.id)
              const isCurrentlyProcessing = currentlyProcessing === session.id

              return (
                <Card
                  key={session.id}
                  className={`shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800 ${
                    hasError
                      ? "border-red-300 dark:border-red-600"
                      : isCurrentlyProcessing
                        ? "border-blue-300 dark:border-blue-600"
                        : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Chat content */}
                      <div className="flex-1">
                        {editingId === session.id ? (
                          <div className="flex gap-2 mb-4">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="text-lg font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle()
                                if (e.key === "Escape") cancelEditing()
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={saveTitle}
                              className="bg-[#005C72] hover:bg-[#004A5C] text-white dark:bg-[#D3E3FD] dark:hover:bg-[#C1D7FB] dark:text-black"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <h2 className="text-xl font-semibold text-[#005C72] dark:text-[#D3E3FD] mb-3 flex items-center gap-2">
                            {session.title ||
                              `שיחה מ-${format(new Date(session.created_at), "d/M/yyyy", { locale: he })}`}
                            {isGeneratingTitle === session.id && <Spinner size="small" className="text-blue-500" />}
                          </h2>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <SummaryDisplay session={session} supabase={supabase} />
                          {isGeneratingSummary === session.id && <Spinner size="small" className="text-blue-500" />}
                          {isPending && !isCurrentlyProcessing && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">ממתין לעיבוד...</span>
                          )}
                          {isCurrentlyProcessing && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Spinner size="small" />
                              מעבד כרגע...
                            </span>
                          )}
                          {hasError && (
                            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              שגיאה
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.created_at), "d MMMM, yyyy HH:mm", { locale: he })}
                          </span>

                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {session.message_count} הודעות
                          </span>
                        </div>
                      </div>

                      {/* Action buttons - 2x2 grid layout */}
                      <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                        {/* Top row */}
                        <div className="flex gap-2">
                          <Link href={`/chat?session=${session.id}`} className="flex-1">
                            <Button
                              size="sm"
                              className="w-full bg-[#005C72] hover:bg-[#004A5C] text-white dark:bg-[#D3E3FD] dark:hover:bg-[#C1D7FB] dark:text-black"
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              פתח שיחה
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(session)}
                            title="ערוך שם"
                            className="flex-1"
                          >
                            <Edit2 className="h-4 w-4 ml-2" />
                            ערוך כותרת
                          </Button>
                        </div>

                        {/* Bottom row */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => manualGenerateAISummary(session.id)}
                            disabled={isGeneratingSummary === session.id || isCurrentlyProcessing}
                            title="צור תקציר AI"
                            className="flex-1"
                          >
                            {isGeneratingSummary === session.id ? (
                              <Spinner size="small" />
                            ) : (
                              <Bot className="h-4 w-4 ml-2" />
                            )}
                            עדכן תקציר
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            title="מחק שיחה"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            מחק שיחה
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="shadow-md dark:bg-gray-800">
            <CardContent className="p-12 text-center">
              <History className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">עדיין לא ניהלת שיחות</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">התחל שיחה חדשה עם עיל"ם כדי לקבל עזרה במצבי חירום</p>
              <Link href="/chat">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:text-black">
                  <MessageSquare className="ml-2 h-4 w-4" />
                  התחל שיחה חדשה
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את השיחה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תסיר את השיחה ואת כל ההודעות שבה. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              onClick={() => {
                setSessionToDelete(null)
                setIsOpen(false)
              }}
            >
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-black"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// קומפוננט נפרד להצגת תקציר
function SummaryDisplay({ session, supabase }: { session: ChatSession; supabase: any }) {
  const [displaySummary, setDisplaySummary] = useState<string>("")

  useEffect(() => {
    const loadSummary = async () => {
      if (session.ai_summary) {
        setDisplaySummary(session.ai_summary)
        return
      }

      // יצירת fallback summary
      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })

      if (!messagesData || messagesData.length === 0) {
        setDisplaySummary("שיחה ללא הודעות")
        return
      }

      const userMessages = messagesData.filter((m: any) => m.role === "user")
      if (userMessages.length === 0) {
        setDisplaySummary("שיחה ללא שאלות")
        return
      }

      const firstUserMessage = userMessages[userMessages.length - 1]?.content || ""
      const fallbackSummary =
        firstUserMessage.length > 100 ? firstUserMessage.substring(0, 100) + "..." : firstUserMessage
      setDisplaySummary(fallbackSummary)
    }

    loadSummary()
  }, [session, supabase])

  return <p className="text-gray-600 dark:text-gray-300 flex-1">{displaySummary}</p>
}
