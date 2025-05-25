"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"
import { useChat } from "ai/react"

const initialMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content: 'שלום! אני עיל"ם, עוזר החירום האישי שלך. איך אני יכול לעזור היום?',
  },
]

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [ragSources, setRagSources] = useState<
    Array<{
      title: string
      file_name: string
      similarity: number
    }>
  >([])

  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Vercel AI SDK useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: {
      sessionId,
    },
    onResponse: (response) => {
      // קריאת metadata מהresponse headers
      const sources = response.headers.get("X-RAG-Sources")
      const fallback = response.headers.get("X-RAG-Fallback")

      if (sources) {
        try {
          setRagSources(JSON.parse(sources))
        } catch (e) {
          console.error("שגיאה בפרסור מקורות:", e)
        }
      }

      console.log("📊 RAG Fallback:", fallback === "true")
    },
    onError: (error) => {
      console.error("💥 שגיאה בצ'אט:", error)
    },
    initialMessages,
  })

  // גלילה אוטומטית למטה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // יצירת session ID חדש
  const createNewSession = async (): Promise<string> => {
    try {
      console.log("🆕 יוצר session חדש...")

      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Session נוצר:", data.sessionId)

      return data.sessionId
    } catch (error) {
      console.error("❌ שגיאה ביצירת session:", error)
      // fallback - יצירת UUID פשוט
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // טעינת משתמש וסשן
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        console.log("🚀 מתחיל טעינת משתמש וסשן...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          console.log("👤 User loaded:", session.user.id)
        }

        // בדיקה אם יש session ID בפרמטרים
        const sessionParam = searchParams.get("session")
        if (sessionParam) {
          console.log("🔗 נמצא session בURL:", sessionParam)
          setSessionId(sessionParam)
          await loadChatHistory(sessionParam)
        } else {
          // אין session בURL - ניצור חדש
          console.log("🆕 אין session בURL, יוצר חדש...")
          const newSessionId = await createNewSession()
          setSessionId(newSessionId)

          // עדכון URL עם session ID החדש
          const url = new URL(window.location.href)
          url.searchParams.set("session", newSessionId)
          window.history.replaceState({}, "", url.toString())
          console.log("🔗 URL עודכן עם session חדש")
        }
      } catch (error) {
        console.error("❌ שגיאה בטעינת משתמש/סשן:", error)
        // fallback - יצירת session פשוט
        const fallbackSessionId = `fallback_${Date.now()}`
        setSessionId(fallbackSessionId)
      } finally {
        setIsInitializing(false)
        console.log("✅ אתחול הושלם")
      }
    }

    loadUserAndSession()
  }, [searchParams])

  // טעינת היסטוריית צ'אט
  const loadChatHistory = async (sessionId: string) => {
    try {
      console.log("📚 טוען היסטוריה עבור session:", sessionId)

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (!error && data && data.length > 0) {
        console.log(`📜 נמצאו ${data.length} הודעות בהיסטוריה`)

        const chatMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        }))

        // החלפת ההודעות הראשוניות בהיסטוריה
        setMessages(chatMessages)
      } else {
        console.log("📭 אין הודעות בהיסטוריה, משאיר הודעות ראשוניות")
      }
    } catch (error) {
      console.error("❌ שגיאה בטעינת היסטוריה:", error)
    }
  }

  // הצגת מסך טעינה בזמן אתחול
  if (isInitializing) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
          <h1 className="text-xl font-semibold">צ'אט חירום - עיל"ם</h1>
          <p className="text-sm opacity-90">עוזר החירום האישי שלך מבוסס על מידע פיקוד העורף</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">מכין את הצ'אט...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <h1 className="text-xl font-semibold">צ'אט חירום - עיל"ם</h1>
        <p className="text-sm opacity-90">עוזר החירום האישי שלך מבוסס על מידע פיקוד העורף</p>
        {sessionId && <p className="text-xs opacity-70 mt-1">Session: {sessionId.substring(0, 8)}...</p>}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
                    alt="Bot Avatar"
                  />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[75%] ${message.role === "user" ? "order-2" : ""}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>

                {/* Sources - מציג רק להודעה האחרונה של הבוט */}
                {message.role === "assistant" && index === messages.length - 1 && ragSources.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium mb-1">מקורות:</p>
                    <ul className="space-y-1">
                      {ragSources.map((source, sourceIndex) => (
                        <li key={sourceIndex} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{source.title}</span>
                          <span className="text-gray-400">({source.similarity}% התאמה)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1 order-3">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="כתוב את שאלתך כאן..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading || isInitializing || !sessionId}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || input.trim() === "" || isInitializing || !sessionId}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          עיל"ם מבוסס על מידע רשמי של פיקוד העורף • גרסה ניסיונית
        </p>
      </div>
    </div>
  )
}
