"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp?: string
}

interface UseChatProps {
  sessionId?: string
  userId?: string
}

export function useChat({ sessionId, userId }: UseChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)

  const supabase = createClientComponentClient()

  // טעינת היסטוריית צ'אט
  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        const chatMessages: ChatMessage[] = data.map((msg) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role as "user" | "bot",
          timestamp: msg.created_at,
        }))
        setMessages(chatMessages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  // שליחת הודעה
  const sendMessage = async (message: string): Promise<void> => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          sessionId: currentSessionId,
          userId: userId,
          method: "stepback",
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // עדכון session ID אם זה סשן חדש
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId)
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: "bot",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "מצטער, אירעה שגיאה. אנא נסה שוב.",
        sender: "bot",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // יצירת סשן חדש
  const createNewSession = async (title?: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      })

      const data = await response.json()

      if (data.sessionId) {
        setCurrentSessionId(data.sessionId)
        setMessages([]) // איפוס הודעות לסשן חדש
        return data.sessionId
      }

      return null
    } catch (error) {
      console.error("Error creating new session:", error)
      return null
    }
  }

  // טעינת סשן קיים
  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId)
      loadChatHistory(sessionId)
    }
  }, [sessionId])

  return {
    messages,
    isLoading,
    sessionId: currentSessionId,
    sendMessage,
    createNewSession,
    loadChatHistory,
  }
}
