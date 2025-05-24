"use client"

import { useState, useEffect, useRef } from "react"
import { Send, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"

// Prevent static rendering during build
export const dynamic = "force-dynamic"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp?: string
}

const baseTranslations = {
  he: {
    pageTitle: "צ'אט חירום",
    pageDescription: "שאל כל שאלה בנושא היערכות ומצבי חירום",
    initialBotMessage: 'שלום! אני עיל"ם, עוזר החירום האישי שלך. איך אני יכול לעזור היום?',
    inputPlaceholder: "הקלד את שאלתך כאן...",
    loading: "טוען...",
  },
  en: {
    pageTitle: "Emergency Chat",
    pageDescription: "Ask any question about preparedness and emergency situations",
    initialBotMessage: "Hello! I'm EILAM, your personal emergency assistant. How can I help you today?",
    inputPlaceholder: "Type your question here...",
    loading: "Loading...",
  },
}

export default function ChatPage() {
  const [currentLanguage, setCurrentLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lang = document.documentElement.lang || "he"
      setCurrentLanguage(lang)
    }
  }, [])

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      const selectedTranslations = baseTranslations[currentLanguage] || baseTranslations.he
      setTranslations(selectedTranslations)
      setMessages([
        {
          id: "1",
          text: selectedTranslations.initialBotMessage,
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
    }
    loadTranslations()
  }, [currentLanguage])

  // טעינת משתמש וסשן
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
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
      } catch (error) {
        console.error("Error loading user session:", error)
      }
    }
    loadUserAndSession()
  }, [searchParams])

  // גלילה לתחתית כשמתווספות הודעות
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // טעינת היסטוריית צ'אט
  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        const chatMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role === "user" ? "user" : "bot",
          timestamp: msg.created_at,
        }))
        setMessages(chatMessages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // עדכון session ID אם זה סשן חדש
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: "bot",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "מצטער, אירעה שגיאה. אנא נסה שוב.",
        sender: "bot",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{translations.loading}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <header className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{translations.pageTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-200">{translations.pageDescription}</p>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "bot" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
                    alt="Bot Avatar"
                  />
                  <AvatarFallback>
                    <Bot />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-xl ${
                  message.sender === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{message.text}</p>
                {message.timestamp && (
                  <div className="mt-1 text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
              {message.sender === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
                  alt="Bot Avatar"
                />
                <AvatarFallback>
                  <Bot />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white p-3 rounded-xl rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={translations.inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isTyping}
            className="flex-1 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping}
            className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-black disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
