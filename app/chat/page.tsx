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
    storage_path?: string
  }>
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
          text: msg.message,
          sender: msg.is_user ? "user" : "bot",
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

  // פונקציה לפתיחת מקור מה-storage
  const openSource = async (source: { title: string; file_name: string; storage_path?: string }) => {
    try {
      if (source.storage_path) {
        console.log("🔍 מנסה לחלץ URL מקורי מקובץ HTML:", source.storage_path)

        // רשימת buckets אפשריים לנסות
        const bucketsToTry = ["html-docs", "documents", "files", "rag-documents", "storage"]

        let originalUrl = null

        // ננסה כל bucket עד שנמצא אחד שעובד
        for (const bucketName of bucketsToTry) {
          try {
            console.log(`🔍 מנסה bucket: ${bucketName}`)

            // ננקה את הנתיב מכפילות של שם הbucket
            let cleanStoragePath = source.storage_path
            if (cleanStoragePath.startsWith(`${bucketName}/`)) {
              cleanStoragePath = cleanStoragePath.substring(bucketName.length + 1)
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(cleanStoragePath)

            if (data?.publicUrl) {
              console.log(`🔗 מנסה לקרוא קובץ מ-${bucketName}:`, data.publicUrl)

              // קריאת תוכן הקובץ HTML
              const response = await fetch(data.publicUrl)
              if (response.ok) {
                const htmlContent = await response.text()
                console.log("📄 קובץ HTML נקרא בהצלחה, מחפש URL מקורי...")

                // הדפסת תחילת הקובץ לבדיקה
                console.log("🔍 תחילת תוכן הקובץ:", htmlContent.substring(0, 500))

                // חיפוש ה-URL המקורי בהערה - ביטוי רגולרי מתוקן
                const urlMatch = htmlContent.match(/<!--\s*saved from url=$$\d+$$(https?:\/\/[^>\s]+)\s*-->/i)
                if (urlMatch && urlMatch[1]) {
                  originalUrl = urlMatch[1]
                  console.log("✅ נמצא URL מקורי:", originalUrl)
                  break
                } else {
                  console.log("⚠️ לא נמצא URL מקורי בקובץ")
                  console.log("🔍 מחפש בכל הקובץ אחר 'saved from url'...")
                  const savedFromIndex = htmlContent.indexOf("saved from url")
                  if (savedFromIndex !== -1) {
                    console.log("📍 נמצא 'saved from url' במיקום:", savedFromIndex)
                    console.log(
                      "📝 תוכן סביב המיקום:",
                      htmlContent.substring(savedFromIndex - 50, savedFromIndex + 200),
                    )
                  }
                }
              }
            }
          } catch (e) {
            console.log(`❌ Bucket ${bucketName} לא עובד:`, e)
            continue
          }
        }

        if (originalUrl) {
          console.log("🚀 פותח URL מקורי:", originalUrl)
          window.open(originalUrl, "_blank", "noopener,noreferrer")
        } else {
          console.error("❌ לא הצלחתי לחלץ URL מקורי, משתמש ב-fallback")
          // fallback - ננסה את האתר הרשמי
          const fallbackUrl = `https://www.oref.org.il/${source.file_name}`
          console.log("🔄 משתמש ב-fallback URL:", fallbackUrl)
          window.open(fallbackUrl, "_blank", "noopener,noreferrer")
        }
      } else {
        // fallback - אם אין storage_path, ננסה את האתר הרשמי
        console.log("⚠️ אין storage_path, משתמש ב-fallback")
        const fallbackUrl = `https://www.oref.org.il/${source.file_name}`
        window.open(fallbackUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("❌ שגיאה בפתיחת מקור:", error)
      // fallback אחרון
      const fallbackUrl = `https://www.oref.org.il/${source.file_name}`
      window.open(fallbackUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleSendMessage = async () => {
    console.log("🎯 handleSendMessage - התחלה")
    console.log("  - inputValue:", `"${inputValue}"`)
    console.log("  - sessionId:", sessionId)
    console.log("  - isInitializing:", isInitializing)

    if (inputValue.trim() === "" || isTyping || isInitializing || !sessionId) {
      console.log("❌ יציאה מוקדמת:", {
        emptyInput: inputValue.trim() === "",
        isTyping,
        isInitializing,
        noSessionId: !sessionId,
      })
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
    console.log("📝 currentQuestion:", `"${currentQuestion}"`)

    setInputValue("")
    setIsTyping(true)

    try {
      // הכנת הגוף לשליחה
      const requestBody = {
        message: currentQuestion,
        sessionId: sessionId,
      }

      console.log("📦 מכין בקשה:")
      console.log("  - URL: /api/chat")
      console.log("  - Method: POST")
      console.log("  - Body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("📡 תגובת שרת:")
      console.log("  - Status:", response.status)
      console.log("  - StatusText:", response.statusText)
      console.log("  - OK:", response.ok)

      if (!response.ok) {
        // ננסה לקרוא את תוכן השגיאה
        let errorText = ""
        try {
          const errorData = await response.json()
          console.log("❌ פרטי שגיאה מהשרת:", errorData)
          errorText = errorData.error || `HTTP ${response.status}`
        } catch (e) {
          console.log("❌ לא הצלחתי לפרסר את שגיאת השרת")
          errorText = `HTTP error! status: ${response.status}`
        }
        throw new Error(errorText)
      }

      const data = await response.json()
      console.log("✅ נתונים שהתקבלו מהשרת:", data)

      // הדפסת אחוזי התאמה לקונסול
      if (data.sources && data.sources.length > 0) {
        console.log("📊 Sources similarity scores:")
        data.sources.forEach((source: any, index: number) => {
          console.log(`  ${index + 1}. ${source.title}: ${Math.round(source.similarity * 100)}%`)
          if (source.storage_path) {
            console.log(`     Storage path: ${source.storage_path}`)
          }
        })
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || "מצטער, לא הצלחתי לייצר תשובה.",
        sender: "bot",
        timestamp: new Date(),
        sources: data.sources,
      }

      console.log("🤖 הוספת הודעת בוט:", {
        textPreview: botMessage.text.substring(0, 100) + "...",
        sourcesCount: botMessage.sources?.length || 0,
      })

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("💥 שגיאה בשליחת הודעה:")
      console.error("  - Error type:", error?.constructor?.name)
      console.error("  - Error message:", error instanceof Error ? error.message : String(error))
      console.error("  - Error object:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `מצטער, אירעה שגיאה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      console.log("🏁 סיום handleSendMessage")
      setIsTyping(false)
    }
  }

  // הצגת מסך טעינה בזמן אתחול
  if (isInitializing) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="bg-[#005C72] dark:bg-[#D3E3FD] text-white dark:text-gray-900 p-4">
          <h1 className="text-xl font-semibold">צ'אט חירום - עיל"ם</h1>
          <p className="text-sm opacity-90">עוזר החירום האישי שלך מבוסס על מידע מאתר פיקוד העורף</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005C72] dark:border-[#D3E3FD] mx-auto mb-4"></div>
            <p className="text-gray-600">מכין את הצ'אט...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#005C72] dark:bg-[#D3E3FD] text-white dark:text-gray-900 p-4">
        <h1 className="text-xl font-semibold">צ'אט חירום - עיל"ם</h1>
        <p className="text-sm opacity-90">עוזר החירום האישי שלך מבוסס על מידע מאתר פיקוד העורף</p>
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
                  <AvatarFallback className="bg-[#005C72]/10 dark:bg-[#D3E3FD]/10 text-[#005C72] dark:text-gray-900">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[75%] ${message.sender === "user" ? "order-2" : ""}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-[#005C72] dark:bg-[#D3E3FD] text-white dark:text-gray-900 rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium mb-1">מקורות:</p>
                    <ul className="space-y-1">
                      {message.sources.map((source, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <button
                            onClick={() => openSource(source)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                          >
                            {source.title}
                          </button>
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
                <AvatarFallback className="bg-[#005C72]/10 dark:bg-[#D3E3FD]/10 text-[#005C72] dark:text-gray-900">
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
            className="bg-[#005C72] hover:bg-[#004A5C] dark:bg-[#D3E3FD] dark:hover:bg-[#C1D7F7] text-white dark:text-gray-900 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">עיל"ם מבוסס על מידע מאתר פיקוד העורף • גרסה ניסיונית</p>
      </div>
    </div>
  )
}
