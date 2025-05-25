"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp?: Date
  sources?: Array<{
    title: string
    file_name: string
    similarity: number
  }>
  isStreaming?: boolean
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: 'שלום! אני עיל"ם, עוזר החירום האישי שלך. איך אני יכול לעזור היום?',
    sender: "bot",
    timestamp: new Date(),
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

        const chatMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role === "user" ? "user" : "bot",
          timestamp: new Date(msg.created_at),
          sources: msg.sources || [],
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

  const handleSendMessage = async () => {
    console.log("🎯 handleSendMessage - התחלה")

    if (inputValue.trim() === "" || isTyping || isInitializing || !sessionId) {
      console.log("❌ יציאה מוקדמת")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentQuestion = inputValue.trim()

    setInputValue("")
    setIsTyping(true)

    // יצירת הודעת בוט ריקה לstreaming
    const botMessageId = (Date.now() + 1).toString()
    const initialBotMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, initialBotMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentQuestion,
          sessionId: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.type === "chunk") {
              accumulatedText += data.content

              // עדכון ההודעה עם הטקסט המצטבר
              setMessages((prev) =>
                prev.map((msg) => (msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg)),
              )
            } else if (data.type === "final") {
              // עדכון סופי עם מקורות
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        text: data.answer,
                        sources: data.sources,
                        isStreaming: false,
                      }
                    : msg,
                ),
              )
            } else if (data.type === "error") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        text: `מצטער, אירעה שגיאה: ${data.error}`,
                        isStreaming: false,
                      }
                    : msg,
                ),
              )
            }
          } catch (parseError) {
            console.error("שגיאה בפרסור JSON:", parseError)
          }
        }
      }
    } catch (error) {
      console.error("💥 שגיאה בשליחת הודעה:", error)

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: `מצטער, אירעה שגיאה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`,
                isStreaming: false,
              }
            : msg,
        ),
      )
    } finally {
      setIsTyping(false)
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
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "bot" && (
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

              <div className={`max-w-[75%] ${message.sender === "user" ? "order-2" : ""}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
                    )}
                  </p>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium mb-1">מקורות:</p>
                    <ul className="space-y-1">
                      {message.sources.map((source, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{source.title}</span>
                          <span className="text-gray-400">({Math.round(source.similarity * 100)}% התאמה)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.timestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 mt-1 order-3">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
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
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="כתוב את שאלתך כאן..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isTyping || isInitializing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || inputValue.trim() === "" || isInitializing || !sessionId}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          עיל"ם מבוסס על מידע רשמי של פיקוד העורף • גרסה ניסיונית
        </p>
      </div>
    </div>
  )
}
