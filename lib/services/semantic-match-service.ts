// שירות להתאמה סמנטית בין מילות מפתח לשמות פריטים
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfmxtaefgvjbuipcdcya.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.Rl-QQhQxQXTzgJLQYQKRGJDEQQDcnrJCBj0aCxRKAXs"

// Create a singleton Supabase client
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// פונקציה לחישוב מרחק לוינשטיין (דומה ל-fuzzywuzzy בפייתון)
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// פונקציה לחישוב יחס דמיון (דומה ל-partial_ratio בפייתון)
function partialRatio(s1: string, s2: string): number {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  if (s1 === s2) return 100
  if (s1.length === 0 || s2.length === 0) return 0

  // אם s2 ארוך יותר, נחליף ביניהם
  if (s1.length > s2.length) {
    const temp = s1
    s1 = s2
    s2 = temp
  }

  // נחפש את המיקום הטוב ביותר של s1 בתוך s2
  let bestScore = 0
  for (let i = 0; i <= s2.length - s1.length; i++) {
    const substring = s2.substring(i, i + s1.length)
    const distance = levenshteinDistance(s1, substring)
    const score = ((s1.length - distance) / s1.length) * 100
    if (score > bestScore) {
      bestScore = score
    }
  }

  return Math.round(bestScore)
}

export const SemanticMatchService = {
  // פונקציה לבדיקת התאמה סמנטית בין מילת מפתח לשם פריט
  async isSemanticMatch(keyword: string, itemName: string, lang = "he"): Promise<boolean> {
    keyword = keyword.trim().toLowerCase()
    itemName = itemName.trim().toLowerCase()

    // התאמה מילולית רגילה
    if (itemName.includes(keyword)) {
      return true
    }

    // התאמה FUZZY (מרחק לוינשטיין)
    if (partialRatio(keyword, itemName) > 80) {
      return true
    }

    // התאמה סמנטית עם OpenAI (יקר, נשתמש רק אם לא זוהתה התאמה אחרת)
    try {
      const supabase = createSupabaseClient()

      // בדיקה אם יש כבר תוצאה במטמון
      const { data: cachedResult } = await supabase
        .from("semantic_matches_cache")
        .select("is_match")
        .eq("keyword", keyword)
        .eq("item_name", itemName)
        .single()

      if (cachedResult) {
        return cachedResult.is_match
      }

      // אם אין תוצאה במטמון, נשאל את OpenAI
      const response = await fetch("/api/semantic-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, itemName, lang }),
      })

      if (response.ok) {
        const data = await response.json()

        // שמירת התוצאה במטמון לשימוש עתידי
        await supabase.from("semantic_matches_cache").insert({
          keyword,
          item_name: itemName,
          is_match: data.isMatch,
          created_at: new Date().toISOString(),
        })

        return data.isMatch
      }

      return false
    } catch (error) {
      console.error("Error checking semantic match:", error)
      return false
    }
  },

  // פונקציה לחיפוש פריטים דומים ברשימה
  findSimilarItems(keyword: string, items: any[]): any[] {
    keyword = keyword.trim().toLowerCase()

    return items.filter((item) => {
      const itemName = item.name.toLowerCase()

      // התאמה מילולית רגילה
      if (itemName.includes(keyword)) {
        return true
      }

      // התאמה FUZZY (מרחק לוינשטיין)
      return partialRatio(keyword, itemName) > 80
    })
  },
}
