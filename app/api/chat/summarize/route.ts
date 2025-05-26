import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 API summarize - התחלה")

    const { messages } = await request.json()

    if (!messages || messages.length === 0) {
      console.log("❌ אין הודעות")
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    console.log("📨 מעבד", messages.length, "הודעות ליצירת תקציר")

    // יצירת טקסט שיחה
    const conversationText = messages
      .map((msg: any) => `${msg.role === "user" ? "משתמש" : 'עיל"ם'}: ${msg.content}`)
      .join("\n")

    console.log("📝 טקסט שיחה:", conversationText.substring(0, 200) + "...")

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `אתה עוזר שיוצר תקצירים מפורטים לשיחות צ'אט עם עיל"ם - עוזר החירום הישראלי. 
          צור תקציר מפורט בעברית של 2-3 משפטים (עד 200 תווים) שמתאר את הנושאים המרכזיים של השיחה ואת העזרה שניתנה.
          התקציר צריך להיות מועיל למשתמש להבין במהירות על מה הייתה השיחה.
          דוגמאות טובות: "המשתמש שאל על הכנת ערכת חירום לבית. ניתנו הנחיות מפורטות על פריטים חיוניים כמו מים, מזון ותרופות לשבוע.", "נדונו הנחיות בטיחות לרעידת אדמה, כולל מקומות מחסה בבית ופעולות מיידיות בזמן הרעידה."`,
        },
        {
          role: "user",
          content: `צור תקציר מפורט לשיחה הבאה:\n\n${conversationText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    })

    const summary = response.choices[0]?.message?.content || "תקציר לא זמין"

    console.log("✅ תקציר נוצר:", summary)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("❌ שגיאה ביצירת תקציר:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
