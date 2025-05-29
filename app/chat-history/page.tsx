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
} from "@/components/ui/alert-dialog"

export const dynamic = "force-dynamic"

interface ChatSession {
  id: string
  title: string
  created_at: string
  ai_summary?: string
  message_count?: number
  last_message_at?: string
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
            // לא שומרים summary במצב המקומי - נייצר אותו בזמן ההצגה
          }
        }),
      )

      console.log("✅ שיחות מעובדות:", enrichedSessions.length)

      // סינון שיחות שיש בהן לפחות הודעה אחת
      const filteredSessions = enrichedSessions.filter((session) => session.message_count > 0)
      console.log("🔍 שיחות עם הודעות:", filteredSessions.length)

      setChatSessions(filteredSessions)

      // הסר את הקטע הזה מתוך fetchChatSessions:
      // יצירת תקציר AI לשיחות ללא תקציר ועם לפחות 2 הודעות
      // for (const session of filteredSessions) {
      //   if (!session.ai_summary && session.message_count >= 2) {
      //     console.log("🤖 יוצר תקציר AI לשיחה:", session.id)
      //     await generateAISummary(session.id)
      //   }

      //   // יצירת כותרת לשיחות ללא כותרת
      //   if ((!session.title || session.title === "" || session.title === "שיחה חדשה") && session.message_count >= 2) {
      //     console.log("🏷️ יוצר כותרת AI לשיחה:", session.id)
      //     await generateAITitle(session.id)
      //   }
      // }
    } catch (error) {
      console.error("❌ שגיאה כללית בטעינת שיחות:", error)
      setChatSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  // טעינה אסינכרונית של כותרות ותקצירים ברקע
  const generateMissingTitlesAndSummaries = async () => {
    try {
      console.log("🔄 מתחיל יצירת כותרות ותקצירים ברקע...")

      const sessionsNeedingWork = chatSessions.filter(
        (session) =>
          session.message_count >= 2 &&
          (!session.ai_summary || !session.title || session.title === "" || session.title === "שיחה חדשה"),
      )

      console.log(`📝 נמצאו ${sessionsNeedingWork.length} שיחות שצריכות עבודה`)

      // עבוד על שיחה אחת בכל פעם כדי לא להעמיס על השרת
      for (const session of sessionsNeedingWork) {
        // יצירת כותרת אם חסרה
        if (!session.title || session.title === "" || session.title === "שיחה חדשה") {
          console.log("🏷️ יוצר כותרת ברקע לשיחה:", session.id)
          await generateAITitle(session.id)
          // המתן קצת בין בקשות
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // יצירת תקציר אם חסר
        if (!session.ai_summary) {
          console.log("🤖 יוצר תקציר ברקע לשיחה:", session.id)
          await generateAISummary(session.id)
          // המתן קצת בין בקשות
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      console.log("✅ סיום יצירת כותרות ותקצירים ברקע")
    } catch (error) {
      console.error("❌ שגיאה ביצירת כותרות/תקצירים ברקע:", error)
    }
  }

  // יצירת כותרת AI
  const generateAITitle = async (sessionId: string) => {
    setIsGeneratingTitle(sessionId)

    try {
      console.log("🏷️ מתחיל יצירת כותרת לשיחה:", sessionId)

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

      // שליחה ל-API לכותרת
      const response = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        console.error("❌ שגיאה בקריאה ל-API:", response.status)
        return
      }

      const { title } = await response.json()
      console.log("✅ כותרת נוצרה:", title)

      // עדכון הכותרת בטבלה
      const { error: updateError } = await supabase.from("chat_sessions").update({ title: title }).eq("id", sessionId)

      if (updateError) {
        console.error("❌ שגיאה בעדכון כותרת:", updateError)
        return
      }

      // עדכון המצב המקומי
      setChatSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, title: title } : session)),
      )

      console.log("✅ כותרת עודכנה בהצלחה")
    } catch (error) {
      console.error("❌ שגיאה ביצירת כותרת:", error)
    } finally {
      setIsGeneratingTitle(null)
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
      const { error: updateError } = await supabase
        .from("chat_sessions")
        .update({ ai_summary: summary })
        .eq("id", sessionId)

      if (updateError) {
        console.error("❌ שגיאה בעדכון תקציר:", updateError)
        return
      }

      // עדכון המצב המקומי
      setChatSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, ai_summary: summary } : session)),
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

  // פונקציה לקבלת תקציר להצגה
  const getDisplaySummary = async (session: ChatSession) => {
    if (session.ai_summary) {
      return session.ai_summary
    }

    // יצירת fallback summary
    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })

    return createFallbackSummary(messagesData || [])
  }

  // useEffect נפרד ליצירת כותרות ותקצירים ברקע
  useEffect(() => {
    if (!isLoading && chatSessions.length > 0) {
      // המתן קצת אחרי הטעינה הראשונית ואז התחל לעבוד ברקע
      const timer = setTimeout(() => {
        generateMissingTitlesAndSummaries()
      }, 2000) // המתן 2 שניות

      return () => clearTimeout(timer)
    }
  }, [isLoading, chatSessions.length])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center sm:text-right mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <History className="h-6 w-6 sm:h-8 sm:w-8" />
            היסטוריית שיחות צ'אט
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
            נהל את השיחות שלך עם עיל"ם ({chatSessions.length} שיחות)
          </p>
        </div>

        {/* New Chat Button */}
        <div className="flex justify-center sm:justify-start mb-4">
          <Link href="/chat" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white dark:text-black">
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Chat content */}
                    <div className="flex-1">
                      {editingId === session.id ? (
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="text-base sm:text-lg font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitle()
                              if (e.key === "Escape") cancelEditing()
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveTitle}
                              className="flex-1 sm:flex-none bg-[#005C72] hover:bg-[#004A5C] text-white dark:bg-[#D3E3FD] dark:hover:bg-[#C1D7FB] dark:text-black"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing} className="flex-1 sm:flex-none">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <h2 className="text-lg sm:text-xl font-semibold text-[#005C72] dark:text-[#D3E3FD] mb-3">
                          {session.title ||
                            `שיחה מ-${format(new Date(session.created_at), "d/M/yyyy", { locale: he })}`}
                        </h2>
                      )}

                      <SummaryDisplay session={session} supabase={supabase} />

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {format(new Date(session.created_at), "d MMMM, yyyy HH:mm", { locale: he })}
                        </span>

                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                          {session.message_count} הודעות
                        </span>
                      </div>
                    </div>

                    {/* Action buttons - responsive layout */}
                    <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-shrink-0 sm:justify-center">
                      {/* Mobile: single column, Desktop: 2x2 grid */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link href={`/chat?session=${session.id}`} className="w-full sm:flex-1">
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
                          className="w-full sm:flex-1"
                        >
                          <Edit2 className="h-4 w-4 ml-2" />
                          ערוך כותרת
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAISummary(session.id)}
                          disabled={isGeneratingSummary === session.id}
                          title="צור תקציר AI"
                          className="w-full sm:flex-1"
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
                          className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white"
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
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח שברצונך למחוק את השיחה?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תסיר את השיחה ואת כל ההודעות שבה. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <AlertDialogCancel
              onClick={() => {
                setSessionToDelete(null)
                setIsOpen(false)
              }}
              className="w-full sm:w-auto"
            >
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-black"
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

  return <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">{displaySummary}</p>
}
