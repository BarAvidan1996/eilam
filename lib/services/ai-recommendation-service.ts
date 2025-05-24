const extractProfileData = async (prompt: string) => {
  try {
    const response = await fetch("/api/extract-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      console.error("Error extracting data from prompt:", await response.text())
      return {}
    }

    const extractedData = await response.json()

    // תיקון: אם יש קשישים, לא לספור אותם גם כמבוגרים
    if (extractedData.elderly && extractedData.elderly > 0 && extractedData.adults && extractedData.adults > 0) {
      extractedData.adults = Math.max(0, extractedData.adults - extractedData.elderly)
    }

    console.log("Extracted data:", extractedData)
    return extractedData
  } catch (error) {
    console.error("Error extracting data:", error)
    return {}
  }
}

const generateRecommendations = async (prompt: string) => {
  try {
    // קודם כל, חלץ את הנתונים מהפרומפט
    const extractedData = await extractProfileData(prompt)

    // עכשיו, השתמש בנתונים המחולצים כדי ליצור פרומפט מותאם אישית ל-AI
    const customizedPrompt = `
יצירת רשימת ציוד חירום מותאמת אישית עבור משפחה עם המאפיינים הבאים:

- מבוגרים: ${extractedData.adults || 0}
- ילדים: ${extractedData.children || 0}${extractedData.children_ages && extractedData.children_ages.length > 0 ? ` (גילאים: ${extractedData.children_ages.join(", ")})` : ""}
- תינוקות: ${extractedData.babies || 0}
- קשישים: ${extractedData.elderly || 0}
- חיות מחמד: ${extractedData.pets || 0}${extractedData.pet_types && extractedData.pet_types.length > 0 ? ` (${extractedData.pet_types.join(", ")})` : ""}
- צרכים מיוחדים: ${extractedData.special_needs || "אין"}
- משך זמן: ${extractedData.duration_hours || 72} שעות
- מיקום: ${extractedData.location || "לא צוין"}

הפרומפט המקורי של המשתמש:
${prompt}

צור רשימת ציוד חירום מותאמת אישית למשפחה זו, עם דגש מיוחד על הצרכים הייחודיים שלהם.
אל תכלול פריטים בסיסיים שכבר קיימים ברשימת פיקוד העורף (מים, מזון יבש, פנס, רדיו, ערכת עזרה ראשונה וכו').
התמקד בפריטים מיוחדים ומותאמים אישית לצרכים הספציפיים של המשפחה.

שים לב:
עליך **להחזיר בדיוק את 13 הפריטים של פיקוד העורף** הבאים (אין להשמיט אף אחד מהם), ולאחר מכן **לפחות 10 פריטים מותאמים אישית** בהתבסס על המאפיינים הספציפיים של המשפחה.

### רשימת החובה (פיקוד העורף):
1. מים (3 ליטר לאדם ליום)
2. מזון יבש/משומר
3. פנס
4. ערכת עזרה ראשונה
5. רדיו המופעל באמצעות סוללות
6. מטען נייד
7. עותקי מסמכים חיוניים
8. מטף כיבוי אש
9. סוללות רזרביות
10. חצי מיכל דלק לפחות במכונית
11. כסף מזומן
12. תרופות אישיות

לאחריהם, צור **לפחות 10 פריטים מותאמים אישית** לצרכים הבאים:

- תינוקות → פריטים כמו טיטולים, פורמולה, מגבונים רכים
- ילדים בגילאים שצוינו → פריטים שמרגיעים, תעסוקה, ציוד מתאים לגיל
- קשישים → תרופות, ציוד ניידות, משקפיים רזרביים
- בעלי חיים → אוכל מתאים, ציוד היגיינה לחיה, תרופות אם יש
- צרכים רפואיים → תרופות ייחודיות, מכשור תומך (לדוגמה: מד לחץ דם, סוכר)
- שומרי שבת → פתרונות שאינם חשמליים, מוצרים עם תו שבת
- מגורים ללא מקלט → ציוד נייד לשהייה במקלט ציבורי או פתרון חלופי

פריטים שתחזיר צריכים לכלול:
- שם הפריט
- קטגוריה
- כמות מומלצת
- יחידת מידה
- רמת חשיבות
- תיאור קצר
- אופן שימוש
- אורך חיי מדף
- כמות מומלצת לאדם
- is_mandatory: true או false

אין צורך לחזור על תיאור המשתמש, חזור רק על רשימת פריטים בפורמט JSON.
`

    // שלח את הפרומפט המותאם אישית ל-API
    const response = await fetch("/api/ai-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: customizedPrompt,
        extractedData: extractedData,
      }),
    })

    if (!response.ok) {
      console.error("Error calling AI recommendations API:", await response.json())
      console.log("Using fallback recommendations generator")
      return {
        profile: extractedData,
        items: generateFallbackRecommendations(prompt).items,
      }
    }

    const data = await response.json()

    // וודא שהפרופיל מכיל את הנתונים המחולצים
    if (!data.profile) {
      data.profile = extractedData
    }

    // סנן פריטים שחוזרים על פריטי החובה
    const mandatoryItemNames = [
      "מים",
      "מזון יבש",
      "פנס",
      "ערכת עזרה ראשונה",
      "רדיו",
      "מטען נייד",
      "עותקי מסמכים",
      "מטף כיבוי אש",
      "סוללות",
      "חצי מיכל דלק לפחות במכונית",
      "כסף מזומן",
      "מגבונים לחים",
      "תרופות אישיות",
    ]

    if (data.items) {
      data.items = data.items.filter(
        (item) =>
          !mandatoryItemNames.some(
            (mandatoryName) => item.name.includes(mandatoryName) || mandatoryName.includes(item.name),
          ),
      )
    }

    return data
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    console.log("Using fallback recommendations generator due to error")
    return generateFallbackRecommendations(prompt)
  }
}

function generateFallbackRecommendations(prompt: string): { profile: {}; items: { name: string; reason: string }[] } {
  console.log("Fallback recommendations triggered. Prompt:", prompt)
  return {
    profile: {},
    items: [
      { name: "מים", reason: "חיוני להידרציה" },
      { name: "מזון יבש", reason: "מקור אנרגיה זמין" },
      { name: "פנס", reason: "תאורה במקרה של הפסקת חשמל" },
      { name: "רדיו", reason: "לקבלת עדכונים" },
      { name: "ערכת עזרה ראשונה", reason: "טיפול בפציעות קלות" },
    ],
  }
}

// Exportar el servicio
export const AIRecommendationService = {
  generateRecommendations,
  generateFallbackRecommendations,
  extractProfileData,
}
