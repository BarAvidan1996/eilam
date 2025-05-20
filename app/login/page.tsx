"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sun, Moon } from "lucide-react"

// תרגומים לפי שפה
const translations = {
  he: {
    login: "התחברות",
    enterDetails: "הזן את פרטיך כדי להמשיך",
    email: "דואר אלקטרוני *",
    password: "סיסמה *",
    rememberMe: "זכור אותי",
    loginButton: "התחבר",
    noAccount: "אין לך חשבון?",
    registerHere: "הרשם כאן",
    loginInProgress: "התחברות תמומש בהמשך עם Supabase. כעת מועבר לדף הבית.",
  },
  en: {
    login: "Login",
    enterDetails: "Enter your details to continue",
    email: "Email *",
    password: "Password *",
    rememberMe: "Remember me",
    loginButton: "Login",
    noAccount: "Don't have an account?",
    registerHere: "Register here",
    loginInProgress: "Login will be implemented with Supabase. Redirecting to home page.",
  },
  ar: {
    login: "تسجيل الدخول",
    enterDetails: "أدخل بياناتك للمتابعة",
    email: "البريد الإلكتروني *",
    password: "كلمة المرور *",
    rememberMe: "تذكرني",
    loginButton: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    registerHere: "سجل هنا",
    loginInProgress: "سيتم تنفيذ تسجيل الدخول باستخدام Supabase. جارٍ إعادة التوجيه إلى الصفحة الرئيسية.",
  },
  ru: {
    login: "Вход",
    enterDetails: "Введите свои данные для продолжения",
    email: "Электронная почта *",
    password: "Пароль *",
    rememberMe: "Запомнить меня",
    loginButton: "Войти",
    noAccount: "Нет аккаунта?",
    registerHere: "Зарегистрироваться здесь",
    loginInProgress: "Вход будет реализован с помощью Supabase. Перенаправление на главную страницу.",
  },
}

export default function UserLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
    setIsRTL(lang === "he" || lang === "ar")
  }, [])

  const t = translations[language] || translations.he

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Login attempt:", { email, password, rememberMe })
    alert(t.loginInProgress)
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light"

      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      localStorage.setItem("eilam-theme", newTheme)
      return newTheme
    })
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 ${theme} ${isRTL ? "rtl" : ""}`}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? (
            <Moon className="text-gray-600 dark:text-gray-300" />
          ) : (
            <Sun className="text-gray-600 dark:text-gray-300" />
          )}
        </Button>
      </div>
      <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
        <CardHeader className="text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
            alt="עילם לוגו"
            className="w-16 h-16 mx-auto mb-2 rounded-full"
          />
          <CardTitle className="text-3xl font-bold text-gray-800 dark:!text-white">{t.login}</CardTitle>
          <CardDescription className="text-gray-600 dark:!text-white">{t.enterDetails}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                {t.email}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="israel@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                {t.password}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="data-[state=checked]:bg-purple-600 border-gray-400 dark:border-gray-500"
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-300">
                  {t.rememberMe}
                </Label>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              {t.loginButton}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.noAccount}{" "}
            <Link href="/register" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
              {t.registerHere}
            </Link>
          </p>
        </CardFooter>
      </Card>
      <style jsx global>{`
        body {
          direction: ${isRTL ? "rtl" : "ltr"};
        }
        html.${theme} {
          background-color: ${theme === "dark" ? "#111827" : "#f9fafb"};
        }
        /* Force better contrast for dark mode text */
        .dark label, .dark p {
          color: #e5e7eb !important;
        }
      `}</style>
    </div>
  )
}
