"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, MessageSquare, Save, X, Plus, Calendar, Edit2, Bot } from "lucide-react"
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
      }
    } finally {
      setEditingId(null)
      setEditingTitle("")
    }
  }

  // מחיקת שיחה
  const handleDeleteSession = async (sessionId: string) => {
    setIsOpen(true)
    setSessionToDelete(sessionId)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      console.log("🗑️ מוחק שיחה:", sessionToDelete)

      // מחיקת השיחה מהדטאבייס
      const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionToDelete)

      if (error) {
        console.error("❌ שגיאה במחיקת שיחה:", error)
        return
      }

      // עדכון המצב המקומי
      setChatSessions((prev) => prev.filter((session) => session.id !== sessionToDelete))

      console.log("✅ שיחה נמחקה")
    } catch (error) {
      console.error("❌ שגיאה במחיקת שיחה:", error)
    } finally {
      setSessionToDelete(null)
      setIsOpen(false)
    }
  }

  const cancelDeleteSession = () => {
    setSessionToDelete(null)
    setIsOpen(false)
  }

  useEffect(() => {
    fetchChatSessions()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">היסטוריית שיחות</h1>
        <Link href="/chat">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            שיחה חדשה
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : chatSessions.length === 0 ? (
        <Card className="w-full">
          <CardContent className="py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <History className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500">אין היסטוריית שיחות</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chatSessions.map((session) => (
            <Card key={session.id} className="w-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  {editingId === session.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full"
                      />
                      <Button size="icon" onClick={saveTitle} disabled={!editingTitle.trim()}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <h2 className="text-lg font-semibold truncate">{session.title}</h2>
                      <p className="text-sm text-gray-500 truncate">{session.summary}</p>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Link href={`/chat?session_id=${session.id}`}>
                      <Button size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    {editingId !== session.id && (
                      <Button size="icon" onClick={() => startEditing(session)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את השיחה?</AlertDialogTitle>
                          <AlertDialogDescription>
                            פעולה זו תסיר את השיחה ולא ניתן יהיה לשחזר אותה.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSessionToDelete(null)}>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDeleteSession}>מחק</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(session.created_at), "dd/MM/yyyy HH:mm", { locale: he })}</span>
                  <Bot className="h-4 w-4" />
                  <span>{session.message_count} הודעות</span>
                </div>
                {isGeneratingSummary === session.id && (
                  <div className="flex justify-center mt-2">
                    <Spinner size="sm" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
