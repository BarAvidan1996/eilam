"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, MapPin, ListChecks, ArrowRight, ArrowLeft, Bot, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

// Force dynamic rendering to avoid document is not defined error
export const dynamic = "force-dynamic"

// URL for the avatar image - using the correct support agent image
const SUPPORT_AGENT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/support-agent-jp2UdfkKVHbjwhcmGAH5C2ohfK4szD.png"

// Base translations (will be translated to other languages if needed)
const baseTranslations = {
  en: {
    greeting: "Hello",
    whatToDo: "What would you like to do today?",
    emergencyAgent: {
      title: "Emergency Agent",
      description: "Get instant help with complex emergency situations using AI-powered assistance",
      cta: "Start",
    },
    emergencyChat: {
      title: "Emergency Chat",
      description: "Ask questions and receive immediate information about emergency situations",
      cta: "Start",
    },
    shelters: {
      title: "Shelters",
      description: "Find the nearest shelter and get directions",
      cta: "Start",
    },
    emergencyEquipment: {
      title: "Emergency Equipment",
      description: "Manage your equipment lists and get notifications about expired items",
      cta: "Start",
    },
    loading: "Loading...",
  },
  he: {
    greeting: "שלום",
    whatToDo: "מה תרצה לעשות היום?",
    emergencyAgent: {
      title: "סוכן חירום",
      description: "קבל עזרה מיידית במצבי חירום מורכבים באמצעות בינה מלאכותית מתקדמת",
      cta: "התחל",
    },
    emergencyChat: {
      title: "צ'אט חירום",
      description: "שאל שאלות וקבל מידע מיידי על מצבי חירום",
      cta: "התחל",
    },
    shelters: {
      title: "מקלטים",
      description: "מצא את המקלט הקרוב אליך וקבל הוראות הגעה",
      cta: "התחל",
    },
    emergencyEquipment: {
      title: "ציוד חירום",
      description: "נהל את רשימות הציוד שלך וקבל התראות על פריטים שפג תוקפם",
      cta: "התחל",
    },
    loading: "טוען...",
  },
  ar: {
    greeting: "مرحبا",
    whatToDo: "ماذا تود أن تفعل اليوم؟",
    emergencyAgent: {
      title: "وكيل الطوارئ",
      description: "احصل على مساعدة فورية في حالات الطوارئ المعقدة باستخدام الذكاء الاصطناعي المتقدم",
      cta: "ابدأ",
    },
    emergencyChat: {
      title: "دردشة الطوارئ",
      description: "اطرح أسئلة واحصل على معلومات فورية حول حالات الطوارئ",
      cta: "ابدأ",
    },
    shelters: {
      title: "الملاجئ",
      description: "ابحث عن أقرب ملجأ واحصل على الاتجاهات",
      cta: "ابدأ",
    },
    emergencyEquipment: {
      title: "معدات الطوارئ",
      description: "إدارة قوائم المعدات الخاصة بك والحصول على إشعارات حول العناصر منتهية الصلاحية",
      cta: "ابدأ",
    },
    loading: "جار التحميل...",
  },
  ru: {
    greeting: "Здравствуйте",
    whatToDo: "Что бы вы хотели сделать сегодня?",
    emergencyAgent: {
      title: "Агент экстренных ситуаций",
      description: "Получите мгновенную помощь в сложных чрезвычайных ситуациях с помощью передового ИИ",
      cta: "Начать",
    },
    emergencyChat: {
      title: "Экстренный чат",
      description: "Задавайте вопросы и получайте немедленную информацию о чрезвычайных ситуациях",
      cta: "Начать",
    },
    shelters: {
      title: "Убежища",
      description: "Найдите ближайшее убежище и получите указания",
      cta: "Начать",
    },
    emergencyEquipment: {
      title: "Аварийное оборудование",
      description: "Управляйте своими списками оборудования и получайте уведомления о просроченных предметах",
      cta: "Начать",
    },
    loading: "Загрузка...",
  },
}

