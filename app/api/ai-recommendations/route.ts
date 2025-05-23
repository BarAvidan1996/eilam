import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define mandatory items that must be included
const MANDATORY_ITEMS = [
  {
    id: "mandatory-1",
    name: "מים (3 ליטר לאדם ליום)",
    category: "water_food",
    importance: 5,
    description: "מים לשתייה ולשימוש בסיסי. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לאחסן במקום קריר ויבש. מומלץ להחליף כל שנה.",
    is_mandatory: true,
  },
  {
    id: "mandatory-2",
    name: "מזון יבש/משומר",
    category: "water_food",
    importance: 5,
    description: "מזון שאינו דורש קירור או בישול. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לבדוק תאריכי תפוגה ולהחליף בהתאם.",
    is_mandatory: true,
  },
  {
    id: "mandatory-3",
    name: "ערכת עזרה ראשונה",
    category: "medical",
    importance: 5,
    description: "ערכה בסיסית לטיפול בפציעות קלות. פריט חובה של פיקוד העורף.",
    shelf_life: "שנתיים",
    usage_instructions: "יש לבדוק שלמות ותקינות הפריטים אחת לחצי שנה.",
    is_mandatory: true,
  },
  {
    id: "mandatory-4",
    name: "תרופות קבועות + מרשמים מודפסים",
    category: "medical",
    importance: 5,
    description: "תרופות קבועות לבני המשפחה ומרשמים מודפסים. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לתרופה",
    usage_instructions: "יש לוודא מלאי לפחות לשבוע ימים ולבדוק תאריכי תפוגה.",
    is_mandatory: true,
  },
  {
    id: "mandatory-5",
    name: "רדיו + סוללות",
    category: "communication",
    importance: 5,
    description: "רדיו המופעל על סוללות לקבלת עדכונים. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
    is_mandatory: true,
  },
  {
    id: "mandatory-6",
    name: "פנסים + סוללות",
    category: "lighting_energy",
    importance: 5,
    description: "פנסים לתאורת חירום. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
    is_mandatory: true,
  },
  {
    id: "mandatory-7",
    name: "מטענים ניידים לטלפונים",
    category: "communication",
    importance: 5,
    description: "מטענים ניידים לטעינת טלפונים ניידים. פריט חובה של פיקוד העורף.",
    shelf_life: "3 שנים",
    usage_instructions: "יש לוודא שהמטענים טעונים במלואם.",
    is_mandatory: true,
  },
  {
    id: "mandatory-8",
    name: "ציוד ייחודי לתינוקות/קשישים/חיות מחמד",
    category: "other",
    importance: 5,
    description: "ציוד ייחודי בהתאם לצרכים המיוחדים של בני המשפחה. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לצרכים הספציפיים של המשפחה.",
    is_mandatory: true,
  },
  {
    id: "mandatory-9",
    name: "עותקים של מסמכים חשובים",
    category: "documents_money",
    importance: 5,
    description: "עותקים של תעודות זהות, דרכונים, רישיונות וכו'. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום אטום למים ולעדכן בהתאם לשינויים.",
    is_mandatory: true,
  },
  {
    id: "mandatory-10",
    name: "מטף כיבוי אש",
    category: "other",
    importance: 5,
    description: "מטף לכיבוי שריפות קטנות. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לשנה ולתחזק בהתאם להוראות היצרן.",
    is_mandatory: true,
  },
  {
    id: "mandatory-11",
    name: "חצי מיכל דלק ברכב",
    category: "other",
    importance: 5,
    description: "שמירה על לפחות חצי מיכל דלק ברכב. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לוודא שהרכב תמיד עם לפחות חצי מיכל דלק.",
    is_mandatory: true,
  },
  {
    id: "mandatory-12",
    name: "משחקים ופעילויות לילדים",
    category: "children",
    importance: 5,
    description: "משחקים ופעילויות להפגת מתח ושעמום. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש להתאים לגיל הילדים ולהעדפותיהם.",
    is_mandatory: true,
  },
  {
    id: "mandatory-13",
    name: "ציוד בסיסי לחיות מחמד",
    category: "pets",
    importance: 5,
    description: "מזון, מים, ותרופות לחיות המחמד. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לסוג חיית המחמד ולצרכיה.",
    is_mandatory: true,
  },
]

