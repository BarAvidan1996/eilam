"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sun, Moon, UserCircle, ShieldCheck, Phone, Mail, User, KeyRound } from "lucide-react"

// תרגומים בעברית בלבד
const translations = {
  register: "הרשמה",
  createAccount: "צור חשבון חדש כדי להתחיל",
  firstName: "שם פרטי *",
  lastName: "שם משפחה *",
  email: "דואר אלקטרוני *",
  phone: "מספר טלפון *",
  phoneDesc: "הטלפון ישמש לקבלת התראות SMS",
  phoneExample: "דוגמה: 050-1234567",
  password: "סיסמה *",
  passwordRequirements: "הסיסמה צריכה לכלול לפחות 8 תווים, אות גדולה, אות קטנה, מספר ותו מיוחד (%@!#).",
  confirmPassword: "אימות סיסמה *",
  registerButton: "הרשמה",
  haveAccount: "כבר יש לך חשבון?",
  loginHere: "התחבר כאן",
  passwordMismatch: "הסיסמאות אינן תואמות",
  registerInProgress: "הרשמה תמומש בהמשך עם Supabase. כעת מועבר לדף הבית.",
  requiredFieldsNote: "* שדות חובה",
  personalDetails: "פרטים אישיים",
  accountSecurity: "אבטחת חשבון",
}

export default function UserRegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [theme, setTheme] = useState("light")

  // קיבוע השפה לעברית
  const t = translations
  const isRTL = true

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert(t.passwordMismatch)
      return
    }
    console.log("Registration attempt:", { firstName, lastName, email, phone, password })
    alert(t.registerInProgress)
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
      className={`min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 ${theme} rtl`}
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
      <Card className="w-full max-w-lg shadow-xl dark:bg-gray-800">
        <CardHeader className="text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
            alt="עילם לוגו"
            className="w-16 h-16 mx-auto mb-2 rounded-full"
          />
          <CardTitle className="text-3xl font-bold text-gray-800 dark:!text-white">{t.register}</CardTitle>
          <CardDescription className="text-gray-600 dark:!text-white">{t.createAccount}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t.requiredFieldsNote}</div>

            <fieldset className="border rounded-lg p-4 dark:border-gray-700">
              <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" /> {t.personalDetails}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.firstName}
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.lastName}
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="emailReg" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.email}
                </Label>
                <Input
                  id="emailReg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.phone}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phoneExample}
                  required
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.phoneDesc}</p>
              </div>
            </fieldset>

            <fieldset className="border rounded-lg p-4 dark:border-gray-700">
              <legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" /> {t.accountSecurity}
              </legend>
              <div className="space-y-2">
                <Label htmlFor="passwordReg" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <KeyRound className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.password}
                </Label>
                <Input
                  id="passwordReg"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.passwordRequirements}</p>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <KeyRound className="h-4 w-4 text-gray-600 dark:text-gray-400" /> {t.confirmPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                />
              </div>
            </fieldset>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              {t.registerButton}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.haveAccount}{" "}
            <Link href="/login" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
              {t.loginHere}
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
  )
}
