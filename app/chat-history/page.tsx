"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, History, MessageSquare, Plus, Save, X } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/spinner"

interface ChatSession {
  id: string
  created_at: string
  title: string | null
  summary: string | null
  message_count: number
}

export default function ChatHistoryPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchChatSessions()
  }, [])

  const fetchChatSessions = async () => {
    try {
      const response = await fetch("/api/chat/history")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setChatSessions(data)
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error)
      toast({
        variant: "destructive",
        title: "אירעה שגיאה",
        description: "לא ניתן לטעון את היסטוריית הצ'אט. אנא נסה שוב מאוחר יותר.",
      })
    }
  }

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id)
    setEditingTitle(session.title || "")
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const saveTitle = async () => {
    try {
      const response = await fetch(`/api/chat/history/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editingTitle }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Optimistically update the UI
      setChatSessions(
        chatSessions.map((session) => (session.id === editingId ? { ...session, title: editingTitle } : session)),
      )

      setEditingId(null)
      setEditingTitle("")

      toast({
        title: "הכותרת עודכנה בהצלחה!",
      })
    } catch (error) {
      console.error("Failed to update title:", error)
      toast({
        variant: "destructive",
        title: "אירעה שגיאה",
        description: "לא ניתן לעדכן את הכותרת. אנא נסה שוב מאוחר יותר.",
      })
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Optimistically update the UI
      setChatSessions(chatSessions.filter((session) => session.id !== sessionId))

      toast({
        title: "השיחה נמחקה בהצלחה!",
      })
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast({
        variant: "destructive",
        title: "אירעה שגיאה",
        description: "לא ניתן למחוק את השיחה. אנא נסה שוב מאוחר יותר.",
      })
    }
  }

  const generateAISummary = async (sessionId: string) => {
    setIsGeneratingSummary(sessionId)
    try {
      const response = await fetch(`/api/chat/history/${sessionId}/summary`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const summary = data.summary

      // Optimistically update the UI
      setChatSessions(
        chatSessions.map((session) => (session.id === sessionId ? { ...session, summary: summary } : session)),
      )

      toast({
        title: "תקציר AI נוצר בהצלחה!",
      })
    } catch (error) {
      console.error("Failed to generate AI summary:", error)
      toast({
        variant: "destructive",
        title: "אירעה שגיאה",
        description: "לא ניתן ליצור תקציר AI. אנא נסה שוב מאוחר יותר.",
      })
    } finally {
      setIsGeneratingSummary(null)
    }
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History className="h-8 w-8" />
            היסטוריית שיחות צ'אט
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            נהל את השיחות שלך עם עיל"ם ({chatSessions.length} שיחות)
          </p>
        </div>

        <Link href="/chat">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:text-black">
            <Plus className="h-4 w-4 ml-2" />
            שיחה חדשה
          </Button>
        </Link>
      </div>

      {/* Chat Sessions List */}
      <div className="grid gap-4">
        {chatSessions.map((session) => (
          <Card key={session.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Action buttons - vertical layout on the left */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link href={`/chat?session=${session.id}`}>
                    <Button
                      size="sm"
                      className="w-full bg-[#005C72] hover:bg-[#004A5C] text-white dark:bg-[#D3E3FD] dark:hover:bg-[#C1D7FB] dark:text-black"
                    >
                      פתח שיחה
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(session)}
                    title="ערוך שם"
                    className="w-full"
                  >
                    ערוך כותרת
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateAISummary(session.id)}
                    disabled={isGeneratingSummary === session.id}
                    title="צור תקציר AI"
                    className="w-full"
                  >
                    {isGeneratingSummary === session.id ? <Spinner size="small" /> : "צור תקציר"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    title="מחק שיחה"
                  >
                    מחק שיחה
                  </Button>
                </div>

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
                      <Button size="sm" onClick={saveTitle}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-400 mb-3">
                      {session.title || `שיחה מ-${format(new Date(session.created_at), "d/M/yyyy", { locale: he })}`}
                    </h2>
                  )}

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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
