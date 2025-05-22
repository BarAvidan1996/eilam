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
המשימה שלך: ליצור רשימת ציוד חירום **מותאמת אישית לחלוטין** למשפחה שתוארה להלן.

חלק 1: בסיס חובה - פריטי פיקוד העורף
יש לכלול את כל פריטי החובה הבאים (סמן אותם כ-is_mandatory=true):

1. מים ומזון לא מקורר (48 שעות לפחות לכל בני הבית)
2. תאורת חירום, פנסים וסוללות
3. ערכת עזרה ראשונה
4. תרופות קבועות + מרשמים מודפסים
5. רדיו וסוללות
6. מטענים ניידים
7. ציוד ייחודי (לתינוקות, קשישים, חיות מחמד)
8. סוללות גיבוי למכשירים חיוניים
9. עותקים של מסמכים חשובים (ת"ז, דרכון, רישיון)
10. מטף כיבוי, גלאי עשן
11. חצי מיכל דלק ברכב
12. משחקים ופעילויות לילדים
13. ציוד בסיסי לחיות מחמד

חלק 2: התאמה אישית מעמיקה - חובה להוסיף פריטים ספציפיים!
המידע על המשפחה:

${
  extractedData
    ? `
- מבוגרים: ${extractedData.adults}
- ילדים: ${extractedData.children}${extractedData.children_ages?.length ? ` (גילאים: ${extractedData.children_ages.join(", ")})` : ""}
- תינוקות: ${extractedData.babies}
- קשישים: ${extractedData.elderly}
- חיות מחמד: ${extractedData.pets}${extractedData.pet_types?.length ? ` (${extractedData.pet_types.join(", ")})` : ""}
- צרכים מיוחדים: ${extractedData.special_needs || "אין"}
- משך זמן חירום צפוי: ${extractedData.duration_hours} שעות
- מיקום בארץ: ${extractedData.location || "לא צוין"}
- סוג מגורים: ${extractedData.housing_details || "לא צוין"}
`
    : prompt
}

הפרומפט המקורי של המשתמש:
${prompt}

חשוב מאוד: עליך להוסיף לפחות 10-15 פריטים ייחודיים ומותאמים אישית מעבר לרשימת החובה, בהתבסס על המאפיינים הספציפיים של המשפחה. 

הנה כיצד להתאים את הרשימה באופן מושלם:

1. אם יש ילדים - הוסף פריטים ספציפיים לכל קבוצת גיל:
   - לכל תינוק (0-2): לפחות 5 פריטים ייחודיים כמו חיתולים בכמות מדויקת, מטרנה, בקבוקים, מוצצים, בגדי החלפה, משחקים מתאימים לגיל
   - לכל ילד קטן (3-8): לפחות 4 פריטים ייחודיים כמו צעצועים מועדפים, ספרים, בגדים, חטיפים אהובים, תרופות ייחודיות
   - לכל ילד גדול (9-12): לפחות 3 פריטים ייחודיים כמו משחקים, ספרים, פעילויות
   - לכל מתבגר (13+): לפחות 3 פריטים ייחודיים כמו מכשירי אלקטרוניקה וסוללות, ספרים, מזון מועדף

2. אם יש חיות מחמד - הוסף לפחות 4 פריטים ספציפיים לכל סוג חיה:
   - לכל כלב: מזון בכמות מדויקת, קערות, רצועה, תרופות, צעצועים מרגיעים, שמיכה מוכרת
   - לכל חתול: מזון בכמות מדויקת, קערות, ארגז חול וחול, תרופות, מנשא
   - לחיות אחרות: ציוד ספציפי לסוג החיה

3. אם יש צרכים רפואיים מיוחדים - הוסף לפחות 3 פריטים ייחודיים לכל צורך:
   - לאסטמה: משאפים, תרופות, מכשיר אינהלציה וחלקי חילוף
   - לאלרגיות: תרופות אנטי-היסטמיניות, אפיפן אם נדרש, רשימת מזונות לא אלרגניים
   - לסוכרת: מד סוכר, מחטים, אינסולין, מזון מתאים
   - למוגבלויות פיזיות: ציוד עזר נייד, סוללות למכשירים חשמליים, תרופות

4. התאם למיקום המגורים - הוסף לפחות 3 פריטים ייחודיים:
   - לדירה בקומה גבוהה: ציוד לירידה במדרגות, תיק חירום קל לנשיאה
   - לבית פרטי: ציוד לאיטום חלונות, כלים לתיקונים קלים
   - לאזור חם/קר: ציוד מתאים לאקלים (מאווררים/שמיכות חמות)

5. חשב כמויות מדויקות והסבר את החישוב:
   - מים: 3 ליטר לאדם ליום × מספר אנשים × מספר ימים
   - מזון: 2000 קלוריות לאדם ליום × מספר אנשים × מספר ימים
   - תרופות: מספר מנות ליום × מספר ימים + 50% רזרבה

6. הוסף לפחות 3 פריטים ייחודיים שלא נמצאים ברשימות סטנדרטיות אבל מתאימים במיוחד למשפחה זו.

7. לכל פריט מותאם אישית, הוסף הסבר מפורט למה הוא חשוב במיוחד למשפחה זו ואיך להשתמש בו בצורה אופטימלית.

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
      "personalized_note": "הערה מותאמת אישית המסבירה את החשיבות הספציפית של פריט זה למשפחה זו",
      "is_mandatory": boolean // האם זה פריט חובה של פיקוד העורף
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
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לחלוטין לפי צרכים ספציפיים של משפחות. תפקידך ליצור רשימה שכוללת את כל פריטי החובה של פיקוד העורף, ובנוסף להוסיף פריטים ייחודיים ומותאמים אישית לכל מאפיין של המשפחה. חשוב מאוד שתוסיף פריטים ספציפיים לכל אחד מהמאפיינים שחולצו (ילדים, חיות מחמד, צרכים מיוחדים וכו') ושתסביר בדיוק למה כל פריט חשוב למשפחה הספציפית הזו.",
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