export default function DashboardPage() {
  // Initialize with default language
  const [language, setLanguage] = useState("he")
  const [translations, setTranslations] = useState(baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [isRTL, setIsRTL] = useState(true)
  const [theme, setTheme] = useState("light")
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Only access document in the browser
    if (typeof window !== "undefined") {
      const browserLanguage = document.documentElement.lang || "he"
      setLanguage(browserLanguage)

      // Set RTL based on language
      setIsRTL(browserLanguage === "he" || browserLanguage === "ar")

      // Get theme from localStorage
      const storedTheme = localStorage.getItem("eilam-theme") || "light"
      setTheme(storedTheme)

      // Use the existing translations if available
      if (baseTranslations[browserLanguage]) {
        setTranslations(baseTranslations[browserLanguage])
      } else {
        setTranslations(baseTranslations.en) // Fallback to English
      }
    }
  }, [])

  // Check if user is logged in and fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        router.push("/")
        return
      }

      setUser(session.user)

      try {
        // Try to get user profile using RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_profile", {
          user_id: session.user.id,
        })

        if (!rpcError && rpcData && rpcData.length > 0) {
          setUserProfile(rpcData[0])
        } else {
          console.log("Falling back to auth metadata")
          // Fallback to auth metadata
          setUserProfile({
            first_name: session.user.user_metadata?.first_name || "",
            last_name: session.user.user_metadata?.last_name || "",
            email: session.user.email,
            phone: session.user.user_metadata?.phone || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        // Fallback to auth metadata
        setUserProfile({
          first_name: session.user.user_metadata?.first_name || "",
          last_name: session.user.user_metadata?.last_name || "",
          email: session.user.email,
          phone: session.user.user_metadata?.phone || "",
        })
      }

      setIsLoading(false)
    }

    fetchUserData()
  }, [router, supabase])

  const t = translations

  const features = [
    {
      title: t.emergencyAgent.title,
      description: t.emergencyAgent.description,
      icon: Bot,
      page: "/agent",
      cta: t.emergencyAgent.cta,
      isPrimary: true, // This makes it the CTA card
    },
    {
      title: t.emergencyChat.title,
      description: t.emergencyChat.description,
      icon: MessageSquare,
      page: "/chat",
      cta: t.emergencyChat.cta,
    },
    {
      title: t.shelters.title,
      description: t.shelters.description,
      icon: MapPin,
      page: "/shelters",
      cta: t.shelters.cta,
    },
    {
      title: t.emergencyEquipment.title,
      description: t.emergencyEquipment.description,
      icon: ListChecks,
      page: "/equipment",
      cta: t.emergencyEquipment.cta,
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-[#005c72]/20 dark:from-gray-900 dark:to-[#005c72]/20">
      <header className="text-center mb-12">
        <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
          <img
            src={SUPPORT_AGENT_URL || "/placeholder.svg"}
            alt="Support Agent"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
          {t.greeting}, {userProfile?.first_name || "משתמש"}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">{t.whatToDo}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full max-w-7xl">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className={cn(
              "shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden flex flex-col relative",
              feature.disabled && "opacity-50 cursor-not-allowed",
              feature.isPrimary
                ? // Primary CTA card styling
                  "bg-gradient-to-br from-[#ea5c3e] to-[#ea5c3e]/80 dark:from-[#cc9999] dark:to-[#cc9999]/80 text-white dark:text-black border-2 border-[#ea5c3e]/30 dark:border-[#cc9999]/30 transform hover:scale-105"
                : // Regular card styling
                  "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750",
            )}
          >
            {feature.isPrimary && (
              <div className="absolute top-2 right-2">
                <Sparkles className="w-5 h-5 text-white/80 dark:text-black/80 animate-pulse" />
              </div>
            )}
            <CardHeader className="items-center text-center pt-8">
              <div
                className={cn(
                  "p-4 rounded-full mb-4 inline-block",
                  feature.isPrimary ? "bg-white/20 dark:bg-black/20" : "bg-[#ea5c3e]/10 dark:bg-[#cc9999]/20",
                )}
              >
                <feature.icon
                  className={cn(
                    "w-8 h-8",
                    feature.isPrimary ? "text-white dark:text-black" : "text-[#ea5c3e] dark:text-[#cc9999]",
                  )}
                />
              </div>
              <CardTitle
                className={cn(
                  "text-2xl font-semibold",
                  feature.isPrimary ? "text-white dark:text-black" : "text-gray-800 dark:text-white",
                )}
              >
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-8 flex flex-col flex-grow">
              <div className="flex-grow">
                <CardDescription
                  className={cn(
                    "mb-6 text-base min-h-[4.5rem]",
                    feature.isPrimary ? "text-white/90 dark:text-black/90" : "text-gray-600 dark:text-gray-300",
                  )}
                >
                  {feature.description}
                </CardDescription>
              </div>
              <Link href={!feature.disabled ? feature.page : "#"} className="mt-auto">
                <Button
                  size="lg"
                  className={cn(
                    "w-full font-semibold",
                    feature.isPrimary
                      ? "bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 dark:bg-black/20 dark:hover:bg-black/30 dark:text-black dark:border-black/30 dark:hover:border-black/50"
                      : "bg-[#005c72] hover:bg-[#004a5d] text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b1c9f8] dark:text-black",
                  )}
                  disabled={feature.disabled}
                >
                  {feature.cta}{" "}
                  {isRTL ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
