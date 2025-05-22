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
יצירת רשימת ציוד חירום מותאמת אישית למשפחה

חלק 1: פריטי חובה של פיקוד העורף
יש לכלול את כל פריטי החובה הבאים (סמן אותם כ-is_mandatory=true):

1. מים (3 ליטר לאדם ליום)
2. מזון יבש/משומר
3. ערכת עזרה ראשונה
4. תרופות קבועות + מרשמים מודפסים
5. רדיו + סוללות
6. פנסים + סוללות
7. מטענים ניידים לטלפונים
8. ציוד ייחודי לתינוקות/קשישים/חיות מחמד
9. עותקים של מסמכים חשובים
10. מטף כיבוי אש
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

חשוב מאוד: עליך להוסיף לפחות 10 פריטים ייחודיים ומותאמים אישית מעבר לרשימת החובה, בהתבסס על המאפיינים הספציפיים של המשפחה. 
אל תסתפק רק ברשימת החובה - חובה להוסיף פריטים מותאמים אישית!

הנה כיצד להתאים את הרשימה באופן מושלם:

1. אם יש ילדים - הוסף פריטים ספציפיים לכל קבוצת גיל:
   - לכל תינוק (0-2): חיתולים בכמות מדויקת, מטרנה, בקבוקים, מוצצים, בגדי החלפה, משחקים מתאימים לגיל
   - לכל ילד קטן (3-8): צעצועים מועדפים, ספרים, בגדים, חטיפים אהובים, תרופות ייחודיות
   - לכל ילד גדול (9-12): משחקים, ספרים, פעילויות
   - לכל מתבגר (13+): מכשירי אלקטרוניקה וסוללות, ספרים, מזון מועדף

2. אם יש חיות מחמד - הוסף פריטים ספציפיים לכל סוג חיה:
   - לכל כלב: מזון בכמות מדויקת, קערות, רצועה, תרופות, צעצועים מרגיעים, שמיכה מוכרת
   - לכל חתול: מזון בכמות מדויקת, קערות, ארגז חול וחול, תרופות, מנשא
   - לחיות אחרות: ציוד ספציפי לסוג החיה

3. אם יש צרכים רפואיים מיוחדים - הוסף פריטים ייחודיים לכל צורך:
   - לאסטמה: משאפים, תרופות, מכשיר אינהלציה וחלקי חילוף
   - לאלרגיות: תרופות אנטי-היסטמיניות, אפיפן אם נדרש, רשימת מזונות לא אלרגניים
   - לסוכרת: מד סוכר, מחטים, אינסולין, מזון מתאים
   - למוגבלויות פיזיות: ציוד עזר נייד, סוללות למכשירים חשמליים, תרופות

4. התאם למיקום המגורים - הוסף פריטים ייחודיים:
   - לדירה בקומה גבוהה: ציוד לירידה במדרגות, תיק חירום קל לנשיאה
   - לבית פרטי: ציוד לאיטום חלונות, כלים לתיקונים קלים
   - לאזור חם/קר: ציוד מתאים לאקלים (מאווררים/שמיכות חמות)

5. חשב כמויות מדויקות והסבר את החישוב:
   - מים: 3 ליטר לאדם ליום × מספר אנשים × מספר ימים
   - מזון: 2000 קלוריות לאדם ליום × מספר אנשים × מספר ימים
   - תרופות: מספר מנות ליום × מספר ימים + 50% רזרבה

6. הוסף פריטים ייחודיים שלא נמצאים ברשימות סטנדרטיות אבל מתאימים במיוחד למשפחה זו.

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
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לחלוטין לפי צרכים ספציפיים של משפחות. תפקידך ליצור רשימה שכוללת את כל פריטי החובה של פיקוד העורף, ובנוסף להוסיף פריטים ייחודיים ומותאמים אישית לכל מאפיין של המשפחה. חשוב מאוד שתוסיף פריטים ספציפיים לכל אחד מהמאפיינים שחולצו (ילדים, חיות מחמד, צרכים מיוחדים וכו') ושתסביר בדיוק למה כל פריט חשוב למשפחה הספציפית הזו. אל תסתפק רק ברשימת החובה - חובה להוסיף פריטים מותאמים אישית!",
        },
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3500,
    })

    const content = response.choices[0].message.content

    // Parse the JSON response
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      const data = JSON.parse(jsonString)

      // Ensure the profile is included and properly formatted
      if (!data.profile && extractedData) {
        data.profile = extractedData
      } else if (data.profile) {
        // Ensure children_ages is an array
        if (data.profile.children_ages && !Array.isArray(data.profile.children_ages)) {
          if (typeof data.profile.children_ages === "object") {
            data.profile.children_ages = Object.values(data.profile.children_ages)
          } else {
            data.profile.children_ages = [data.profile.children_ages]
          }
        }

        // Ensure special_needs is a string
        if (data.profile.special_needs && typeof data.profile.special_needs === "object") {
          data.profile.special_needs = JSON.stringify(data.profile.special_needs)
        }

        // Ensure pet_types is an array
        if (data.profile.pet_types && !Array.isArray(data.profile.pet_types)) {
          if (typeof data.profile.pet_types === "object") {
            data.profile.pet_types = Object.values(data.profile.pet_types)
          } else {
            data.profile.pet_types = [data.profile.pet_types]
          }
        }
      }

      // Ensure mandatory items are properly marked
      if (data.items && Array.isArray(data.items)) {
        // Count how many personalized items we have
        const personalizedItems = data.items.filter((item) => !item.is_mandatory)

        // If we don't have enough personalized items, log a warning
        if (personalizedItems.length < 10) {
          console.warn(
            `Warning: Only ${personalizedItems.length} personalized items were generated. We need at least 10.`,
          )
        }
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
