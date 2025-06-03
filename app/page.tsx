"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sun, Moon, Globe, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ClientLayout from "./ClientLayout"
import { useLanguage } from "@/contexts/language-context"

// Force dynamic rendering to avoid document is not defined error
export const dynamic = "force-dynamic"

// תרגומים לפי שפה
const translations = {
  he: {
    login: "התחברות",
    enterDetails: "הזן את פרטיך כדי להמשיך",
    email: "דואר אלקטרוני *",
    emailPlaceholder: "your@email.com",
    emailRequired: "דואר אלקטרוני הוא שדה חובה",
    emailInvalid: "נא להזין כתובת דואר אלקטרוני תקינה",
    password: "סיסמה *",
    passwordPlaceholder: "הזן את הסיסמה שלך",
    passwordRequired: "סיסמה היא שדה חובה",
    passwordMinLength: "הסיסמה חייבת להכיל לפחות 6 תווים",
    rememberMe: "זכור אותי",
    loginButton: "התחבר",
    loginButtonLoading: "מתחבר...",
    noAccount: "אין לך חשבון?",
    registerHere: "הרשם כאן",
    errorInvalidCredentials: "דואר אלקטרוני או סיסמה שגויים",
    errorUserNotFound: "משתמש לא נמצא. בדוק את פרטי ההתחברות או הירשם",
    errorGeneric: "אירעה שגיאה בהתחברות. אנא נסה שוב.",
    successLogin: "התחברת בהצלחה!",
    language: "שפה",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  en: {
    login: "Login",
    enterDetails: "Enter your details to continue",
    email: "Email *",
    emailPlaceholder: "your@email.com",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    password: "Password *",
    passwordPlaceholder: "Enter your password",
    passwordRequired: "Password is required",
    passwordMinLength: "Password must be at least 6 characters",
    rememberMe: "Remember me",
    loginButton: "Login",
    loginButtonLoading: "Logging in...",
    noAccount: "Don't have an account?",
    registerHere: "Register here",
    errorInvalidCredentials: "Invalid email or password",
    errorUserNotFound: "User not found. Check your credentials or register",
    errorGeneric: "An error occurred during login. Please try again.",
    successLogin: "You have successfully logged in!",
    language: "Language",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  ar: {
    login: "تسجيل الدخول",
    enterDetails: "أدخل بياناتك للمتابعة",
    email: "البريد الإلكتروني *",
    emailPlaceholder: "your@email.com",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "يرجى إدخال عنوان بريد إلكتروني صالح",
    password: "كلمة المرور *",
    passwordPlaceholder: "أدخل كلمة المرور الخاصة بك",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMinLength: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
    rememberMe: "تذكرني",
    loginButton: "تسجيل الدخول",
    loginButtonLoading: "جاري تسجيل الدخول...",
    noAccount: "ليس لديك حساب؟",
    registerHere: "سجل هنا",
    errorInvalidCredentials: "بريد إلكتروني أو كلمة مرور غير صالحة",
    errorUserNotFound: "المستخدم غير موجود. تحقق من بيانات الاعتماد الخاصة بك أو قم بالتسجيل",
    errorGeneric: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
    successLogin: "لقد قمت بتسجيل الدخول بنجاح!",
    language: "لغة",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
  ru: {
    login: "Вход",
    enterDetails: "Введите свои данные для продолжения",
    email: "Электронная почта *",
    emailPlaceholder: "your@email.com",
    emailRequired: "Электронная почта обязательна",
    emailInvalid: "Пожалуйста, введите действительный адрес электронной почты",
    password: "Пароль *",
    passwordPlaceholder: "Введите ваш пароль",
    passwordRequired: "Пароль обязателен",
    passwordMinLength: "Пароль должен содержать не менее 6 символов",
    rememberMe: "Запомнить меня",
    loginButton: "Войти",
    loginButtonLoading: "Вход...",
    noAccount: "Нет аккаунта?",
    registerHere: "Зарегистрироваться здесь",
    errorInvalidCredentials: "Неверная электронная почта или пароль",
    errorUserNotFound: "Пользователь не найден. Проверьте свои учетные данные или зарегистрируйтесь",
    errorGeneric: "Произошла ошибка при входе. Пожалуйста, попробуйте снова.",
    successLogin: "Вы успешно вошли в систему!",
    language: "Язык",
    languages: {
      he: "עברית",
      en: "English",
      ar: "العربية",
      ru: "Русский",
    },
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState("light")
  const [loginError, setLoginError] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { language, setLanguage, isRTL } = useLanguage()

  // Validation states
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  // Set language and theme from localStorage on client-side
  useEffect(() => {
    const storedLang = localStorage.getItem("eilam-language") || "he"
    if (["he", "en", "ar", "ru"].includes(storedLang)) {
      setLanguage(storedLang as any)
    }

    const storedTheme = localStorage.getItem("eilam-theme") || "light"
    setTheme(storedTheme)

    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [setLanguage])

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push("/dashboard")
      }
    }

    checkSession()
  }, [router, supabase.auth])

  const t = translations[language] || translations.he

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    }
    let isValid = true

    // Email validation
    if (!email) {
      newErrors.email = t.emailRequired
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t.emailInvalid
      isValid = false
    }

    // Password validation
    if (!password) {
      newErrors.password = t.passwordRequired
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = t.passwordMinLength
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("") // Clear any previous errors

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)

        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          setLoginError(t.errorInvalidCredentials)
          toast({
            title: t.errorInvalidCredentials,
            variant: "destructive",
          })
        } else if (error.message.includes("Email not confirmed")) {
          setLoginError("אנא אשר את כתובת האימייל שלך לפני ההתחברות")
          toast({
            title: "אנא אשר את כתובת האימייל שלך",
            description: "בדוק את תיבת הדואר שלך לקבלת הוראות אימות",
            variant: "destructive",
          })
        } else if (error.message.includes("User not found")) {
          setLoginError(t.errorUserNotFound)
          toast({
            title: t.errorUserNotFound,
            variant: "destructive",
          })
        } else {
          setLoginError(t.errorGeneric)
          toast({
            title: t.errorGeneric,
            description: error.message,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      if (data.session) {
        toast({
          title: t.successLogin,
        })
        router.push("/dashboard")
      } else {
        setLoginError(t.errorGeneric)
        toast({
          title: t.errorGeneric,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error during login:", error)
      setLoginError(t.errorGeneric)
      toast({
        title: t.errorGeneric,
        variant: "destructive",
      })
      setIsLoading(false)
    }
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

  const changeLanguage = (newLang: string) => {
    if (["he", "en", "ar", "ru"].includes(newLang)) {
      setLanguage(newLang as any)
    }
  }

  return (
    <ClientLayout>
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-[#005c72]/20 dark:from-gray-900 dark:to-[#005c72]/20 ${theme} ${isRTL ? "rtl" : ""}`}
      >
        <div className="absolute top-4 right-4 flex gap-2">
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
                  className={`cursor-pointer dark:hover:bg-gray-700 dark:text-gray-200 ${
                    language === langKey ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
                  }`}
                >
                  {t.languages[langKey as keyof typeof t.languages]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-800 dark:text-gray-300">
            {theme === "light" ? <Moon /> : <Sun />}
          </Button>
        </div>
        <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
          <CardHeader className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
              alt="עילם לוגו"
              className="w-16 h-16 mx-auto mb-2 rounded-full"
            />
            <CardTitle className="text-3xl font-bold text-gray-800 dark:!text-white">עיל"ם</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">* שדות חובה</p>
            <CardDescription className="text-gray-600 dark:!text-white">{t.enterDetails}</CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  {t.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors({ ...errors, email: "" })
                    }
                    if (loginError) {
                      setLoginError("")
                    }
                  }}
                  className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                    errors.email ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  dir="ltr"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  {t.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors({ ...errors, password: "" })
                    }
                    if (loginError) {
                      setLoginError("")
                    }
                  }}
                  className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                    errors.password ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  dir="ltr"
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                {!errors.password && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    הסיסמה צריכה לכלול לפחות 8 תווים, אות גדולה, אות קטנה, מספר ותו מיוחד (%@!#).
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="data-[state=checked]:bg-[#005c72] border-gray-400 dark:border-gray-500"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-300">
                    {t.rememberMe}
                  </Label>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#005c72] hover:bg-[#004a5d] text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b1c9f8] dark:text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="small" className="mr-2" /> {t.loginButtonLoading}
                  </>
                ) : (
                  t.loginButton
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t.noAccount}{" "}
              <Link href="/register" className="font-medium text-[#005c72] hover:underline dark:text-[#d3e3fd]">
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
    </ClientLayout>
  )
}
