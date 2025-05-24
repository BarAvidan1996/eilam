"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage, type ChatMessageProps } from "@/components/chat-message"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"

const initialMessages: ChatMessageProps[] = [
  {
    id: "1",
    text: 'שלום! אני עיל"ם, עוזר החירום האישי שלך. איך אני יכול לעזור היום?',
    sender: "bot",
  },
]

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessageProps[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // טעינת משתמש וסשן
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          console.log("User loaded:", session.user.id)

          // בדיקה אם יש session ID בפרמטרים
          const sessionParam = searchParams.get("session")
          if (sessionParam) {
            setSessionId(sessionParam)
            await loadChatHistory(sessionParam)
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      }
    }
    loadUserAndSession()
  }, [searchParams])

  // טעינת היסטוריית צ'אט
  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        const chatMessages = data.map((msg, index) => ({
          id: msg.id || index.toString(),
          text: msg.content,
          sender: msg.role === "user" ? "user" : "bot",
        }))
        setMessages(chatMessages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isTyping) return

    const userMessage: ChatMessageProps = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMessage])
    const currentQuestion = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      console.log("Sending message:", currentQuestion)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
          sessionId: sessionId,
          userId: user?.id,
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      // עדכון session ID אם זה סשן חדש
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const botMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        text: data.answer || "מצטער, לא הצלחתי לייצר תשובה.",
        sender: "bot",
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        text: "מצטער, אירעה שגיאה. אנא נסה שוב.",
        sender: "bot",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <h1 className="text-xl font-semibold">צ'אט חירום - עיל"ם</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">עוזר החירום האישי שלך</p>
      </div>

      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message) => (
          <ChatMessage key={message.id} id={message.id} text={message.text} sender={message.sender} />
        ))}

        {isTyping && (
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
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

      <div className="p-4 bg-white dark:bg-gray-800 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="כתוב הודעה..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || inputValue.trim() === ""}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
