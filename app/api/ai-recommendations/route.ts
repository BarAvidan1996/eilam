import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, extractedData } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key is missing" }, { status: 500 })
    }

    // יצירת פרומפט מפורט ל-OpenAI
    const detailedPrompt = `
יצירת רשימת ציוד חירום מותאמת אישית

פרטי המשפחה:
${prompt}

צור רשימת ציוד חירום מותאמת אישית למשפחה זו. הרשימה צריכה לכלול פריטים בקטגוריות הבאות:
1. מים ומזון
2. ציוד רפואי
3. היגיינה
4. תאורה ואנרגיה
5. תקשורת
6. מסמכים וכסף
7. ציוד לילדים (אם רלוונטי)
8. ציוד לתינוקות (אם רלוונטי)
9. ציוד לחיות מחמד (אם רלוונטי)
10. ציוד לקשישים (אם רלוונטי)
11. ציוד לצרכים מיוחדים (אם רלוונטי)
12. ציוד כללי

עבור כל פריט, ספק את המידע הבא:
- שם הפריט
- קטגוריה (אחת מהקטגוריות לעיל)
- כמות מומלצת
- יחידת מידה (ליטרים, יחידות, ק"ג וכו')
- רמת חשיבות (5=הכרחי, 4=חשוב מאוד, 3=חשוב, 2=מומלץ, 1=אופציונלי)
- תיאור קצר
- חיי מדף (אם רלוונטי)
- הוראות שימוש
- כמות מומלצת לאדם

החזר את התשובה בפורמט JSON הבא:
{
  "profile": {
    "adults": מספר המבוגרים,
    "children": מספר הילדים,
    "children_ages": [גילאי הילדים],
    "babies": מספר התינוקות,
    "elderly": מספר הקשישים,
    "pets": מספר חיות המחמד,
    "pet_types": ["סוגי חיות המחמד"],
    "special_needs": "תיאור הצרכים המיוחדים",
    "duration_hours": משך הזמן בשעות
  },
  "items": [
    {
      "id": "מזהה ייחודי",
      "name": "שם הפריט",
      "category": "קטגוריה",
      "quantity": כמות,
      "unit": "יחידת מידה",
      "importance": רמת חשיבות (1-5),
      "description": "תיאור",
      "shelf_life": "חיי מדף",
      "usage_instructions": "הוראות שימוש",
      "recommended_quantity_per_person": "כמות מומלצת לאדם",
      "obtained": false,
      "expiryDate": null,
      "aiSuggestedExpiryDate": "תאריך תפוגה מוצע (YYYY-MM-DD)",
      "sendExpiryReminder": false
    }
  ]
}

חשוב: התאם את הרשימה לצרכים הספציפיים של המשפחה, כולל גילאי הילדים, חיות מחמד, צרכים מיוחדים ומשך הזמן הנדרש.
`

    // שליחת הבקשה ל-OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "אתה מומחה ליצירת רשימות ציוד חירום מותאמות אישית. אתה מחזיר תמיד תשובות בפורמט JSON בלבד.",
          },
          {
            role: "user",
            content: detailedPrompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text())
      return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      // ניסיון לחלץ את ה-JSON מהתשובה
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      const recommendations = JSON.parse(jsonString)

      // אם יש נתונים מחולצים, וודא שהפרופיל מכיל אותם
      if (extractedData) {
        recommendations.profile = {
          ...extractedData,
          ...recommendations.profile,
        }
      }

      // הוספת מזהים ייחודיים לפריטים אם חסרים
      if (recommendations.items) {
        recommendations.items = recommendations.items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index + 1}`,
          obtained: false,
          expiryDate: null,
          sendExpiryReminder: false,
        }))
      }

      return NextResponse.json(recommendations)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error, "Raw content:", content)
      return NextResponse.json({ error: "Failed to parse recommendations" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
