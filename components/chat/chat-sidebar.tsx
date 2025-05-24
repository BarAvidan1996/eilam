"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Calendar } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import Link from "next/link"

interface ChatSession {
  id: string
  title: string
  created_at: string
}

interface ChatSidebarProps {
  currentSessionId?: string
  onNewChat: () => void
}

export function ChatSidebar({ currentSessionId, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/chat/sessions")
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM, yyyy", { locale: he })
    } catch {
      return dateString
    }
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button onClick={onNewChat} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          שיחה חדשה
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">טוען...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">אין שיחות קודמות</div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/chat?session=${session.id}`}
                className={`block p-3 rounded-lg border transition-colors ${
                  currentSessionId === session.id
                    ? "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-1 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{session.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(session.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
