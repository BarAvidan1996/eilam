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
המשימה שלך: ליצור רשימת ציוד חירום **מותאמת אישית** למשפחה שתוארה להלן, עם התאמות מדויקות לפי מאפייני המשפחה והתרחיש שהוזן.

🛑 חשוב מאוד: עליך להתחיל **בבסיס קבוע של ציוד חובה** כפי שממליץ פיקוד העורף. אל תדלג או תשמיט אף פריט מרשימת הבסיס:

1. מים ומזון לא מקורר (48 שעות לפחות לכל בני הבית – חישוב כמות מדויק לפי מספר אנשים וזמן)
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

לאחר מכן, **התאם והרחב את הרשימה לפי המידע הבא על המשפחה**:

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

הנחיות להתאמה אישית מעמיקה:

1. עבור ילדים - התאם לפי גיל:
   - תינוקות (0-2): חיתולים, מטרנה, בקבוקים, מוצצים, בגדים, משחקים מתאימים
   - ילדים קטנים (3-8): צעצועים מועדפים, ספרים, בגדים, חטיפים אהובים, תרופות ייחודיות
   - ילדים גדולים (9-12): משחקים, ספרים, פעילויות
   - מתבגרים (13+): מכשירי אלקטרוניקה וסוללות, ספרים, מזון מועדף

2. עבור חיות מחמד - התאם לסוג החיה:
   - כלבים: מזון, מים, קערות, רצועה, תרופות, צעצועים מרגיעים, שמיכה מוכרת
   - חתולים: מזון, מים, קערות, ארגז חול וחול, תרופות, מנשא
   - חיות אחרות: ציוד ספציפי לסוג החיה

3. עבור צרכים רפואיים מיוחדים:
   - אסטמה: משאפים, תרופות, מכשיר אינהלציה וחלקי חילוף
   - אלרגיות: תרופות אנטי-היסטמיניות, אפיפן אם נדרש, רשימת מזונות לא אלרגניים
   - סוכרת: מד סוכר, מחטים, אינסולין, מזון מתאים
   - מוגבלויות פיזיות: ציוד עזר נייד, סוללות למכשירים חשמליים, תרופות

4. התאם למיקום המגורים ולתנאים הפיזיים:
   - דירה בקומה גבוהה: ציוד לירידה במדרגות, תיק חירום קל לנשיאה
   - בית פרטי: ציוד לאיטום חלונות, כלים לתיקונים קלים
   - אזור חם/קר: ציוד מתאים לאקלים (מאווררים/שמיכות חמות)

5. חשב כמויות מדויקות:
   - מים: 3 ליטר לאדם ליום × מספר אנשים × מספר ימים
   - מזון: 2000 קלוריות לאדם ליום × מספר אנשים × מספר ימים
   - תרופות: מספר מנות ליום × מספר ימים + 50% רזרבה

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
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לפי צרכים ספציפיים של משפחות. תפקידך ליצור רשימה שכוללת את כל פריטי החובה של פיקוד העורף, ובנוסף להתאים את הרשימה באופן מעמיק ומפורט לצרכים הספציפיים של המשפחה המתוארת.",
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