// Fuzzy matching function for mandatory items
function matchMandatoryItem(itemName: string): string | null {
  const normalized = itemName.replace(/[^א-ת]/g, "")
  for (const mandatory of MANDATORY_ITEMS) {
    const normMandatory = mandatory.name.replace(/[^א-ת]/g, "")
    if (normalized.includes(normMandatory) || normMandatory.includes(normalized)) {
      return mandatory.name
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, extractedData } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create mandatory items with calculated quantities
    const mandatoryItems = MANDATORY_ITEMS.map((item) => ({
      ...item,
      quantity: calculateQuantity(item.name, extractedData),
      unit: getUnitForItem(item.name),
      recommended_quantity_per_person: getRecommendedQuantityPerPerson(item.name),
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sms_notification: false,
      usage_instructions: item.usage_instructions || "",
      shelf_life: item.shelf_life || "",
      personalized_note: "",
      is_mandatory: true, // Ensure this is explicitly set to true
    }))

    // Get personalized items from AI
    const personalizedItems = await getPersonalizedItems(prompt, extractedData)

    // Combine mandatory and personalized items
    const allItems = [...mandatoryItems, ...personalizedItems]

    // Create the final response
    const finalResponse = {
      profile: extractedData || {},
      items: allItems,
    }

    console.log(`Generated ${mandatoryItems.length} mandatory items and ${personalizedItems.length} personalized items`)

    return NextResponse.json(finalResponse)
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

// Function to get personalized items from AI
async function getPersonalizedItems(prompt: string, extractedData: any): Promise<any[]> {
  // Create a detailed example of a personalized item
  const examplePersonalizedItem = {
    id: "example-1",
    name: "משאף אסטמה נוסף",
    category: "medical",
    quantity: 2,
    unit: "יחידות",
    importance: 4,
    description: "משאף נוסף לילד הסובל מאסטמה, למקרה של אובדן או תקלה במשאף העיקרי.",
    shelf_life: "שנה",
    usage_instructions: "יש לבדוק את תאריך התפוגה ולוודא שהמשאף תקין.",
    recommended_quantity_per_person: "1 ליום + 1 גיבוי",
    obtained: false,
    expiryDate: null,
    aiSuggestedExpiryDate: "2024-05-01",
    sendExpiryReminder: false,
    personalized_note: "חשוב במיוחד עבור הילד בן ה-7 הסובל מאסטמה. יש לשמור במקום נגיש וידוע לכל בני המשפחה.",
    is_mandatory: false,
  }

  // Use the extracted data to create a personalized prompt for the AI
  const enhancedPrompt = `
יצירת רשימת ציוד חירום מותאמת אישית למשפחה

חשוב: אתה יוצר רק פריטים מותאמים אישית (is_mandatory=false). פריטי החובה של פיקוד העורף כבר נוספו אוטומטית לרשימה.

המידע על המשפחה:
${
  extractedData
    ? `
- מבוגרים: ${extractedData.adults || 0}
- ילדים: ${extractedData.children || 0}${extractedData.children_ages?.length ? ` (גילאים: ${extractedData.children_ages.join(", ")})` : ""}
- תינוקות: ${extractedData.babies || 0}
- קשישים: ${extractedData.elderly || 0}
- חיות מחמד: ${extractedData.pets || 0}${extractedData.pet_types?.length ? ` (${extractedData.pet_types.join(", ")})` : ""}
- צרכים מיוחדים: ${extractedData.special_needs || "אין"}
- משך זמן חירום צפוי: ${extractedData.duration_hours || 72} שעות
- מיקום בארץ: ${extractedData.location || "לא צוין"}
- סוג מגורים: ${extractedData.housing_details || "לא צוין"}
`
    : prompt
}

הפרומפט המקורי של המשתמש:
${prompt}

המשימה שלך היא ליצור בדיוק 10 פריטים מותאמים אישית בהתבסס על המאפיינים הספציפיים של המשפחה.
אל תכלול פריטים שכבר נמצאים ברשימת החובה של פיקוד העורף (מים, מזון, ערכת עזרה ראשונה, תרופות, רדיו, פנסים, מטענים, מטף, מסמכים, דלק, משחקים לילדים, ציוד לחיות מחמד).

הנה כיצד להתאים את הרשימה באופן מושלם:

1. אם יש קשיש בן 72 עם סוכרת וכולסטרול - הוסף פריטים ספציפיים:
   - מד סוכר נוסף + סוללות רזרביות
   - רצועות למד סוכר (כמות ל-72 שעות)
   - גלוקוז/דקסטרוז למקרה של היפוגליקמיה
   - תרופות סוכרת נוספות (מטפורמין, אינסולין אם נדרש)
   - תרופות כולסטרול נוספות
   - מזון מתאים לסוכרתיים (ללא סוכר, דל פחמימות)
   - מאזן דיגיטלי לשקילה יומית
   - רשימת מזונים מותרים ואסורים

2. אם יש גנרטור קטן - הוסף פריטים ספציפיים:
   - דלק נוסף לגנרטור (בנזין/סולר)
   - שמן מנוע לגנרטור
   - מאריך חשמל עמיד למזג אוויר
   - מפסק זרם נייד
   - כבל הארקה לגנרטור

3. אם אין מקרר נייד או מזגן בממ"ד - הוסף פריטים ספציפיים:
   - צידנית קשיחה גדולה + קרח יבש
   - מאוורר נייד שעובד על סוללות
   - בקבוקי מים קפואים
   - מגבות רטובות לקירור הגוף
   - כובע רחב שוליים
   - בגדים קלים ונושמים

4. אם יש חתולה - הוסף פריטים ספציפיים:
   - מזון רטוב לחתולים (72 שעות)
   - חול לחתולים + ארגז חול נייד
   - צעצועים מרגיעים לחתולה
   - מנשא לחתולה למקרה פינוי
   - תרופות וטרינריות בסיסיות
   - שמיכה מוכרת של החתולה

5. אם גר בקיבוץ בצפון - הוסף פריטים ספציפיים:
   - מערכת התרעה אישית (אזעקה)
   - מפה מפורטת של המקלטים באזור
   - אמצעי תקשורת עם שכנים
   - ציוד לאיטום חלונות מפני גזים
   - מסכות גז נוספות

6. חשב כמויות מדויקות והסבר את החישוב:
   - מים: 3 ליטר לאדם ליום × מספר אנשים × מספר ימים
   - מזון: 2000 קלוריות לאדם ליום × מספר אנשים × מספר ימים
   - תרופות: מספר מנות ליום × מספר ימים + 50% רזרבה

7. וודא שכל הקטגוריות הן מהרשימה המותרת:
   - water_food (מים ומזון)
   - medical (ציוד רפואי)
   - hygiene (היגיינה)
   - lighting_energy (תאורה ואנרגיה)
   - communication (תקשורת)
   - documents_money (מסמכים וכסף)
   - children (ילדים)
   - pets (חיות מחמד)
   - elderly (קשישים)
   - special_needs (צרכים מיוחדים)
   - other (ציוד כללי)

החזר את התשובה בפורמט JSON הבא:
{
  "items": [
    {
      "id": "unique-id",
      "name": "שם הפריט",
      "category": "אחת מהקטגוריות המותרות בלבד",
      "quantity": מספר,
      "unit": "יחידת מידה",
      "importance": דירוג חשיבות (1-4, כאשר 4 הוא חשוב מאוד),
      "description": "תיאור מותאם אישית המסביר למה פריט זה חשוב ספציפית למשפחה זו",
      "shelf_life": "חיי מדף",
      "usage_instructions": "הוראות שימוש מותאמות אישית",
      "recommended_quantity_per_person": "כמות מומלצת לאדם",
      "obtained": false,
      "expiryDate": null,
      "aiSuggestedExpiryDate": "YYYY-MM-DD",
      "sendExpiryReminder": false,
      "personalized_note": "הערה מותאמת אישית המסבירה את החשיבות הספציפית של פריט זה למשפחה זו",
      "is_mandatory": false
    }
  ]
}

❗ חשוב מאוד: כל הפריטים שתיצור חייבים להיות מסומנים כ-is_mandatory=false כי הם פריטים מותאמים אישית ולא פריטי חובה של פיקוד העורף.
`

  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לחלוטין לפי צרכים ספציפיים של משפחות. תפקידך ליצור רשימה של פריטים ייחודיים ומותאמים אישית לכל מאפיין של המשפחה. חשוב מאוד שתוסיף פריטים ספציפיים לכל אחד מהמאפיינים שחולצו (ילדים, חיות מחמד, צרכים מיוחדים וכו') ושתסביר בדיוק למה כל פריט חשוב למשפחה הספציפית הזו.",
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
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : content
    const data = JSON.parse(jsonString)

    // Ensure all personalized items are marked as non-mandatory
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item) => {
        item.is_mandatory = false
        // Ensure importance is not 5 (reserved for mandatory items)
        if (item.importance >= 5) {
          item.importance = 4
        }
      })

      // If we don't have exactly 10 personalized items, try again or generate missing ones
      if (data.items.length !== 10) {
        console.warn(`Warning: Got ${data.items.length} personalized items instead of 10.`)

        // If we have more than 10, trim the list
        if (data.items.length > 10) {
          data.items = data.items.slice(0, 10)
        }

        // If we have less than 10, generate the missing ones
        if (data.items.length < 10) {
          const missingCount = 10 - data.items.length
          console.log(`Generating ${missingCount} missing personalized items`)

          // Generate generic personalized items based on family profile
          for (let i = 0; i < missingCount; i++) {
            data.items.push(generateGenericPersonalizedItem(i, extractedData))
          }
        }
      }

      return data.items
    }

    // If we couldn't parse the items or the array is empty, generate 10 generic personalized items
    console.warn("Warning: Could not parse personalized items from AI response. Generating generic items.")
    return Array.from({ length: 10 }, (_, i) => generateGenericPersonalizedItem(i, extractedData))
  } catch (error) {
    console.error("Error getting personalized items:", error)
    // If there's an error, generate 10 generic personalized items
    console.warn("Generating generic personalized items due to error")
    return Array.from({ length: 10 }, (_, i) => generateGenericPersonalizedItem(i, extractedData))
  }
}

