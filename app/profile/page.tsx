"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Edit3, Save, ShieldCheck } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

// Force dynamic rendering to prevent document access during SSR
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
    changePasswordButton: "שנה סיסמה",
    cancel: "ביטול",
    saveChanges: "שמור שינויים",
    editProfile: "ערוך פרופיל",
    saveSuccess: "פרטי המשתמש נשמרו בהצלחה",
    saveError: "אירעה שגיאה בשמירת הפרטים",
    loading: "טוען...",
    changePasswordSuccess: "הסיסמה שונתה בהצלחה",
    changePasswordError: "אירעה שגיאה בשינוי הסיסמה",
    passwordsDontMatch: "הסיסמאות אינן תואמות",
    currentPasswordRequired: "יש להזין את הסיסמה הנוכחית",
    newPasswordRequired: "יש להזין סיסמה חדשה",
    profileError: "אירעה שגיאה בטעינת פרטי המשתמש",
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
    changePasswordButton: "Change Password",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    editProfile: "Edit Profile",
    saveSuccess: "User details saved successfully",
    saveError: "An error occurred while saving",
    loading: "Loading...",
    changePasswordSuccess: "Password changed successfully",
    changePasswordError: "An error occurred while changing password",
    passwordsDontMatch: "Passwords don't match",
    currentPasswordRequired: "Current password is required",
    newPasswordRequired: "New password is required",
    profileError: "An error occurred while loading user profile",
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
    changePasswordButton: "تغيير كلمة المرور",
    cancel: "إلغاء",
    saveChanges: "حفظ التغييرات",
    editProfile: "تعديل الملف الشخصي",
    saveSuccess: "تم حفظ تفاصيل المستخدم بنجاح",
    saveError: "حدث خطأ أثناء الحفظ",
    loading: "جارٍ التحميل...",
    changePasswordSuccess: "تم تغيير كلمة المرور بنجاح",
    changePasswordError: "حدث خطأ أثناء تغيير كلمة المرور",
    passwordsDontMatch: "كلمات المرور غير متطابقة",
    currentPasswordRequired: "كلمة المرور الحالية مطلوبة",
    newPasswordRequired: "كلمة المرور الجديدة مطلوبة",
    profileError: "حدث خطأ أثناء تحميل الملف الشخصي",
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
    changePasswordButton: "Изменить пароль",
    cancel: "Отмена",
    saveChanges: "Сохранить изменения",
    editProfile: "Редактировать профиль",
    saveSuccess: "Данные пользователя успешно сохранены",
    saveError: "Произошла ошибка при сохранении",
    loading: "Загрузка...",
    changePasswordSuccess: "Пароль успешно изменен",
    changePasswordError: "Произошла ошибка при изменении пароля",
    passwordsDontMatch: "Пароли не совпадают",
    currentPasswordRequired: "Требуется текущий пароль",
    newPasswordRequired: "Требуется новый пароль",
    profileError: "Произошла ошибка при загрузке профиля пользователя",
  },
}

