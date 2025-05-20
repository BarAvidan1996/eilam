"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Edit3, Save, ShieldCheck } from "lucide-react"

// Force dynamic rendering to prevent document is not defined error
export const dynamic = "force-dynamic"

// תרגומים לפי שפה
const translations = {
  he: {
    profileTitle: "פרופיל אישי",
    profileDesc: "נהל את פרטי החשבון והעדפותיך.",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    email: "דואר אלקטרוני",
    phone: "מספר טלפון",
    changePassword: "שינוי סיסמה",
    currentPassword: "סיסמה נוכחית",
    newPassword: "סיסמה חדשה",
    confirmNewPassword: "אימות סיסמה חדשה",
    changePasswordButton: "שנה סיסמה (לא פעיל)",
    cancel: "ביטול",
    saveChanges: "שמור שינויים",
    editProfile: "ערוך פרופיל",
    saveAlert: "שמירת פרטי משתמש תמומש בהמשך.",
  },
  en: {
    profileTitle: "Personal Profile",
    profileDesc: "Manage your account details and preferences.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone Number",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePasswordButton: "Change Password (Inactive)",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    editProfile: "Edit Profile",
    saveAlert: "Saving user details will be implemented later.",
  },
  ar: {
    profileTitle: "الملف الشخصي",
    profileDesc: "إدارة تفاصيل حسابك وتفضيلاتك.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    changePassword: "تغيير كلمة المرور",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmNewPassword: "تأكيد كلمة المرور الجديدة",
    changePasswordButton: "تغيير كلمة المرور (غير نشط)",
    cancel: "إلغاء",
    saveChanges: "حفظ التغييرات",
    editProfile: "تعديل الملف الشخصي",
    saveAlert: "سيتم تنفيذ حفظ تفاصيل المستخدم لاحقًا.",
  },
  ru: {
    profileTitle: "Личный профиль",
    profileDesc: "Управляйте данными вашей учетной записи и предпочтениями.",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Электронная почта",
    phone: "Номер телефона",
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmNewPassword: "Подтвердите новый пароль",
    changePasswordButton: "Изменить пароль (Неактивно)",
    cancel: "Отмена",
    saveChanges: "Сохранить изменения",
    editProfile: "Редактировать профиль",
    saveAlert: "Сохранение данных пользователя будет реализовано позже.",
  },
}

// Temporary user data (replace with actual data from Supabase later)
const initialUserData = {
  firstName: "ישראל",
  lastName: "ישראלי",
  email: "israel.israeli@example.com",
  phone: "050-1234567",
}

export default function UserProfilePage() {
  const [user, setUser] = useState(initialUserData)
  const [isEditing, setIsEditing] = useState(false)
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
    setIsRTL(lang === "he" || lang === "ar")
  }, [])

  const t = translations[language] || translations.he

  const handleInputChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // Save logic will be added later using Supabase
    console.log("Saving user data:", user)
    alert(t.saveAlert)
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <User /> {t.profileTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{t.profileDesc}</p>
      </header>

      <Card className="shadow-lg dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-gray-800 dark:text-white">
              {user.firstName} {user.lastName}
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Edit3 className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} /> {t.editProfile}
              </Button>
            )}
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-300">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
              {t.firstName}
            </Label>
            <Input
              id="firstName"
              value={user.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              disabled={!isEditing}
              className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-70"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
              {t.lastName}
            </Label>
            <Input
              id="lastName"
              value={user.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              disabled={!isEditing}
              className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-70"
            />
          </div>
          <div>
            <Label htmlFor="emailProf" className="text-gray-700 dark:text-gray-300">
              {t.email}
            </Label>
            <Input
              id="emailProf"
              type="email"
              value={user.email}
              disabled
              className="dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 opacity-70 cursor-not-allowed"
            />
          </div>
          <div>
            <Label htmlFor="phoneProf" className="text-gray-700 dark:text-gray-300">
              {t.phone}
            </Label>
            <Input
              id="phoneProf"
              type="tel"
              value={user.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={!isEditing}
              className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-70"
            />
          </div>

          {isEditing && (
            <div className="border-t pt-6 dark:border-gray-700">
              <Label className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <ShieldCheck /> {t.changePassword}
              </Label>
              <div className="mt-2 space-y-4">
                <Input
                  type="password"
                  placeholder={t.currentPassword}
                  disabled
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-50"
                />
                <Input
                  type="password"
                  placeholder={t.newPassword}
                  disabled
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-50"
                />
                <Input
                  type="password"
                  placeholder={t.confirmNewPassword}
                  disabled
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-50"
                />
                <Button
                  variant="outline"
                  disabled
                  className="dark:text-gray-300 dark:border-gray-600 disabled:opacity-50"
                >
                  {t.changePasswordButton}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setUser(initialUserData)
              }}
              className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Save className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} /> {t.saveChanges}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