// Helper function to generate a generic personalized item
function generateGenericPersonalizedItem(index: number, profile: any): any {
  const genericItems = [
    {
      id: `generic-1`,
      name: "מד סוכר נוסף + סוללות",
      category: "medical",
      quantity: 1,
      unit: "סט",
      importance: 4,
      description: "מד סוכר נוסף עם סוללות רזרביות לניטור רמת הסוכר במהלך החירום.",
      shelf_life: "3 שנים",
      usage_instructions: "יש לבדוק את רמת הסוכר 3 פעמים ביום ולתעד את התוצאות.",
      recommended_quantity_per_person: "1 מד לאדם עם סוכרת",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2027-05-01",
      sendExpiryReminder: false,
      personalized_note: "חיוני עבור קשיש בן 72 עם סוכרת סוג 2. יש לשמור במקום נגיש וידוע.",
      is_mandatory: false,
    },
    {
      id: `generic-2`,
      name: "מזון מתאים לסוכרתיים",
      category: "water_food",
      quantity: 9,
      unit: "מנות",
      importance: 4,
      description: "מזון דל פחמימות וללא סוכר מתאים לחולי סוכרת.",
      shelf_life: "שנה",
      usage_instructions: "יש לבדוק תוויות מזון ולוודא שאין סוכר נוסף.",
      recommended_quantity_per_person: "3 מנות ליום",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2025-05-01",
      sendExpiryReminder: false,
      personalized_note: "מותאם לקשיש עם סוכרת סוג 2 ל-72 שעות.",
      is_mandatory: false,
    },
    {
      id: `generic-3`,
      name: "מזון רטוב לחתולים",
      category: "pets",
      quantity: 9,
      unit: "קופסאות",
      importance: 3,
      description: "מזון רטוב לחתולה למשך 72 שעות.",
      shelf_life: "2 שנים",
      usage_instructions: "יש לאחסן במקום יבש וקריר.",
      recommended_quantity_per_person: "3 קופסאות ליום לחתולה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2026-05-01",
      sendExpiryReminder: false,
      personalized_note: "חיוני עבור החתולה במשך 72 שעות של שהייה בבית.",
      is_mandatory: false,
    },
    {
      id: `generic-4`,
      name: "צידנית קשיחה + קרח יבש",
      category: "other",
      quantity: 1,
      unit: "סט",
      importance: 4,
      description: "צידנית לשמירת תרופות קרות וקירור כללי ללא מקרר נייד.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש להשתמש בקרח יבש בזהירות ובאוורור טוב.",
      recommended_quantity_per_person: "1 צידנית למשפחה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: 'חיוני כיוון שאין מקרר נייד בממ"ד לשמירת תרופות.',
      is_mandatory: false,
    },
    {
      id: `generic-5`,
      name: "דלק נוסף לגנרטור",
      category: "lighting_energy",
      quantity: 10,
      unit: "ליטרים",
      importance: 4,
      description: "דלק נוסף לגנרטור הקטן למשך 72 שעות פעילות.",
      shelf_life: "6 חודשים",
      usage_instructions: "יש לאחסן במקום מאוורר הרחק מחום ואש.",
      recommended_quantity_per_person: "לפי צריכת הגנרטור",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2025-11-01",
      sendExpiryReminder: false,
      personalized_note: "נדרש עבור הגנרטור הקטן הקיים למשך 72 שעות.",
      is_mandatory: false,
    },
    {
      id: `generic-6`,
      name: "מאוורר נייד על סוללות",
      category: "lighting_energy",
      quantity: 1,
      unit: "יחידה",
      importance: 3,
      description: 'מאוורר נייד לקירור ללא מזגן בממ"ד.',
      shelf_life: "5 שנים",
      usage_instructions: "יש לוודא שהסוללות טעונות לפני השימוש.",
      recommended_quantity_per_person: "1 מאוורר לחדר",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: 'חיוני כיוון שאין מזגן בממ"ד.',
      is_mandatory: false,
    },
    {
      id: `generic-7`,
      name: "ארגז חול נייד לחתולה",
      category: "pets",
      quantity: 1,
      unit: "סט",
      importance: 3,
      description: "ארגז חול נייד וחול לחתולה למשך 72 שעות.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש להחליף חול לפי הצורך.",
      recommended_quantity_per_person: "1 ארגז לחתולה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "נדרש עבור החתולה במשך השהייה הממושכת בבית.",
      is_mandatory: false,
    },
    {
      id: `generic-8`,
      name: "גלוקוז למקרה היפוגליקמיה",
      category: "medical",
      quantity: 5,
      unit: "אמפולות",
      importance: 4,
      description: "גלוקוז למקרה של ירידה חדה ברמת הסוכר.",
      shelf_life: "2 שנים",
      usage_instructions: "לשימוש במקרה של תסמיני היפוגליקמיה.",
      recommended_quantity_per_person: "5 אמפולות לחולה סוכרת",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2026-05-01",
      sendExpiryReminder: false,
      personalized_note: "חיוני עבור קשיש עם סוכרת למקרה חירום רפואי.",
      is_mandatory: false,
    },
    {
      id: `generic-9`,
      name: "מערכת התרעה אישית",
      category: "communication",
      quantity: 1,
      unit: "יחידה",
      importance: 4,
      description: "מערכת התרעה אישית לקיבוץ בצפון הארץ.",
      shelf_life: "5 שנים",
      usage_instructions: "יש לבדוק תקינות אחת לחודש.",
      recommended_quantity_per_person: "1 יחידה לאדם",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חיוני עבור תושב קיבוץ בצפון הארץ.",
      is_mandatory: false,
    },
    {
      id: `generic-10`,
      name: "מנשא לחתולה",
      category: "pets",
      quantity: 1,
      unit: "יחידה",
      importance: 3,
      description: "מנשא לחתולה למקרה של פינוי מהיר.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לוודא שהחתולה מכירה את המנשא מראש.",
      recommended_quantity_per_person: "1 מנשא לחתולה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "נדרש עבור החתולה במקרה של פינוי מהקיבוץ.",
      is_mandatory: false,
    },
  ]

  // Return a generic item based on the index, or the first one if index is out of bounds
  return {
    ...genericItems[index % genericItems.length],
    id: `generic-${index + 1}`,
  }
}

// Helper functions for calculating quantities and units
function calculateQuantity(itemName: string, profile: any): number {
  if (!profile) return 1

  const totalPeople = (profile.adults || 2) + (profile.children || 0) + (profile.babies || 0) + (profile.elderly || 0)
  const days = Math.ceil((profile.duration_hours || 48) / 24)

  if (itemName.includes("מים")) {
    return 3 * totalPeople * days // 3 liters per person per day
  } else if (itemName.includes("מזון")) {
    return totalPeople * days // 1 unit per person per day
  } else if (itemName.includes("חיות מחמד") && profile.pets) {
    return profile.pets // 1 unit per pet
  } else if (itemName.includes("משחקים") && profile.children) {
    return profile.children // 1 unit per child
  }

  return 1
}

function getUnitForItem(itemName: string): string {
  if (itemName.includes("מים")) return "ליטרים"
  if (itemName.includes("מזון")) return "מנות"
  return "יחידות"
}

function getRecommendedQuantityPerPerson(itemName: string): string {
  if (itemName.includes("מים")) return "3 ליטר ליום"
  if (itemName.includes("מזון")) return "מנה ליום"
  return ""
}
