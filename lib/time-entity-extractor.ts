import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export interface TimeEntity {
  days?: number
  timeRange?: string
  specificDate?: string
  isRecent: boolean
}

export async function extractTimeEntities(question: string): Promise<TimeEntity> {
  console.log("🕐 מחלץ ישויות זמן מהשאלה:", question)

  const prompt = `
אתה מחלץ ישויות זמן משאלות. נתח את השאלה הבאה וחלץ מידע זמן רלוונטי.

דוגמאות:
- "מה קרה השבוע?" → days: 7, isRecent: true
- "מתי הייתה האזעקה האחרונה?" → days: 30, isRecent: true
- "מה קרה היום?" → days: 1, isRecent: true
- "מה קרה בחודש האחרון?" → days: 30, isRecent: true
- "מה קרה ב-2024?" → timeRange: "2024", isRecent: false
- "מה קרה במאי 2025?" → timeRange: "2025-05", isRecent: false
- "מה המצב הנוכחי?" → days: 3, isRecent: true

החזר JSON בפורמט הבא:
{
  "days": מספר ימים לאחור (אם רלוונטי),
  "timeRange": טווח זמן ספציפי כמו "2024" או "2024-05" (אם רלוונטי),
  "specificDate": תאריך ספציפי (אם רלוונטי),
  "isRecent": true אם השאלה על זמן קרוב/עדכני, false אם על זמן ספציפי בעבר
}

שאלה: ${question}

JSON:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0,
    })

    const content = response.choices[0]?.message?.content?.trim() || "{}"
    console.log("🕐 תוצאת חילוץ זמן:", content)

    const timeEntity = JSON.parse(content) as TimeEntity
    console.log("✅ ישויות זמן שחולצו:", timeEntity)

    return timeEntity
  } catch (error) {
    console.error("❌ שגיאה בחילוץ ישויות זמן:", error)
    return { isRecent: true, days: 7 } // ברירת מחדל
  }
}