export default function UserProfilePage() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false)
  const [language, setLanguage] = useState("he")
  const [isRTL, setIsRTL] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
    setIsRTL(lang === "he" || lang === "ar")
  }, [])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)

      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setIsLoading(false)
          return
        }

        setUser(session.user)

        // קודם כל, נקבל את הנתונים העדכניים ביותר מ-Supabase Auth
        const { data: authUser } = await supabase.auth.getUser()

        if (!authUser?.user) {
          setIsLoading(false)
          return
        }

        // נשתמש בנתונים מה-metadata כברירת מחדל
        const userDataTemp = {
          firstName: authUser.user.user_metadata?.first_name || "",
          lastName: authUser.user.user_metadata?.last_name || "",
          email: authUser.user.email || "",
          phone: authUser.user.user_metadata?.phone || "",
        }

        console.log("Auth metadata in profile:", userDataTemp)

        // נסה לקבל נתונים מטבלת המשתמשים הציבורית
        try {
          const { data: publicUserData, error: publicError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (!publicError && publicUserData) {
            console.log("Public user data in profile:", publicUserData)
            userDataTemp.firstName = publicUserData.first_name || userDataTemp.firstName
            userDataTemp.lastName = publicUserData.last_name || userDataTemp.lastName
            userDataTemp.phone = publicUserData.phone || userDataTemp.phone
          }
        } catch (error) {
          console.error("Error fetching from public users table in profile:", error)
        }

        // נסה לקבל נתונים מפונקציית ה-RPC
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_profile", {
            user_id: session.user.id,
          })

          if (!rpcError && rpcData) {
            console.log("RPC user data in profile:", rpcData)
            userDataTemp.firstName = rpcData.first_name || userDataTemp.firstName
            userDataTemp.lastName = rpcData.last_name || userDataTemp.lastName
            userDataTemp.phone = rpcData.phone || userDataTemp.phone
          }
        } catch (error) {
          console.error("Error fetching user profile with RPC in profile:", error)
        }

        console.log("Final user data in profile:", userDataTemp)
        setUserData(userDataTemp)
      } catch (error) {
        console.error("Error in fetchUserData in profile:", error)
        toast({
          title: t.profileError,
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [supabase])

  const t = translations[language] || translations.he

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordInputChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // 1. Update user metadata in auth.users
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
        },
      })

      if (authError) throw authError

      // 2. נסה לעדכן את פרטי המשתמש באמצעות RPC
      try {
        const { error: rpcError } = await supabase.rpc("update_user_profile", {
          user_id: user.id,
          first_name_param: userData.firstName,
          last_name_param: userData.lastName,
          email_param: userData.email,
          phone_param: userData.phone,
        })

        if (rpcError) {
          console.error("RPC update failed in profile:", rpcError)
        }
      } catch (rpcError) {
        console.error("Error with RPC update in profile:", rpcError)
      }

      toast({
        title: t.saveSuccess,
      })

      setIsEditing(false)

      // שליחת אירוע עדכון נתוני משתמש
      if (typeof window !== "undefined" && window.userDataUpdateEvent) {
        console.log("Dispatching userDataUpdated event")
        window.userDataUpdateEvent.dispatchEvent(new Event("userDataUpdated"))
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: t.saveError,
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    // Validate passwords
    if (!passwordData.currentPassword) {
      toast({
        title: t.currentPasswordRequired,
        variant: "destructive",
      })
      return
    }

    if (!passwordData.newPassword) {
      toast({
        title: t.newPasswordRequired,
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast({
        title: t.passwordsDontMatch,
        variant: "destructive",
      })
      return
    }

    setIsChangingPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast({
        title: t.changePasswordSuccess,
      })

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      })
      setIsChangingPassword(false)
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: t.changePasswordError,
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsChangingPasswordLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="text-center">
          <Spinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    )
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
              {userData.firstName} {userData.lastName}
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
          <CardDescription className="text-gray-600 dark:text-gray-300">{userData.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
              {t.firstName}
            </Label>
            <Input
              id="firstName"
              value={userData.firstName}
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
              value={userData.lastName}
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
              value={userData.email}
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
              value={userData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={!isEditing}
              className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:opacity-70"
            />
          </div>

          {isEditing && (
            <div className="border-t pt-6 dark:border-gray-700">
              <Label className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <ShieldCheck /> {t.changePassword}
              </Label>
              {!isChangingPassword ? (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                  className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {t.changePasswordButton}
                </Button>
              ) : (
                <div className="mt-2 space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">
                      {t.currentPassword}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                      className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                      {t.newPassword}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                      className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword" className="text-gray-700 dark:text-gray-300">
                      {t.confirmNewPassword}
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => handlePasswordInputChange("confirmNewPassword", e.target.value)}
                      className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmNewPassword: "",
                        })
                      }}
                      disabled={isChangingPasswordLoading}
                      className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPasswordLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isChangingPasswordLoading ? (
                        <>
                          <Spinner size="small" className="mr-2" /> {t.changePasswordButton}
                        </>
                      ) : (
                        t.changePasswordButton
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={isSaving}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner size="small" className={isRTL ? "ml-2" : "mr-2"} /> {t.saveChanges}
                </>
              ) : (
                <>
                  <Save className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} /> {t.saveChanges}
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
