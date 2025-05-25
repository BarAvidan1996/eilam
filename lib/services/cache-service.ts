import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type Source = {
  title: string
  file_name: string
  storage_path: string
  similarity: number
  sourceType: "official" | "web" | "ai_generated"
}

export class CacheService {
  /**
   * מנסה להביא תשובה מה־Cache לפי שאלה ושפה
   */
  static async getCachedAnswer(question: string, language: "he" | "en") {
    try {
      console.log(`🔍 מחפש בcache עבור: "${question}" (${language})`)

      const { data, error } = await supabase
        .from("cached_answers")
        .select("*")
        .eq("question", question)
        .eq("language", language)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("❌ שגיאה בשליפת Cache:", error)
        return null
      }

      if (data) {
        console.log("📦 תשובה נשלפה מה־Cache - חיסכון בעלויות!")
        return {
          answer: data.answer,
          sources: data.sources || [],
        }
      }

      console.log("🔍 לא נמצא בcache, ממשיך לעיבוד רגיל")
      return null
    } catch (err) {
      console.error("❌ שגיאה כללית בשליפת Cache:", err)
      return null
    }
  }

  /**
   * שומר תשובה חדשה ב־Cache
   */
  static async saveAnswerToCache(question: string, language: "he" | "en", answer: string, sources: Source[]) {
    try {
      console.log(`💾 שומר תשובה בcache עבור: "${question}" (${language})`)

      const { error } = await supabase.from("cached_answers").insert({
        question,
        language,
        answer,
        sources,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("❌ שגיאה בשמירת Cache:", error)
      } else {
        console.log("✅ תשובה נשמרה ב־Cache לשימוש עתידי")
      }
    } catch (err) {
      console.error("❌ שגיאה כללית בשמירת Cache:", err)
    }
  }

  /**
   * מנקה cache ישן (אופציונלי - לניהול מקום)
   */
  static async cleanOldCache(daysOld = 30) {
    try {
      console.log(`🧹 מנקה cache ישן מעל ${daysOld} ימים`)

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase.from("cached_answers").delete().lt("created_at", cutoffDate.toISOString())

      if (error) {
        console.error("❌ שגיאה בניקוי Cache:", error)
      } else {
        console.log("✅ Cache ישן נוקה בהצלחה")
      }
    } catch (err) {
      console.error("❌ שגיאה כללית בניקוי Cache:", err)
    }
  }

  /**
   * סטטיסטיקות cache
   */
  static async getCacheStats() {
    try {
      const { data, error } = await supabase.from("cached_answers").select("language, created_at")

      if (error) {
        console.error("❌ שגיאה בקבלת סטטיסטיקות Cache:", error)
        return null
      }

      const stats = {
        total: data?.length || 0,
        hebrew: data?.filter((item) => item.language === "he").length || 0,
        english: data?.filter((item) => item.language === "en").length || 0,
        lastWeek:
          data?.filter((item) => {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return new Date(item.created_at) > weekAgo
          }).length || 0,
      }

      console.log("📊 Cache Stats:", stats)
      return stats
    } catch (err) {
      console.error("❌ שגיאה בקבלת סטטיסטיקות Cache:", err)
      return null
    }
  }
}
