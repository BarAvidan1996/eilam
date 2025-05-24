import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// תשובות מוכנות מראש עם מפתחות מדויקים יותר
const predefinedAnswers: Record<string, string> = {
  // ברכות
  היי: "שלום! איך אני יכול לעזור לך היום?",
  שלום: "שלום! אני כאן לעזור לך עם שאלות חירום. מה תרצה לדעת?",

  // שאלות על מקלטים וממ"דים
  "הבדל בין מקלט ציבורי לממד": `ההבדלים העיקריים בין מקלט ציבורי לממ"ד:

**מקלט ציבורי:**
• נמצא בבניינים ציבוריים או בשטחים פתוחים
• משרת אוכלוסייה רחבה מהאזור
• בדרך כלל גדול יותר
• מנוהל על ידי הרשות המקומית

**ממ"ד (מרחב מוגן דירתי):**
• נמצא בתוך הדירה או הבית
• משרת את תושבי הדירה בלבד
• קטן יותר ואישי
• מנוהל על ידי בעלי הדירה`,

  "בעלי חיים במקלט": `לגבי בעלי חיים במקלט:

**כלל כללי:** מותר להכניס בעלי חיים קטנים למקלט (כלבים, חתולים)

**הוראות:**
• החזק את בעל החיים ברצועה או בכלוב
• הבא מזון ומים לבעל החיים
• שמור על שקט - אל תיתן לבעל החיים לנבוח או לעשות רעש
• במקלט ציבורי - בדוק עם האחראי על המקלט
• בממ"ד - החלטה של בעלי הדירה`,

  // שאלות על אזעקות
  "מה לעשות כשנשמעת אזעקה": `כשנשמעת אזעקה:
1. הפסק מיד את הפעילות
2. היכנס למקלט או לחדר מוגן
3. סגור דלתות וחלונות
4. המתן 10 דקות לפחות
5. הקשב להוראות פיקוד העורף`,

  "אזעקה ואין מקלט": `אם אין מקלט קרוב:
• היכנס לחדר הכי פנימי בבניין
• הרחק מחלונות, מרפסות וקירות חיצוניים
• שכב על הרצפה
• כסה את הראש בידיים
• המתן להוראות נוספות מפיקוד העורף`,

  // שאלות כלליות
  "זמן המתנה במקלט": `זמני המתנה במקלט:
• אזעקה רגילה: 10 דקות לפחות
• התקפה כימית: עד שיגיעו הוראות מפיקוד העורף
• רעידת אדמה: עד שהרעידות נפסקות לחלוטין
• תמיד הקשב לעדכונים ברדיו או באפליקציית פיקוד העורף`,
}

// פונקציה משופרת לחיפוש תשובה
function findAnswer(question: string): string {
  const lowerQuestion = question.toLowerCase().trim()

  // חיפוש מדויק לפי מילות מפתח ספציפיות
  if (lowerQuestion.includes("הבדל") && lowerQuestion.includes("מקלט") && lowerQuestion.includes("ממד")) {
    return predefinedAnswers["הבדל בין מקלט ציבורי לממד"]
  }

  if (lowerQuestion.includes("בעלי חיים") && lowerQuestion.includes("מקלט")) {
    return predefinedAnswers["בעלי חיים במקלט"]
  }

  if (lowerQuestion.includes("אזעקה") && lowerQuestion.includes("אין מקלט")) {
    return predefinedAnswers["אזעקה ואין מקלט"]
  }

  if (lowerQuestion.includes("זמן") && (lowerQuestion.includes("מקלט") || lowerQuestion.includes("המתנה"))) {
    return predefinedAnswers["זמן המתנה במקלט"]
  }

  if (lowerQuestion.includes("אזעקה") && !lowerQuestion.includes("אין מקלט")) {
    return predefinedAnswers["מה לעשות כשנשמעת אזעקה"]
  }

  // ברכות פשוטות
  if (lowerQuestion === "היי" || lowerQuestion === "שלום") {
    return predefinedAnswers[lowerQuestion]
  }

  // תשובת ברירת מחדל
  return `מצטער, אני עדיין לומד ולא מכיר תשובה מדויקת לשאלה זו. 

אני יכול לעזור עם:
• הבדלים בין מקלט ציבורי לממ"ד
• הוראות בזמן אזעקה
• בעלי חיים במקלטים
• זמני המתנה במקלט
• הוראות בטיחות כלליות

אנא נסח את השאלה בצורה ספציפית יותר.`
}

export async function POST(request: NextRequest) {
  try {
    console.log("Chat API called")

    const body = await request.json()
    const { question, sessionId, userId } = body

    console.log("Received question:", question)

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // יצירת תשובה
    const answer = findAnswer(question)
    console.log("Generated answer:", answer)

    let currentSessionId = sessionId

    // יצירת סשן חדש אם לא קיים ויש משתמש
    if (!currentSessionId && userId) {
      try {
        const { data: newSession, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: question.substring(0, 50) + (question.length > 50 ? "..." : ""),
          })
          .select("id")
          .single()

        if (!sessionError && newSession) {
          currentSessionId = newSession.id
          console.log("Created new session:", currentSessionId)
        } else {
          console.log("Session creation error:", sessionError)
        }
      } catch (sessionErr) {
        console.error("Error creating session:", sessionErr)
      }
    }

    // שמירת ההודעות במסד הנתונים
    if (currentSessionId) {
      try {
        // שמירת שאלת המשתמש
        const { error: userMsgError } = await supabase.from("chat_messages").insert({
          session_id: currentSessionId,
          role: "user",
          content: question,
        })

        if (userMsgError) {
          console.log("User message save error:", userMsgError)
        }

        // שמירת תשובת הבוט
        const { error: botMsgError } = await supabase.from("chat_messages").insert({
          session_id: currentSessionId,
          role: "assistant",
          content: answer,
        })

        if (botMsgError) {
          console.log("Bot message save error:", botMsgError)
        }
      } catch (dbErr) {
        console.error("Error saving messages:", dbErr)
      }
    }

    return NextResponse.json({
      answer,
      sources: ["פיקוד העורף"],
      method: "predefined",
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        answer: "מצטער, אירעה שגיאה בשרת. אנא נסה שוב.",
        sources: [],
        method: "error",
      },
      { status: 500 },
    )
  }
}
