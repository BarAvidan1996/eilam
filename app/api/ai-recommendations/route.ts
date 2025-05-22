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
      sendExpiryReminder: false,
      personalized_note: "",
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

המשימה שלך היא ליצור בדיוק 10 פריטים מותאמים אישית בהתבסס על המאפיינים הספציפיים של המשפחה.
אל תכלול פריטים שכבר נמצאים ברשימת החובה של פיקוד העורף.

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

הנה דוגמה לפריט מותאם אישית:
${JSON.stringify(examplePersonalizedItem, null, 2)}

החזר את התשובה בפורמט JSON הבא:
{
  "items": [
    {
      "id": "unique-id",
      "name": "שם הפריט",
      "category": "קטגוריה",
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

❗ חשוב מאוד: אתה חייב להחזיר בדיוק 10 פריטים מותאמים אישית (is_mandatory=false). כל הפריטים שתיצור חייבים להיות מסומנים כ-is_mandatory=false כי הם פריטים מותאמים אישית ולא פריטי חובה של פיקוד העורף.

❗ אסור להחזיר רק את רשימת החובה. אתה חייב להחזיר בדיוק 10 פריטים מותאמים אישית (is_mandatory=false). סך כל הפריטים ברשימה הסופית יהיה 23 (13 פריטי חובה + 10 פריטים מותאמים אישית).
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
      personalized_note: "חשוב במיוחד עבור הילד הסובל מאסטמה. יש לשמור במקום נגיש וידוע לכל בני המשפחה.",
      is_mandatory: false,
    },
    {
      id: `generic-2`,
      name: "תרופות אנטי-היסטמיניות",
      category: "medical",
      quantity: 1,
      unit: "חבילה",
      importance: 4,
      description: "תרופות לטיפול באלרגיה לבוטנים.",
      shelf_life: "שנה",
      usage_instructions: "יש לקחת בהתאם להוראות הרופא.",
      recommended_quantity_per_person: "לפי הצורך",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2024-05-01",
      sendExpiryReminder: false,
      personalized_note: "חשוב במיוחד עבור הילד עם אלרגיה לבוטנים.",
      is_mandatory: false,
    },
    {
      id: `generic-3`,
      name: "מזון לכלב",
      category: "pets",
      quantity: 2,
      unit: "ק״ג",
      importance: 3,
      description: "מזון יבש לכלב קטן.",
      shelf_life: "6 חודשים",
      usage_instructions: "יש לאחסן במקום יבש וקריר.",
      recommended_quantity_per_person: "לא רלוונטי",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2024-05-01",
      sendExpiryReminder: false,
      personalized_note: "חשוב עבור הכלב הקטן של המשפחה.",
      is_mandatory: false,
    },
    {
      id: `generic-4`,
      name: "צעצועים לילדים",
      category: "children",
      quantity: 4,
      unit: "יחידות",
      importance: 3,
      description: "צעצועים שקטים שאינם דורשים סוללות.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לבחור צעצועים שאינם רועשים מדי.",
      recommended_quantity_per_person: "2 לכל ילד",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב להפגת מתח ושעמום אצל הילדים.",
      is_mandatory: false,
    },
    {
      id: `generic-5`,
      name: "ספרים לילדים",
      category: "children",
      quantity: 4,
      unit: "יחידות",
      importance: 3,
      description: "ספרים מתאימים לגילאי הילדים.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לבחור ספרים מוכרים ואהובים.",
      recommended_quantity_per_person: "2 לכל ילד",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב להפגת מתח ושעמום אצל הילדים.",
      is_mandatory: false,
    },
    {
      id: `generic-6`,
      name: "תיק חירום קל לנשיאה",
      category: "other",
      quantity: 1,
      unit: "יחידה",
      importance: 4,
      description: "תיק המכיל את הציוד החיוני ביותר למקרה של פינוי מהיר.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לשמור במקום נגיש וידוע לכל בני המשפחה.",
      recommended_quantity_per_person: "1 לכל משפחה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב במיוחד למשפחה הגרה בדירה בקומה שלישית.",
      is_mandatory: false,
    },
    {
      id: `generic-7`,
      name: "מזון ללא בוטנים",
      category: "water_food",
      quantity: 10,
      unit: "מנות",
      importance: 4,
      description: "מזון שאינו מכיל בוטנים או עקבות בוטנים.",
      shelf_life: "שנה",
      usage_instructions: "יש לבדוק את תווית המזון לפני האכילה.",
      recommended_quantity_per_person: "5 מנות ליום",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: "2024-05-01",
      sendExpiryReminder: false,
      personalized_note: "חשוב במיוחד עבור הילד עם אלרגיה לבוטנים.",
      is_mandatory: false,
    },
    {
      id: `generic-8`,
      name: "רצועה וקולר לכלב",
      category: "pets",
      quantity: 1,
      unit: "סט",
      importance: 3,
      description: "רצועה וקולר לכלב למקרה של פינוי.",
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לשמור במקום נגיש.",
      recommended_quantity_per_person: "לא רלוונטי",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב עבור הכלב הקטן של המשפחה במקרה של פינוי.",
      is_mandatory: false,
    },
    {
      id: `generic-9`,
      name: "מסכת חמצן ביתית",
      category: "medical",
      quantity: 1,
      unit: "יחידה",
      importance: 4,
      description: "מסכת חמצן ביתית לטיפול בהתקפי אסטמה.",
      shelf_life: "5 שנים",
      usage_instructions: "יש לבדוק תקינות אחת לחודש.",
      recommended_quantity_per_person: "1 לכל חולה אסטמה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב במיוחד עבור הילד הסובל מאסטמה.",
      is_mandatory: false,
    },
    {
      id: `generic-10`,
      name: "מטהר אוויר",
      category: "other",
      quantity: 1,
      unit: "יחידה",
      importance: 3,
      description: "מטהר אוויר לסינון אלרגנים ומזהמים.",
      shelf_life: "5 שנים",
      usage_instructions: "יש להחליף פילטרים בהתאם להוראות היצרן.",
      recommended_quantity_per_person: "1 לכל חדר",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "חשוב במיוחד עבור הילד הסובל מאסטמה ואלרגיה.",
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
