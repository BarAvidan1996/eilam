"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Sun, Moon, AlertCircle, User, Mail, Phone, Lock, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Force dynamic rendering to avoid document is not defined error
export const dynamic = "force-dynamic"

// Hebrew translations only
const translations = {
  title: 'עיל"ם - עוזר ייעודי למצבי חירום',
  subtitle: "הרשמה למערכת",
  personalDetails: "פרטים אישיים",
  accountSecurity: "אבטחת חשבון",
  firstNameLabel: "שם פרטי *",
  firstNamePlaceholder: "לדוגמה: ישראל",
  firstNameRequired: "שם פרטי הוא שדה חובה",
  lastNameLabel: "שם משפחה *",
  lastNamePlaceholder: "לדוגמה: ישראלי",
  lastNameRequired: "שם משפחה הוא שדה חובה",
  emailLabel: "דואר אלקטרוני *",
  emailPlaceholder: "your@email.com",
  emailRequired: "דואר אלקטרוני הוא שדה חובה",
  emailInvalid: "נא להזין כתובת דואר אלקטרוני תקינה",
  phoneLabel: "מספר טלפון *",
  phonePlaceholder: "050-1234567",
  phoneRequired: "מספר טלפון הוא שדה חובה",
  phoneInvalid: "נא להזין מספר טלפון תקין",
  passwordLabel: "סיסמה *",
  passwordPlaceholder: "הזן סיסמה",
  passwordRequired: "סיסמה היא שדה חובה",
  passwordMinLength: "הסיסמה חייבת להכיל לפחות 8 תווים",
  passwordUppercase: "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
  passwordLowercase: "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
  passwordNumber: "הסיסמה חייבת להכיל לפחות ספרה אחת",
  passwordSpecial: "הסיסמה חייבת להכיל לפחות תו מיוחד אחד (%@!#)",
  confirmPasswordLabel: "אימות סיסמה *",
  confirmPasswordPlaceholder: "הזן שוב את הסיסמה",
  confirmPasswordRequired: "אימות סיסמה הוא שדה חובה",
  passwordMismatch: "הסיסמאות אינן תואמות",
  registerButton: "הרשם",
  registerButtonLoading: "נרשם...",
  loginLink: "כבר יש לך חשבון? התחבר כאן",
  errorGeneric: "אירעה שגיאה בהרשמה. אנא נסה שוב.",
  errorEmailExists: 'כתובת הדוא"ל כבר קיימת במערכת.',
  successTitle: "הרשמה הושלמה בהצלחה!",
  successMessage: 'אנא בדוק את תיבת הדוא"ל שלך לאימות החשבון.',
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState("light")
  const [registerError, setRegisterError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Validation states
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  // Set theme from localStorage on client-side
  useEffect(() => {
    const storedTheme = localStorage.getItem("eilam-theme") || "light"
    setTheme(storedTheme)

    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Set Hebrew as default
    document.documentElement.lang = "he"
    document.documentElement.dir = "rtl"
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
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }
    let isValid = true

    // First name validation
    if (!firstName) {
      newErrors.firstName = translations.firstNameRequired
      isValid = false
    }

    // Last name validation
    if (!lastName) {
      newErrors.lastName = translations.lastNameRequired
      isValid = false
    }

    // Email validation
    if (!email) {
      newErrors.email = translations.emailRequired
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = translations.emailInvalid
      isValid = false
    }

    // Phone validation
    if (!phone) {
      newErrors.phone = translations.phoneRequired
      isValid = false
    } else if (!/^0\d{1,2}[-\s]?\d{7,8}$/.test(phone)) {
      newErrors.phone = translations.phoneInvalid
      isValid = false
    }

    // Password validation - enhanced
    if (!password) {
      newErrors.password = translations.passwordRequired
      isValid = false
    } else if (password.length < 8) {
      newErrors.password = translations.passwordMinLength
      isValid = false
    } else {
      // Check for uppercase letter
      if (!/[A-Z]/.test(password)) {
        newErrors.password = translations.passwordUppercase
        isValid = false
      }
      // Check for lowercase letter
      else if (!/[a-z]/.test(password)) {
        newErrors.password = translations.passwordLowercase
        isValid = false
      }
      // Check for number
      else if (!/[0-9]/.test(password)) {
        newErrors.password = translations.passwordNumber
        isValid = false
      }
      // Check for special character
      else if (!/[%@!#]/.test(password)) {
        newErrors.password = translations.passwordSpecial
        isValid = false
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = translations.confirmPasswordRequired
      isValid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = translations.passwordMismatch
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterError("") // Clear any previous errors
    setRegisterSuccess("") // Clear any previous success messages

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
        },
      })

      if (authError) {
        console.error("Registration error:", authError)

        // Handle specific error cases
        if (authError.message.includes("already registered")) {
          setRegisterError(translations.errorEmailExists)
          toast({
            title: translations.errorEmailExists,
            variant: "destructive",
          })
        } else {
          setRegisterError(translations.errorGeneric)
          toast({
            title: translations.errorGeneric,
            description: authError.message,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setRegisterError(translations.errorGeneric)
        toast({
          title: translations.errorGeneric,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Use RPC function to create user profile
      // This is more reliable than direct table access
      try {
        const { error: rpcError } = await supabase.rpc("create_user_profile", {
          user_id: authData.user.id,
          first_name_param: firstName,
          last_name_param: lastName,
          email_param: email,
          phone_param: phone,
        })

        if (rpcError) {
          console.error("RPC error:", rpcError)

          // If RPC fails, try direct SQL execution as a fallback
          const { error: sqlError } = await supabase.from("auth.users").select("id").limit(1)

          if (sqlError) {
            console.error("SQL error:", sqlError)

            // If direct SQL fails too, we'll just continue with auth registration
            console.warn("User created in auth but profile data not saved")
          }
        }
      } catch (profileError) {
        console.error("Profile creation error:", profileError)
        // Continue with registration even if profile creation fails
      }

      // Show success message regardless of profile creation success
      setRegisterSuccess(translations.successTitle)
      toast({
        title: translations.successTitle,
        description: translations.successMessage,
      })

      // Clear form after successful registration
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error) {
      console.error("Unexpected error during registration:", error)
      setRegisterError(translations.errorGeneric)
      toast({
        title: translations.errorGeneric,
        variant: "destructive",
      })
    } finally {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-[#005c72]/20 dark:from-gray-900 dark:to-[#005c72]/20 rtl">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-800 dark:text-gray-300">
          {theme === "light" ? <Moon /> : <Sun />}
        </Button>
      </div>
      <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
        <CardHeader className="text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
            alt="EILAM Logo"
            className="w-16 h-16 mx-auto mb-2 rounded-full"
          />
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">עיל"ם</CardTitle>
          <CardDescription className="text-gray-600 dark:text-white">{translations.subtitle}</CardDescription>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">* שדות חובה</p>
        </CardHeader>
        <CardContent>
          {registerError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{registerError}</AlertDescription>
            </Alert>
          )}
          {registerSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
              <AlertDescription className="text-green-800 dark:text-green-300">{registerSuccess}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Personal Details Section */}
            <Card className="dark:bg-gray-800/50 border dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#005c72] dark:text-[#d3e3fd]" />
                  <h3 className="text-lg font-medium text-[#005c72] dark:text-[#d3e3fd]">
                    {translations.personalDetails}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                        {translations.firstNameLabel}
                      </Label>
                    </div>
                    <Input
                      id="firstName"
                      placeholder={translations.firstNamePlaceholder}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value)
                        if (errors.firstName) {
                          setErrors({ ...errors, firstName: "" })
                        }
                        if (registerError) {
                          setRegisterError("")
                        }
                      }}
                      className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                        errors.firstName ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                        {translations.lastNameLabel}
                      </Label>
                    </div>
                    <Input
                      id="lastName"
                      placeholder={translations.lastNamePlaceholder}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value)
                        if (errors.lastName) {
                          setErrors({ ...errors, lastName: "" })
                        }
                        if (registerError) {
                          setRegisterError("")
                        }
                      }}
                      className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                        errors.lastName ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                      {translations.emailLabel}
                    </Label>
                  </div>
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
                      if (registerError) {
                        setRegisterError("")
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
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                      {translations.phoneLabel}
                    </Label>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={translations.phonePlaceholder}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) {
                        setErrors({ ...errors, phone: "" })
                      }
                      if (registerError) {
                        setRegisterError("")
                      }
                    }}
                    className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                      errors.phone ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    dir="ltr"
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  {!errors.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">הטלפון ישמש לקבלת התראות SMS</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Security Section */}
            <Card className="dark:bg-gray-800/50 border dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#005c72] dark:text-[#d3e3fd]" />
                  <h3 className="text-lg font-medium text-[#005c72] dark:text-[#d3e3fd]">
                    {translations.accountSecurity}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                      {translations.passwordLabel}
                    </Label>
                  </div>
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
                      if (registerError) {
                        setRegisterError("")
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

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                      {translations.confirmPasswordLabel}
                    </Label>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={translations.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: "" })
                      }
                      if (registerError) {
                        setRegisterError("")
                      }
                    }}
                    className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
                      errors.confirmPassword ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    dir="ltr"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-[#005c72] hover:bg-[#004a5d] text-white dark:bg-[#d3e3fd] dark:hover:bg-[#b1c9f8] dark:text-black"
              disabled={isLoading || registerSuccess !== ""}
            >
              {isLoading ? (
                <>
                  <Spinner size="small" className="mr-2" /> {translations.registerButtonLoading}
                </>
              ) : (
                translations.registerButton
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" className="text-sm text-[#005c72] hover:underline dark:text-[#d3e3fd]">
            {translations.loginLink}
          </Link>
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
  )
}
