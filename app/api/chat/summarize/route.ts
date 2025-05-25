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

    console.log("📨 מעבד", messages.length, "הודעות")

    // יצירת תקציר מההודעות
    const conversationText = messages
      .map((msg: any) => `${msg.role === "user" ? "משתמש" : 'עיל"ם'}: ${msg.content}`)
      .join("\n")

    console.log("📝 טקסט שיחה:", conversationText.substring(0, 200) + "...")

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `אתה עוזר שיוצר כותרות קצרות ותמציתיות לשיחות צ'אט עם עיל"ם - עוזר החירום הישראלי. 
          צור כותרת בעברית של עד 50 תווים שמתארת את הנושא המרכזי של השיחה.
          הכותרת צריכה להיות ברורה ומועילה למשתמש.
          דוגמאות טובות: "הנחיות לרעידת אדמה", "הכנת ערכת חירום", "מקלטים באזור תל אביב"`,
        },
        {
          role: "user",
          content: `צור כותרת קצרה ורלוונטית לשיחה הבאה:\n\n${conversationText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const summary = response.choices[0]?.message?.content || 'שיחה עם עיל"ם'

    console.log("✅ תקציר נוצר:", summary)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("❌ שגיאה ביצירת תקציר:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
