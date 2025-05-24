import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// תשובות מוכנות מראש לבדיקה
const predefinedAnswers: Record<string, string> = {
  היי: "שלום! איך אני יכול לעזור לך היום?",
  שלום: "שלום! אני כאן לעזור לך עם שאלות חירום. מה תרצה לדעת?",
  "מה לעשות כשנשמעת אזעקה":
    "כשנשמעת אזעקה:\n1. הפסק מיד את הפעילות\n2. היכנס למקלט או לחדר מוגן\n3. סגור דלתות וחלונות\n4. המתן 10 דקות לפחות\n5. הקשב להוראות פיקוד העורף",
  אזעקה:
    "בזמן אזעקה:\n• היכנס מיד למקלט הקרוב ביותר\n• אם אין מקלט - היכנס לחדר הכי פנימי בבית\n• הרחק מחלונות וקירות חיצוניים\n• שכב על הרצפה וכסה את הראש\n• המתן 10 דקות לפחות אחרי סיום האזעקה",
  מקלט: "אם אין מקלט קרוב:\n• היכנס לחדר הכי פנימי בבניין\n• הרחק מחלונות, מרפסות וקירות חיצוניים\n• שכב על הרצפה\n• כסה את הראש בידיים\n• המתן להוראות נוספות מפיקוד העורף",
}

// פונקציה לחיפוש תשובה
function findAnswer(question: string): string {
  const lowerQuestion = question.toLowerCase()

  // חיפוש מדויק
  for (const [key, answer] of Object.entries(predefinedAnswers)) {
    if (lowerQuestion.includes(key.toLowerCase())) {
      return answer
    }
  }

  // תשובת ברירת מחדל
  return "מצטער, אני עדיין לומד. אנא נסה לשאול שאלה ספציפית יותר על נושאי חירום כמו אזעקות, מקלטים, או הוראות בטיחות."
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
