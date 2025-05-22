import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, extractedData } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Use the extracted data to create a more personalized prompt for the AI
    const enhancedPrompt = `
יצירת רשימת ציוד חירום מותאמת אישית עבור משפחה עם המאפיינים הבאים:

${
  extractedData
    ? `
- מבוגרים: ${extractedData.adults}
- ילדים: ${extractedData.children}${extractedData.children_ages && extractedData.children_ages.length > 0 ? ` (גילאים: ${extractedData.children_ages.join(", ")})` : ""}
- תינוקות: ${extractedData.babies}
- קשישים: ${extractedData.elderly}
- חיות מחמד: ${extractedData.pets}${extractedData.pet_types && extractedData.pet_types.length > 0 ? ` (${extractedData.pet_types.join(", ")})` : ""}
- צרכים מיוחדים: ${extractedData.special_needs || "אין"}
- משך זמן: ${extractedData.duration_hours} שעות
- מיקום: ${extractedData.location || "לא צוין"}
- פרטי מגורים: ${extractedData.housing_details || "לא צוין"}
`
    : prompt
}

הפרומפט המקורי של המשתמש:
${prompt}

צור רשימת ציוד חירום מותאמת אישית למשפחה זו, עם דגש מיוחד על הצרכים הייחודיים שלהם.

חשוב מאוד: הרשימה חייבת לכלול את כל פריטי החובה של פיקוד העורף:

1. מים ומזון לא מקורר לכל בני הבית לפחות ל-48 שעות (התאם את הכמות המדויקת למספר הנפשות ולמשך הזמן המבוקש)
2. תאורת חירום
3. פנסים וסוללות
4. ערכת עזרה ראשונה
5. תרופות ומרשמים מודפסים
6. רדיו וסוללות
7. מטענים ניידים לטלפונים
8. ציוד מיוחד לצרכי המשפחה (תינוקות, קשישים, חיות מחמד)
9. סוללות גיבוי למכשירים חיוניים
10. עותקים של מסמכים חיוניים (תעודת זהות, רישיון נהיגה, דרכון וכו')
11. מטף כיבוי אש, גלאי עשן
12. לפחות חצי מיכל דלק במכונית
13. פעילויות לילדים (משחקים, ספרים וכלי כתיבה)
14. ציוד לחיות מחמד

בנוסף לפריטי החובה הללו:
1. התאם את הרשימה באופן ספציפי לכל מאפיין שהוזכר בפרומפט. 
2. אם יש ילדים, פרט פריטים ספציפיים לגילאים שלהם.
3. אם יש חיות מחמד, פרט פריטים ספציפיים לסוג החיה.
4. אם יש צרכים רפואיים מיוחדים (כמו אלרגיות או אסטמה), פרט את כל הציוד הרפואי הספציפי הנדרש.
5. התייחס למיקום המגורים ולתנאים הפיזיים (כמו קומה בבניין, גודל דירה, קיום מחסן).
6. התאם את הכמויות בדיוק למספר האנשים ולמשך הזמן המבוקש.
7. הוסף הערות והסברים ספציפיים לכל פריט שמסבירים למה הוא חשוב במיוחד למשפחה זו.

החזר את התשובה בפורמט JSON הבא:
{
  "profile": {
    // פרטי המשפחה כפי שחולצו
  },
  "items": [
    {
      "id": "unique-id",
      "name": "שם הפריט",
      "category": "קטגוריה",
      "quantity": מספר,
      "unit": "יחידת מידה",
      "importance": דירוג חשיבות (1-5),
      "description": "תיאור מותאם אישית המסביר למה פריט זה חשוב ספציפית למשפחה זו",
      "shelf_life": "חיי מדף",
      "usage_instructions": "הוראות שימוש מותאמות אישית",
      "recommended_quantity_per_person": "כמות מומלצת לאדם",
      "obtained": false,
      "expiryDate": null,
      "aiSuggestedExpiryDate": "YYYY-MM-DD",
      "sendExpiryReminder": false,
      "personalized_note": "הערה מותאמת אישית המסבירה את החשיבות הספציפית של פריט זה למשפחה זו",
      "is_mandatory": true/false
    }
  ]
}
`

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לפי צרכים ספציפיים של משפחות. התאם את הרשימה בצורה מדויקת לפרטים שסופקו.",
        },
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const content = response.choices[0].message.content

    // Parse the JSON response
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      const data = JSON.parse(jsonString)

      // Ensure the profile is included
      if (!data.profile && extractedData) {
        data.profile = extractedData
      }

      return NextResponse.json(data)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      console.log("Raw response:", content)
      return NextResponse.json({ error: "Failed to parse AI response", raw: content }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
