"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  MapPin,
  ListChecks,
  ShieldCheck,
  History,
  Star,
  User,
  HelpCircle,
  Sun,
  Moon,
  Globe,
  PlusCircle,
  Home,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

// Translations object
const translations = {
  he: {
    appName: 'עיל"ם',
    appDescription: "עוזר ייעודי למצבי חירום",
    newAction: "פעולה חדשה",
    home: "דף הבית",
    chatHistory: "היסטוריית שיחות",
    favoriteShelters: "מקלטים מועדפים",
    favoriteEquipmentLists: "כל רשימות הציוד",
    faq: "שאלות נפוצות",
    profile: "פרופיל",
    logout: "התנתקות",
    logoutAlert: "התנתקות תמומש עם Supabase. כעת מועבר לדף ההתחברות.",
    newChat: "צ'אט חירום חדש",
    findShelter: "חיפוש מקלט",
    createEquipmentList: "יצירת רשימת ציוד",
    aiAgent: "סוכן AI (בקרוב)",
    language: "שפה",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  en: {
    appName: "EILAM",
    appDescription: "AI for Emergency Situations",
    newAction: "New Action",
    home: "Home",
    chatHistory: "Chat History",
    favoriteShelters: "Favorite Shelters",
    favoriteEquipmentLists: "All Equipment Lists",
    faq: "FAQ",
    profile: "Profile",
    logout: "Logout",
    logoutAlert: "Logout will be implemented with Supabase. Redirecting to login page.",
    newChat: "New Emergency Chat",
    findShelter: "Find Shelter",
    createEquipmentList: "Create Equipment List",
    aiAgent: "AI Agent (Coming Soon)",
    language: "Language",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  ar: {
    appName: "إيلام",
    appDescription: "مساعد للحالات الطارئة",
    newAction: "إجراء جديد",
    home: "الصفحة الرئيسية",
    chatHistory: "سجل المحادثات",
    favoriteShelters: "الملاجئ المفضلة",
    favoriteEquipmentLists: "جميع قوائم المعدات",
    faq: "الأسئلة الشائعة",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    logoutAlert: "سيتم تنفيذ تسجيل الخروج مع Supabase. جارٍ التوجيه إلى صفحة تسجيل الدخول.",
    newChat: "محادثة طوارئ جديدة",
    findShelter: "البحث عن ملجأ",
    createEquipmentList: "إنشاء قائمة معدات",
    aiAgent: "وكيل الذكاء الاصطناعي (قريبا)",
    language: "لغة",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  ru: {
    appName: "ЭЙЛАМ",
    appDescription: "ИИ для чрезвычайных ситуаций",
    newAction: "Новое действие",
    home: "Главная",
    chatHistory: "История чатов",
    favoriteShelters: "Избранные убежища",
    favoriteEquipmentLists: "Все списки оборудования",
    faq: "Часто задаваемые вопросы",
    profile: "Профиль",
    logout: "Выйти",
    logoutAlert: "Выход будет реализован с Supabase. Перенаправление на страницу входа.",
    newChat: "Новый чат для чрезвычайных ситуаций",
    findShelter: "Найти убежище",
    createEquipmentList: "Создать список оборудования",
    aiAgent: "ИИ-агент (Скоро)",
    language: "Язык",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
}

// Temporary user data until Supabase integration
const TEMP_USER = {
  fullName: {
    he: "משתמש לדוגמה",
    en: "Demo User",
    ar: "مستخدم تجريبي",
    ru: "Тестовый пользователь",
  },
  firstName: {
    // Added for initials
    he: "משתמש",
    en: "Demo",
    ar: "مستخدم",
    ru: "Тестовый",
  },
  lastName: {
    // Added for initials
    he: "לדוגמה",
    en: "User",
    ar: "تجريبي",
    ru: "пользователь",
  },
  email: "user@example.com",
  profileImageUrl:
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png", // Placeholder image
}

// Function to get initials
const getInitials = (firstName, lastName) => {
  const firstInitial = firstName ? firstName[0] : ""
  const lastInitial = lastName ? lastName[0] : ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export default function AppLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState("light")
  const pathname = usePathname()
  const router = useRouter()

  // שימוש בקונטקסט השפה במקום לגשת ישירות ל-document
  const { language, setLanguage, isRTL } = useLanguage()

  const t = translations[language] || translations.he // Fallback to Hebrew if current language not found

  useEffect(() => {
    // Load theme from localStorage
    const storedTheme = localStorage.getItem("eilam-theme") || "light"
    setTheme(storedTheme)

    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    localStorage.setItem("eilam-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      // Check if the new language is supported
      setLanguage(newLang)
    } else {
      setLanguage("he") // Default to Hebrew if unsupported language
    }
  }

  const handleLogout = () => {
    alert(t.logoutAlert)
    router.push("/login")
  }

  const navItems = [
    { name: t.home, path: "/", icon: Home },
    { name: t.chatHistory, path: "/chat-history", icon: History },
    { name: t.favoriteShelters, path: "/favorite-shelters", icon: Star },
    { name: t.favoriteEquipmentLists, path: "/equipment-lists", icon: ListChecks },
    { name: t.faq, path: "/faq", icon: HelpCircle },
  ]

  const newActionItems = [
    { name: t.newChat, path: "/chat", icon: MessageSquare },
    { name: t.findShelter, path: "/shelters", icon: MapPin },
    { name: t.createEquipmentList, path: "/equipment", icon: ListChecks },
    {
      name: t.aiAgent,
      path: "/agent",
      icon: ShieldCheck,
      disabled: false,
      className: "text-purple-500 dark:text-purple-400",
    },
  ]

  const sidebarBgColor = theme === "dark" ? "bg-gray-800" : "bg-white"
  const sidebarTextColor = theme === "dark" ? "text-white" : "text-purple-600"
  const sidebarHoverBgColor = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50"
  const sidebarActiveColor = theme === "dark" ? "bg-purple-600 text-white" : "bg-purple-600 text-white"
  const sidebarBorderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const directionIcon = isRTL ? (
    isSidebarExpanded ? (
      <ChevronRight />
    ) : (
      <ChevronLeft />
    )
  ) : isSidebarExpanded ? (
    <ChevronLeft />
  ) : (
    <ChevronRight />
  )

  // Skip layout for login and register pages
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn("p-4 flex items-center", isSidebarExpanded ? "justify-between" : "justify-center")}>
        {isSidebarExpanded && (
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
              alt="EILAM Logo"
              className="h-10 w-10 rounded-full"
            />
            <div className={cn("text-xl font-bold", theme === "dark" ? "text-white" : "text-purple-600")}>
              {t.appName}
              <p className={cn("text-xs font-normal", theme === "dark" ? "text-gray-300" : "text-purple-500")}>
                {t.appDescription}
              </p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className={cn(
            "hidden lg:flex",
            theme === "dark" ? "text-white hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {directionIcon}
        </Button>
      </div>

      <div className="px-3 mb-4">
        <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              className={cn(
                "w-full justify-center bg-purple-600 hover:bg-purple-700 text-white",
                isSidebarExpanded ? "gap-2" : "",
              )}
            >
              <PlusCircle className="h-5 w-5" />
              {isSidebarExpanded && <span>{t.newAction}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 dark:bg-gray-800"
            align={isSidebarExpanded && isRTL ? "start" : "end"}
            sideOffset={5}
          >
            {newActionItems.map((item) => (
              <DropdownMenuItem
                key={item.name}
                asChild
                disabled={item.disabled}
                className="cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Link
                  href={!item.disabled ? item.path : "#"}
                  className={cn("flex items-center gap-2 w-full", item.className)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-grow px-3 space-y-1">
        {navItems.map((item) => (
          <TooltipProvider key={item.name} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.path}
                  onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    pathname === item.path ? sidebarActiveColor : `${sidebarTextColor} ${sidebarHoverBgColor}`,
                    !isSidebarExpanded && "justify-center",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {isSidebarExpanded && <span>{item.name}</span>}
                </Link>
              </TooltipTrigger>
              {!isSidebarExpanded && (
                <TooltipContent side={isRTL ? "left" : "right"} className="dark:bg-gray-700 dark:text-gray-200">
                  <p>{item.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>

      <div className={`p-3 border-t ${sidebarBorderColor}`}>
        <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full flex items-center ${sidebarTextColor} ${sidebarHoverBgColor}`}
              style={{ justifyContent: isSidebarExpanded ? "space-between" : "center" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full ${theme === "dark" ? "bg-[#cc9999]" : "bg-[#ea5c3e]"} flex items-center justify-center text-white font-semibold`}
                >
                  {getInitials(
                    TEMP_USER.firstName[language] || TEMP_USER.firstName.he,
                    TEMP_USER.lastName[language] || TEMP_USER.lastName.he,
                  )}
                </div>
                {isSidebarExpanded && (
                  <div className="flex flex-col items-start flex-grow min-w-0">
                    <span className="font-medium truncate">
                      {TEMP_USER.fullName[language] || TEMP_USER.fullName.he}
                    </span>
                  </div>
                )}
              </div>
              {isSidebarExpanded && <ChevronDown className="h-4 w-4 shrink-0 ml-2" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 dark:bg-gray-800"
            align={isSidebarExpanded && isRTL ? "start" : "end"}
            sideOffset={5}
          >
            <DropdownMenuItem asChild className="cursor-pointer text-center dark:text-gray-200 dark:hover:bg-gray-700">
              <Link href="/profile" className="flex items-center justify-center gap-2 w-full">
                <User className="h-4 w-4" /> {t.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:bg-gray-700" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer justify-center text-red-500 hover:!bg-red-100 dark:text-red-400 dark:hover:!bg-red-700/30"
            >
              <LogOut className="h-4 w-4 mr-2" /> {t.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white`}>
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300 ease-in-out",
          sidebarBgColor,
          sidebarBorderColor,
          isSidebarExpanded ? "w-64" : "w-20",
        )}
        style={{
          borderLeft: isRTL ? "1px solid var(--sidebar-border-color)" : "none",
          borderRight: !isRTL ? "1px solid var(--sidebar-border-color)" : "none",
        }}
      >
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 bottom-0 z-40 h-full w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          sidebarBgColor,
          sidebarBorderColor,
          isRTL
            ? isMobileMenuOpen
              ? "translate-x-0 right-0"
              : "translate-x-full right-0"
            : isMobileMenuOpen
              ? "translate-x-0 left-0"
              : "-translate-x-full left-0",
        )}
        style={{
          borderLeft: isRTL ? "1px solid var(--sidebar-border-color)" : "none",
          borderRight: !isRTL ? "1px solid var(--sidebar-border-color)" : "none",
        }}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-850 shadow-sm dark:border-b dark:border-gray-700 p-3 flex items-center justify-between lg:justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-700"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu />
          </Button>
          <div className="flex items-center gap-3">
            <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 text-gray-800 dark:text-gray-300">
                  <Globe className="h-5 w-5" />
                  <span className="hidden sm:inline">{t.languages[language] || t.languages.he}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="dark:bg-gray-800">
                <DropdownMenuLabel className="dark:text-gray-400">{t.language}</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                {Object.keys(t.languages).map((langKey) => (
                  <DropdownMenuItem
                    key={langKey}
                    onClick={() => changeLanguage(langKey)}
                    className={cn(
                      "cursor-pointer dark:hover:bg-gray-700 dark:text-gray-200",
                      language === langKey && "bg-gray-100 dark:bg-gray-700 font-semibold",
                    )}
                  >
                    {t.languages[langKey]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-800 dark:text-gray-300">
              {theme === "light" ? <Moon /> : <Sun />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
      <style jsx global>{`
        :root {
          --sidebar-border-color: ${theme === "light" ? "#e5e7eb" : "#374151"}; 
        }
        .dark .card {
          background-color: #1f2937; /* Default dark card background */
        }
        /* Global override for specific p tags in dark mode to be white (or light gray) */
        .dark p.text-gray-600, 
        .dark p.text-gray-500, 
        .dark p.text-gray-400, 
        .dark p.text-gray-300 {
          color: #e5e7eb !important; /* Light gray for better readability than pure white */
        }

        /* Ensure card descriptions in dark mode also use light gray if they were darker */
        .dark .card p.text-gray-500, 
        .dark .card p.text-gray-400, 
        .dark .card p.text-gray-300 {
          color: #e5e7eb !important;
        }

        /* Titles in cards in dark mode */
        .dark .card h2.text-3xl,
        .dark .card h1, /* Added h1 for homepage */
        .dark .card h2, 
        .dark .card h3, 
        .dark .card h4, 
        .dark .card h5, 
        .dark .card h6,
        .dark .card .text-gray-800, /* Generic catch for text that should be light in dark cards */
        .dark .card .text-gray-700,
        .dark .card .text-gray-900 {
          color: #f9fafb !important; /* Off-white for titles in dark cards */
        }

        /* Ensure specific text colors in Layout.js respect dark mode better */
        .dark .text-gray-700 {
          color: #d1d5db !important; /* Lighter gray for general text-gray-700 elements in dark mode */
        }
        .dark .text-gray-800 {
          color: #e5e7eb !important; /* Lighter gray */
        }
        .dark .text-gray-900 {
          color: #f3f4f6 !important; /* Even lighter gray / off-white */
        }
        
        /* Ensure the sidebar toggle icon is visible in light mode too */
        .lg\\:flex.text-gray-700:hover {
             background-color: ${theme === "dark" ? "#4b5563" : "#f3f4f6"} !important; /* Adjusted hover for light/dark */
        }

        /* עדכון צבעי הסרגל הצדדי */
        [data-active=true] {
          background-color: #005c72 !important;
        }
        .dark [data-active=true] {
          background-color: #005c72 !important;
        }
        .text-purple-600, .dark .text-purple-400 {
          color: #005c72 !important;
        }
        .dark .text-purple-400 {
          color: #e5e5e5 !important;
        }
        .hover\\:text-purple-600:hover, .dark .hover\\:text-purple-400:hover {
          color: #005c72 !important;
        }
        .dark .hover\\:text-purple-400:hover {
          color: #e5e5e5 !important;
        }
      `}</style>
    </div>
  )
}
