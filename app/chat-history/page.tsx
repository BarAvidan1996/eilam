"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, MessageSquare, Save, X, Plus, Calendar, Eye, Edit2, Bot, Trash2 } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const dynamic = "force-dynamic"

interface ChatSession {
  id: string
  title: string
  created_at: string
  summary?: string
  message_count?: number
  last_message_at?: string
}

export default function ChatHistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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
        .select("*")
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

          // יצירת תקציר מההודעה הראשונה של המשתמש
          let summary = "שיחה ללא הודעות"
          if (messagesData && messagesData.length > 0) {
            const userMessages = messagesData.filter((m) => m.role === "user")
            if (userMessages.length > 0) {
              const firstUserMessage = userMessages[userMessages.length - 1]?.content || ""
              summary = firstUserMessage.length > 100 ? firstUserMessage.substring(0, 100) + "..." : firstUserMessage
            }
          }

          return {
            ...session,
            message_count: messageCount,
            last_message_at: lastMessageAt,
            summary,
          }
        }),
      )

      console.log("✅ שיחות מעובדות:", enrichedSessions.length)
      setChatSessions(enrichedSessions)

      // יצירת תקציר AI לשיחות ללא כותרת
      for (const session of enrichedSessions) {
        if (!session.title || session.title === "" || session.title === "שיחה חדשה") {
          console.log("🤖 יוצר תקציר AI לשיחה:", session.id)
          await generateAISummary(session.id)
        }
      }
    } catch (error) {
      console.error("❌ שגיאה כללית בטעינת שיחות:", error)
      setChatSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // יצירת תקציר AI
  const generateAISummary = async (sessionId: string) => {
    setIsGeneratingSummary(sessionId)

    try {
      console.log("🤖 מתחיל יצירת תקציר לשיחה:", sessionId)

      // קבלת הודעות השיחה
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("❌ שגיאה בקבלת הודעות:", error)
        return
      }

      if (!messages || messages.length === 0) {
        console.log("❌ אין הודעות לשיחה")
        return
      }

      console.log("📨 נמצאו הודעות:", messages.length)

      // שליחה ל-API לתקציר
      const response = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        console.error("❌ שגיאה בקריאה ל-API:", response.status)
        return
      }

      const { summary } = await response.json()
      console.log("✅ תקציר נוצר:", summary)

      // עדכון התקציר בטבלה
      const { error: updateError } = await supabase.from("chat_sessions").update({ title: summary }).eq("id", sessionId)

      if (updateError) {
        console.error("❌ שגיאה בעדכון תקציר:", updateError)
        return
      }

      // עדכון המצב המקומי
      setChatSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, title: summary } : session)),
      )

      console.log("✅ תקציר עודכן בהצלחה")
    } catch (error) {
      console.error("❌ שגיאה ביצירת תקציר:", error)
    } finally {
      setIsGeneratingSummary(null)
    }
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
          </p>
        </div>

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
            {chatSessions.map((session) => (
              <Card key={session.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
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
                        <h2 className="text-xl font-semibold text-[#005C72] dark:text-[#D3E3FD] mb-3">
                          {session.title ||
                            `שיחה מ-${format(new Date(session.created_at), "d/M/yyyy", { locale: he })}`}
                        </h2>

                      <p className="text-gray-600 dark:text-gray-300 mb-4">{session.summary}</p>

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
                    <div className=\"flex flex-col gap-2 flex-shrink-0 justify-center">
                      {/* Top row */}
                      <div className="flex gap-2">
                        <Link href={`/chat?session=${session.id}`}  className="flex-1">
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
                          onClick={() => generateAISummary(session.id)}
                          disabled={isGeneratingSummary === session.id}
                          title="צור תקציר AI"
                          className="flex-1"
                        >
                          {isGeneratingSummary === session.id ? (
                            <Spinner size="small" />
                          ) : (
                            <Bot className="h-4 w-4 ml-2" />
                          )}
                          צור תקציר
                        </Button>

                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSessionToDelete(session.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            מחק שיחה
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      <AlertDialog
  open = { isOpen }
  onOpenChange =
    { setIsOpen } >
    (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את השיחה?</AlertDialogTitle>
          <AlertDialogDescription>פעולה זו תסיר את השיחה ולא ניתן יהיה לשחזר אותה.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSessionToDelete(null)}>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteSession}>מחק</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    )
  </AlertDialog>
    </div>
  )
}
