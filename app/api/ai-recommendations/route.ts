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

בנוסף לפריטי החובה הללו, אני רוצה שתתאים את הרשימה באופן מעמיק ומפורט לצרכים הספציפיים של המשפחה:

1. אם יש ילדים - הוסף פריטים ספציפיים לגילאים שלהם, כמו:
   - לתינוקות: חיתולים, מטרנה, בקבוקים, מוצצים, בגדי החלפה, משחקים מתאימים לגיל
   - לילדים קטנים: צעצועים מועדפים, ספרים, בגדים, חטיפים אהובים, תרופות ייחודיות
   - למתבגרים: מכשירי אלקטרוניקה וסוללות, ספרים, מזון מועדף

2. אם יש חיות מחמד - פרט ציוד ספציפי לסוג החיה:
   - לכלבים: מזון, מים, קערות, רצועה, תרופות, צעצועים מרגיעים, שמיכה מוכרת
   - לחתולים: מזון, מים, קערות, ארגז חול וחול, תרופות, מנשא
   - לחיות אחרות: ציוד ספציפי לסוג החיה

3. אם יש צרכים רפואיים מיוחדים:
   - לאסטמה: משאפים, תרופות, מכשיר אינהלציה וחלקי חילוף
   - לאלרגיות: תרופות אנטי-היסטמיניות, אפיפן אם נדרש, רשימת מזונות לא אלרגניים
   - לסוכרת: מד סוכר, מחטים, אינסולין, מזון מתאים
   - למוגבלויות פיזיות: ציוד עזר נייד, סוללות למכשירים חשמליים, תרופות

4. התייחס למיקום המגורים ולתנאים הפיזיים:
   - לדירה בקומה גבוהה: ציוד לירידה במדרגות, תיק חירום קל לנשיאה
   - לבית פרטי: ציוד לאיטום חלונות, כלים לתיקונים קלים
   - לאזור חם/קר: ציוד מתאים לאקלים (מאווררים/שמיכות חמות)

5. התאם את הכמויות בדיוק למספר האנשים ולמשך הזמן המבוקש:
   - חשב כמות מים: 3 ליטר לאדם ליום × מספר אנשים × מספר ימים
   - חשב כמות מזון: 2000 קלוריות לאדם ליום × מספר אנשים × מספר ימים
   - חשב כמות תרופות: מספר מנות ליום × מספר ימים + 50% רזרבה

6. הוסף פריטים ייחודיים שלא נמצאים ברשימות סטנדרטיות אבל מתאימים במיוחד למשפחה זו.

7. לכל פריט, הוסף הסבר מפורט למה הוא חשוב במיוחד למשפחה זו ואיך להשתמש בו בצורה אופטימלית.

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
      "importance": דירוג חשיבות (1-5, כאשר 5 הוא פריט חובה של פיקוד העורף),
      "description": "תיאור מותאם אישית המסביר למה פריט זה חשוב ספציפית למשפחה זו",
      "shelf_life": "חיי מדף",
      "usage_instructions": "הוראות שימוש מותאמות אישית",
      "recommended_quantity_per_person": "כמות מומלצת לאדם",
      "obtained": false,
      "expiryDate": null,
      "aiSuggestedExpiryDate": "YYYY-MM-DD",
      "sendExpiryReminder": false,
      "personalized_note": "הערה מותאמת אישית המסבירה את החשיבות הספציפית של פריט זה למשפחה זו"
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
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לפי צרכים ספציפיים של משפחות. התאם את הרשימה בצורה מדויקת לפרטים שסופקו, עם דגש על התאמה אישית מעמיקה מעבר לרשימת החובה הבסיסית.",
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
