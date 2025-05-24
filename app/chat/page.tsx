"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User, Bot } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"

// Prevent static rendering during build
export const dynamic = "force-dynamic"

const baseTranslations = {
  he: {
    pageTitle: "צ'אט חירום",
    pageDescription: "שאל כל שאלה בנושא היערכות ומצבי חירום",
    initialBotMessage: 'שלום! אני עיל"ם, עוזר החירום האישי שלך. איך אני יכול לעזור היום?',
    botResponsePrefix: "מעבד את השאלה...",
    inputPlaceholder: "הקלד את שאלתך כאן...",
    loading: "טוען...",
  },
  en: {
    pageTitle: "Emergency Chat",
    pageDescription: "Ask any question about preparedness and emergency situations",
    initialBotMessage: "Hello! I'm EILAM, your personal emergency assistant. How can I help you today?",
    botResponsePrefix: "Processing your question...",
    inputPlaceholder: "Type your question here...",
    loading: "Loading...",
  },
  ar: {
    pageTitle: "دردشة الطوارئ",
    pageDescription: "اطرح أي سؤال حول التأهب وحالات الطوارئ",
    initialBotMessage: "مرحباً! أنا إيلام، مساعدك الشخصي للطوارئ. كيف يمكنني مساعدتك اليوم؟",
    botResponsePrefix: "معالجة سؤالك...",
    inputPlaceholder: "اكتب سؤالك هنا...",
    loading: "جار التحميل...",
  },
  ru: {
    pageTitle: "Экстренный чат",
    pageDescription: "Задайте любой вопрос о готовности и чрезвычайным ситуациям",
    initialBotMessage: "Привет! Я ЭЙЛАМ, ваш личный помощник по чрезвычайным ситуациям. Чем я могу помочь сегодня?",
    botResponsePrefix: "Обрабатываю ваш вопрос...",
    inputPlaceholder: "Введите свой вопрос здесь...",
    loading: "Загрузка...",
  },
}

export default function ChatPage() {
  const [currentLanguage, setCurrentLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: string }>>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lang = document.documentElement.lang || "he"
      setCurrentLanguage(lang)
    }
  }, [])

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      if (baseTranslations[currentLanguage]) {
        setTranslations(baseTranslations[currentLanguage])
        setMessages([{ id: "1", text: baseTranslations[currentLanguage].initialBotMessage, sender: "bot" }])
      } else {
        const translated = baseTranslations.en
        setTranslations(translated)
        setMessages([{ id: "1", text: translated.initialBotMessage, sender: "bot" }])
      }
      setIsLoading(false)
    }
    loadTranslations()
  }, [currentLanguage])

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
          method: "stepback",
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{translations?.loading || "Loading..."}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <header className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{translations.pageTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-200">{translations.pageDescription}</p>
      </header>
      <ScrollArea className="flex-1 p-6 space-y-4">
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
            </div>
            {message.sender === "user" && (
              <Avatar className="h-8 w-8">
                {/* Replace with actual user avatar if available */}
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </ScrollArea>
      <footer className="p-4 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={translations.inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b4cef9] dark:text-black"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
