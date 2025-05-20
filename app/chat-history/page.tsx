"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { History, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { he, enUS, ar, ru } from "date-fns/locale"

// הוספת דגל שמונע רנדור סטטי של הדף
export const dynamic = "force-dynamic"

const baseTranslations = {
  he: {
    pageTitle: "היסטוריית שיחות צ'אט",
    pageDescription: 'צפה בשיחות קודמות שניהלת עם עיל"ם.',
    noChatHistory: 'עדיין לא ניהלת שיחות עם עיל"ם.',
    startNewChatButton: "התחל שיחה חדשה",
    loading: "טוען...",
  },
  en: {
    pageTitle: "Chat History",
    pageDescription: "View your previous conversations with EILAM.",
    noChatHistory: "You haven't had any conversations with EILAM yet.",
    startNewChatButton: "Start New Chat",
    loading: "Loading...",
  },
  ar: {
    pageTitle: "سجل المحادثات",
    pageDescription: "عرض محادثاتك السابقة مع إيلام.",
    noChatHistory: "لم تجري أي محادثات مع إيلام حتى الآن.",
    startNewChatButton: "بدء محادثة جديدة",
    loading: "جار التحميل...",
  },
  ru: {
    pageTitle: "История чатов",
    pageDescription: "Просмотр ваших предыдущих разговоров с ЭЙЛАМ.",
    noChatHistory: "У вас еще не было разговоров с ЭЙЛАМ.",
    startNewChatButton: "Начать новый чат",
    loading: "Загрузка...",
  },
}

export default function ChatHistoryPage() {
  // התחל עם שפת ברירת מחדל (עברית)
  const [language, setLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [chatSessions, setChatSessions] = useState([])
  const [isRTL, setIsRTL] = useState(true) // ברירת מחדל לעברית (RTL)
  const [dateLocale, setDateLocale] = useState(he) // ברירת מחדל לעברית

  // בדוק את שפת הדפדפן רק בצד הלקוח
  useEffect(() => {
    // בדיקה שאנחנו בצד הלקוח
    if (typeof window !== "undefined") {
      const browserLanguage = document.documentElement.lang || "he"
      setLanguage(browserLanguage)

      // עדכון כיוון הטקסט
      setIsRTL(browserLanguage === "he" || browserLanguage === "ar")

      // עדכון לוקאל התאריך
      const localeMap = {
        he: he,
        en: enUS,
        ar: ar,
        ru: ru,
      }
      setDateLocale(localeMap[browserLanguage] || enUS)

      // עדכון התרגומים
      if (baseTranslations[browserLanguage]) {
        setTranslations(baseTranslations[browserLanguage])
      } else {
        setTranslations(baseTranslations.en) // ברירת מחדל לאנגלית אם השפה לא נתמכת
      }

      // סימולציה של טעינת נתונים
      setChatSessions([])
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{translations.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <History /> {translations.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-white">{translations.pageDescription}</p>
      </header>

      {chatSessions.length > 0 ? (
        <div className="space-y-4">
          {chatSessions.map((session) => (
            <Card key={session.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 ml-2">
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-400 break-words">
                      {session.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(session.date), "d MMMM, yyyy 'at' HH:mm", { locale: dateLocale })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 break-words">
                      {session.preview}
                    </p>
                  </div>
                  <Link href={`/chat?session=${session.id}`} className="flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {isRTL ? <ChevronLeft /> : <ChevronRight />}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-md dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{translations.noChatHistory}</p>
            <Link href="/chat">
              <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                <MessageSquare className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {translations.startNewChatButton}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
