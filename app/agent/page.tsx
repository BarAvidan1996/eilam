"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, Construction } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// תרגומים לפי שפה
const translations = {
  he: {
    title: "סוכן AI לתיק היערכות אישי",
    description: "היכולת הזו נמצאת בפיתוח ותהיה זמינה בקרוב!",
    message:
      "אנו עובדים במרץ כדי להביא לכם את סוכן ה-AI המתקדם, שיעזור לכם לבנות תיק היערכות מקיף ומותאם אישית לכל מצב חירום, כולל המלצות למסלולי מילוט.",
    backToHome: "חזרה לדף הבית",
  },
  en: {
    title: "AI Agent for Personal Emergency Kit",
    description: "This feature is under development and will be available soon!",
    message:
      "We are working hard to bring you the advanced AI agent, which will help you build a comprehensive and personalized emergency kit for any emergency situation, including recommendations for evacuation routes.",
    backToHome: "Back to Home",
  },
  ar: {
    title: "وكيل الذكاء الاصطناعي لحقيبة الطوارئ الشخصية",
    description: "هذه الميزة قيد التطوير وستكون متاحة قريبًا!",
    message:
      "نحن نعمل بجد لتقديم وكيل الذكاء الاصطناعي المتقدم، الذي سيساعدك على بناء حقيبة طوارئ شاملة ومخصصة لأي حالة طوارئ، بما في ذلك توصيات لمسارات الإخلاء.",
    backToHome: "العودة إلى الصفحة الرئيسية",
  },
  ru: {
    title: "ИИ-агент для персонального аварийного комплекта",
    description: "Эта функция находится в разработке и будет доступна в ближайшее время!",
    message:
      "Мы усердно работаем, чтобы предоставить вам продвинутого ИИ-агента, который поможет вам создать комплексный и персонализированный аварийный комплект для любой чрезвычайной ситуации, включая рекомендации по маршрутам эвакуации.",
    backToHome: "Вернуться на главную",
  },
}

export default function AgentPage() {
  const [language, setLanguage] = useState("he")

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
  }, [])

  const t = translations[language] || translations.he

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      <Card className="shadow-xl dark:bg-gray-800 w-full text-center">
        <CardHeader>
          <ShieldCheck className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t.title}</CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400 mt-2">{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Construction className="h-24 w-24 text-yellow-500 mx-auto my-8 animate-pulse" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{t.message}</p>
          <Link href="/">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              {t.backToHome}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
