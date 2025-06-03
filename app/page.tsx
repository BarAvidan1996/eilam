"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sun, Moon, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ClientLayout from "./ClientLayout"

// Force dynamic rendering to avoid document is not defined error
export const dynamic = "force-dynamic"

// תרגומים בעברית בלבד
const translations = {
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

  // Validation states
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  // Set theme from localStorage on client-side - השפה תמיד עברית
  useEffect(() => {
    // הגדרת עברית כברירת מחדל
    document.documentElement.lang = "he"
    document.documentElement.dir = "rtl"

    const storedTheme = localStorage.getItem("eilam-theme") || "light"
    setTheme(storedTheme)

    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

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

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    }
    let isValid = true

    // Email validation
    if (!email) {
      newErrors.email = translations.emailRequired
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = translations.emailInvalid
      isValid = false
    }

    // Password validation
    if (!password) {
      newErrors.password = translations.passwordRequired
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = translations.passwordMinLength
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async (e) => {
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
          setLoginError(translations.errorInvalidCredentials)
          toast({
            title: translations.errorInvalidCredentials,
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
          setLoginError(translations.errorUserNotFound)
          toast({
            title: translations.errorUserNotFound,
            variant: "destructive",
          })
        } else {
          setLoginError(translations.errorGeneric)
          toast({
            title: translations.errorGeneric,
            description: error.message,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      if (data.session) {
        toast({
          title: translations.successLogin,
        })
        router.push("/dashboard")
      } else {
        setLoginError(translations.errorGeneric)
        toast({
          title: translations.errorGeneric,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error during login:", error)
      setLoginError(translations.errorGeneric)
      toast({
        title: translations.errorGeneric,
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

  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-[#005c72]/20 dark:from-gray-900 dark:to-[#005c72]/20 rtl">
        <div className="absolute top-4 right-4 flex gap-2">
          {/* הסרנו את כפתור בחירת השפה - רק כפתור theme נשאר */}
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
            <CardDescription className="text-gray-600 dark:!text-white">{translations.enterDetails}</CardDescription>
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
                  {translations.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={translations.emailPlaceholder}
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
                  {translations.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={translations.passwordPlaceholder}
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
                    {translations.rememberMe}
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
                    <Spinner size="small" className="mr-2" /> {translations.loginButtonLoading}
                  </>
                ) : (
                  translations.loginButton
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {translations.noAccount}{" "}
              <Link href="/register" className="font-medium text-[#005c72] hover:underline dark:text-[#d3e3fd]">
                {translations.registerHere}
              </Link>
            </p>
          </CardFooter>
        </Card>
        <style jsx global>{`
          body {
            direction: rtl;
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
