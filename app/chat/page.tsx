"use client"

import type React from "react"

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
    text: "שלום! אני כאן כדי לעזור לך.",
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
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  // טעינת משתמש וסשן
  useEffect(() => {
    const loadUserAndSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)

        // בדיקה אם יש session ID בפרמטרים
        const sessionParam = searchParams.get("session")
        if (sessionParam) {
          setSessionId(sessionParam)
          await loadChatHistory(sessionParam)
        }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isTyping) return

    const userMessage = { id: Date.now().toString(), text: inputValue, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: inputValue,
          sessionId: sessionId,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // עדכון session ID אם זה סשן חדש
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = {
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
    <div className="flex flex-col h-screen">
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} text={message.text} sender={message.sender} />
        ))}
      </div>
      <div className="p-4 bg-gray-100 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="כתוב הודעה..."
            value={inputValue}
            onChange={handleInputChange}
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
