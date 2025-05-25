"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, MessageSquare, Edit2, Trash2, Save, X, Plus, Calendar, Bot } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Spinner } from "@/components/ui/spinner"

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
  const supabase = createClientComponentClient()

  // טעינת שיחות
  const fetchChatSessions = async () => {
    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setChatSessions([])
        setIsLoading(false)
        return
      }

      console.log("🔍 טוען שיחות עבור משתמש:", session.user.id)

      // טעינת שיחות עם מידע נוסף
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (sessionsError) {
        console.error("❌ שגיאה בטעינת שיחות:", sessionsError)
        setChatSessions([])
        setIsLoading(false)
        return
      }

      console.log("📋 נמצאו שיחות:", sessionsData?.length || 0)

      if (!sessionsData || sessionsData.length === 0) {
        setChatSessions([])
        setIsLoading(false)
        return
      }

      // הוספת מידע נוסף לכל שיחה
      const enrichedSessions = await Promise.all(
        sessionsData.map(async (session) => {
          // ספירת הודעות ותאריך הודעה אחרונה
          const { data: messagesData } = await supabase
            .from("chat_messages")
            .select("created_at, role, content")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })

          const messageCount = messagesData?.length || 0
          const lastMessageAt = messagesData?.[0]?.created_at || session.created_at

          // יצירת תקציר מההודעות
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

      setChatSessions(enrichedSessions)
    } catch (error) {
      console.error("❌ שגיאה כללית:", error)
      setChatSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // יצירת תקציר AI
  const generateAISummary = async (sessionId: string) => {
    setIsGeneratingSummary(sessionId)

    try {
      // קבלת הודעות השיחה
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (!messages || messages.length === 0) {
        return
      }

      // יצירת תקציר עם OpenAI
      const response = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      if (response.ok) {
        const { summary } = await response.json()

        // עדכון התקציר בטבלה
        await supabase.from("chat_sessions").update({ title: summary }).eq("id", sessionId)

        // עדכון המצב המקומי
        setChatSessions((prev) =>
          prev.map((session) => (session.id === sessionId ? { ...session, title: summary } : session)),
        )
      }
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
      const { error } = await supabase.from("chat_sessions").update({ title: editingTitle.trim() }).eq("id", editingId)

      if (!error) {
        setChatSessions((prev) =>
          prev.map((session) => (session.id === editingId ? { ...session, title: editingTitle.trim() } : session)),
        )
      }
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
    if (!confirm("האם אתה בטוח שברצונך למחוק את השיחה?")) return

    try {
      // מחיקת הודעות
      await supabase.from("chat_messages").delete().eq("session_id", sessionId)

      // מחיקת השיחה
      const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId)

      if (!error) {
        setChatSessions((prev) => prev.filter((session) => session.id !== sessionId))
      }
    } catch (error) {
      console.error("❌ שגיאה במחיקת שיחה:", error)
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
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History className="h-8 w-8" />
            היסטוריית שיחות צ'אט
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">נהל את השיחות שלך עם עיל"ם</p>
        </div>

        <Link href="/chat">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            שיחה חדשה
          </Button>
        </Link>
      </div>

      {/* Sessions List */}
      {chatSessions.length > 0 ? (
        <div className="grid gap-4">
          {chatSessions.map((session) => (
            <Card key={session.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingId === session.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="text-lg font-semibold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitle()
                            if (e.key === "Escape") cancelEditing()
                          }}
                        />
                        <Button size="sm" onClick={saveTitle}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-xl text-purple-700 dark:text-purple-400">
                        {session.title || `שיחה מ-${format(new Date(session.created_at), "d/M/yyyy", { locale: he })}`}
                      </CardTitle>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAISummary(session.id)}
                      disabled={isGeneratingSummary === session.id}
                    >
                      {isGeneratingSummary === session.id ? <Spinner size="small" /> : <Bot className="h-4 w-4" />}
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => startEditing(session)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300">{session.summary}</p>

                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.created_at), "d MMMM, yyyy HH:mm", { locale: he })}
                      </span>

                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {session.message_count} הודעות
                      </span>
                    </div>

                    <Link href={`/chat?session=${session.id}`}>
                      <Button variant="outline" size="sm">
                        פתח שיחה
                      </Button>
                    </Link>
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
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <MessageSquare className="mr-2 h-4 w-4" />
                התחל שיחה חדשה
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
