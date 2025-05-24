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

המשימה שלך היא ליצור לפחות 10 פריטים מותאמים אישית בהתבסס על המאפיינים הספציפיים של המשפחה.
אל תכלול פריטים שכבר נמצאים ברשימת החובה של פיקוד העורף (מים, מזון, ערכת עזרה ראשונה, תרופות, רדיו, פנסים, מטענים, מטף, מסמכים, דלק, משחקים לילדים, ציוד לחיות מחמד).

הנה כיצד להתאים את הרשימה באופן מושלם:

1. התייחס לכל מאפיין ייחודי בפרומפט המקורי:
   - אם מוזכר היריון - הוסף פריטים ספציפיים להיריון (כריות תמיכה, ויטמינים, בגדים נוחים)
   - אם מוזכרת מגבלת ניידות - הוסף פריטים שמקלים על תנועה (מקל הליכה מתקפל, כיסא נייד)
   - אם מוזכרת אלרגיה - הוסף פריטים נגד אלרגיה (תרופות, מסכות, מסנני אוויר)
   - אם מוזכר מצב רפואי - הוסף פריטים רפואיים ספציפיים (ציוד מדידה, תרופות מיוחדות)

2. התייחס למבנה המשפחה:
   - אם אדם גר לבד - הוסף פריטים שמתאימים לאדם בודד (ערכת חירום קומפקטית, אמצעי תקשורת נוספים)
   - למשפחות גדולות - הוסף פריטים שמתאימים למספר אנשים (ציוד מודולרי, פתרונות אחסון)

3. התייחס לסוג המגורים:
   - דירה בקומה גבוהה - הוסף פריטים שמסייעים בירידה/עלייה במדרגות (תיק גב קל, פנס ראש)
   - בית פרטי - הוסף פריטים לאבטחת הבית (מנעולים נוספים, ציוד איטום)
   - מרחק ממקלט - הוסף פריטים שמסייעים בהגעה מהירה למקלט (תיק חירום מוכן, נעליים יציבות)

4. התייחס לחיות מחמד:
   - סוג החיה - הוסף פריטים ספציפיים לסוג החיה (לכלב: רצועה, קולר, מחסום פה; לחתול: ארגז חול נייד)
   - גודל החיה - התאם את הכמויות והגדלים (מזון, מנשא, שמיכה)

5. התייחס למיקום גיאוגרפי:
   - אזורי גבול - הוסף פריטים להגנה מוגברת
   - אזורים חמים - הוסף פריטים לקירור והתמודדות עם חום
   - אזורים קרים - הוסף פריטים לחימום והתמודדות עם קור
   - עיר גדולה/יישוב קטן - התאם לזמינות משאבים

6. התייחס למשך זמן החירום:
   - פחות מ-24 שעות - פריטים בסיסיים וקומפקטיים
   - 24-72 שעות - פריטים לטווח בינוני
   - מעל 72 שעות - פריטים לטווח ארוך (ציוד לבישול, היגיינה מתקדמת)

7. הוסף פריטים ייחודיים שמתייחסים לשילוב של מספר מאפיינים:
   - לדוגמה: אדם בהיריון עם אלרגיה - מסכה מיוחדת שנוחה בהיריון
   - לדוגמה: קשיש עם כלב - רצועה מיוחדת שקלה לאחיזה

8. הסבר בפירוט למה כל פריט חשוב ספציפית למשתמש:
   - במקום: "כרית תמיכה לגב"
   - כתוב: "כרית תמיכה ארגונומית לגב התחתון, חיונית במיוחד לנשים בהיריון בחודש השביעי בעת ישיבה ממושכת במקלט"

9. וודא שכל הקטגוריות הן מהרשימה המותרת:
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
      "sendExpiryReminder: false,
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

// שיפור פונקציית הגיבוי generateGenericPersonalizedItem
// החלף את הפונקציה הקיימת עם הפונקציה המשופרת הזו:

// Helper function to generate a generic personalized item based on profile
function generateGenericPersonalizedItem(index: number, profile: any): any {
  // מערך של פריטים מותאמים אישית לפי קטגוריות שונות
  const itemsByCategory = {
    // פריטים לתינוקות
    babies: [
      {
        name: "חיתולים וחיתולי בד",
        category: "children",
        description: "חיתולים חד-פעמיים וחיתולי בד רב-פעמיים לתינוקות.",
        personalized_note: `מותאם ל-${profile?.babies || 1} תינוקות במשפחה.`,
        importance: 4,
      },
      {
        name: "מזון לתינוקות ובקבוקים",
        category: "children",
        description: "מזון מוכן לתינוקות ובקבוקים נוספים.",
        personalized_note: `חיוני עבור ${profile?.babies || 1} תינוקות במשפחה.`,
        importance: 4,
      },
      {
        name: "מוצצים נוספים",
        category: "children",
        description: "מוצצים נוספים למקרה של אובדן.",
        personalized_note: "חשוב להרגעת תינוקות במצבי לחץ.",
        importance: 3,
      },
    ],

    // פריטים לילדים
    children: [
      {
        name: "ספרי צביעה ועפרונות צבעוניים",
        category: "children",
        description: "פעילות יצירתית להעסקת הילדים ולהפגת מתח במהלך החירום.",
        personalized_note: `מותאם ל-${profile?.children || 1} ילדים במשפחה.`,
        importance: 3,
      },
      {
        name: "חטיפים בריאים לילדים",
        category: "water_food",
        description: "חטיפים מזינים ומוכרים לילדים למקרה שהמזון הרגיל לא זמין.",
        personalized_note: `כמות מחושבת עבור ${profile?.children || 1} ילדים למשך ${Math.ceil((profile?.duration_hours || 72) / 24)} ימים.`,
        importance: 3,
      },
      {
        name: "משחקי קלפים ומשחקים קומפקטיים",
        category: "children",
        description: "משחקים קטנים שאינם דורשים מקום רב להעסקת הילדים.",
        personalized_note: "חשוב להפגת מתח ושעמום בזמן שהייה ממושכת.",
        importance: 2,
      },
    ],

    // פריטים לקשישים
    elderly: [
      {
        name: "משקפיים רזרביות",
        category: "elderly",
        description: "משקפיים נוספות למקרה של שבירה או אובדן.",
        personalized_note: `חשוב עבור ${profile?.elderly || 1} קשישים במשפחה.`,
        importance: 3,
      },
      {
        name: "כרית אורתופדית ניידת",
        category: "elderly",
        description: "כרית תמיכה לגב ולצוואר לקשישים.",
        personalized_note: `מותאם לנוחות ${profile?.elderly || 1} קשישים במשפחה.`,
        importance: 3,
      },
      {
        name: "מקל הליכה מתקפל",
        category: "elderly",
        description: "מקל הליכה קל ומתקפל לסיוע בניידות.",
        personalized_note: "חיוני לקשישים בעת פינוי או הליכה למקלט.",
        importance: 4,
      },
    ],

    // פריטים לחיות מחמד
    pets: [
      {
        name: "מזון נוסף לחיות מחמד",
        category: "pets",
        description: "מזון יבש נוסף לחיות המחמד למשך תקופת החירום.",
        personalized_note: `מחושב עבור ${profile?.pets || 1} חיות מחמד למשך ${Math.ceil((profile?.duration_hours || 72) / 24)} ימים.`,
        importance: 4,
      },
      {
        name: "רצועה וקולר עם פרטי זיהוי",
        category: "pets",
        description: "ציוד זיהוי וביטחון לחיות המחמד במקרה של פינוי.",
        personalized_note: `נדרש עבור ${profile?.pets || 1} חיות מחמד במשפחה.`,
        importance: 3,
      },
      {
        name: "שמיכה מוכרת לחיית המחמד",
        category: "pets",
        description: "שמיכה או בד מוכר לחיית המחמד להרגעה במצבי לחץ.",
        personalized_note: "חשוב להפחתת חרדה אצל חיות מחמד במצבי חירום.",
        importance: 2,
      },
    ],

    // פריטים לצרכים מיוחדים
    special_needs: [
      {
        name: "תרופות נוספות לצרכים מיוחדים",
        category: "special_needs",
        description: "תרופות נוספות למצבים רפואיים מיוחדים.",
        personalized_note: `מותאם לצרכים המיוחדים: ${profile?.special_needs || "צרכים רפואיים"}.`,
        importance: 4,
      },
      {
        name: "ציוד רפואי מיוחד",
        category: "special_needs",
        description: "ציוד רפואי מיוחד בהתאם לצרכים האישיים.",
        personalized_note: "חיוני לטיפול במצבים רפואיים מיוחדים בזמן חירום.",
        importance: 4,
      },
      {
        name: "מסכת חמצן ניידת",
        category: "special_needs",
        description: "מסכת חמצן ניידת לבעלי בעיות נשימה.",
        personalized_note: "חיונית לבעלי בעיות נשימה בזמן חירום.",
        importance: 4,
      },
    ],

    // פריטים להיריון
    pregnancy: [
      {
        name: "כרית תמיכה להיריון",
        category: "special_needs",
        description: "כרית תמיכה מיוחדת לנשים בהיריון לישיבה ושכיבה נוחה.",
        personalized_note: "חיונית לנוחות ותמיכה בגב ובבטן בזמן שהייה ממושכת.",
        importance: 3,
      },
      {
        name: "ויטמינים וכדורי ברזל להיריון",
        category: "medical",
        description: "תוספי תזונה חיוניים לנשים בהיריון.",
        personalized_note: "חשוב לשמירה על בריאות האם והעובר בזמן חירום.",
        importance: 4,
      },
      {
        name: "בגדים נוחים להיריון",
        category: "other",
        description: "בגדים נוחים ומתאימים להיריון לשהייה ממושכת.",
        personalized_note: "חשוב לנוחות ולמניעת לחץ על הבטן בזמן שהייה ממושכת.",
        importance: 2,
      },
    ],

    // פריטים לאלרגיות
    allergies: [
      {
        name: "תרופות אנטי-היסטמיניות",
        category: "medical",
        description: "תרופות נגד אלרגיה למקרה של התקף אלרגי.",
        personalized_note: "חיוני לבעלי אלרגיות בזמן חירום, במיוחד כשהסביבה משתנה.",
        importance: 4,
      },
      {
        name: "מסכות N95 לסינון אבק ואלרגנים",
        category: "medical",
        description: "מסכות מיוחדות לסינון אבק, אבקנים ואלרגנים אחרים.",
        personalized_note: "חיוני לבעלי אלרגיות נשימתיות, במיוחד במקלטים.",
        importance: 4,
      },
      {
        name: "מסנן אוויר נייד",
        category: "special_needs",
        description: "מסנן אוויר קטן המופעל על סוללות לסינון אלרגנים.",
        personalized_note: "חשוב לבעלי אלרגיות חמורות בזמן שהייה במקלטים.",
        importance: 3,
      },
    ],

    // פריטים למגורים בקומות גבוהות
    high_floor: [
      {
        name: "תיק גב קל לפינוי מהיר",
        category: "other",
        description: "תיק גב קל המכיל את הציוד החיוני ביותר לפינוי מהיר.",
        personalized_note: "חיוני למי שגר בקומות גבוהות וצריך לרדת במדרגות בזמן אזעקה.",
        importance: 4,
      },
      {
        name: "נעליים יציבות וקלות",
        category: "other",
        description: "נעליים יציבות וקלות שניתן לנעול במהירות בזמן אזעקה.",
        personalized_note: "חשוב למי שצריך לרדת במדרגות במהירות בזמן אזעקה.",
        importance: 3,
      },
      {
        name: "פנס ראש",
        category: "lighting_energy",
        description: "פנס ראש המשאיר את הידיים חופשיות בזמן ירידה במדרגות.",
        personalized_note: "חיוני למי שגר בקומות גבוהות, במיוחד בלילה או בהפסקת חשמל.",
        importance: 3,
      },
    ],

    // פריטים כלליים
    general: [
      {
        name: "סוללות נטענות ומטען סולארי",
        category: "lighting_energy",
        description: "סוללות נטענות ומטען סולארי לטעינה ללא חשמל.",
        personalized_note: "שימושי לטעינת מכשירים קטנים במהלך הפסקות חשמל.",
        importance: 3,
      },
      {
        name: "שקיות אשפה וכפפות חד-פעמיות",
        category: "hygiene",
        description: "שקיות לאשפה וכפפות לשמירה על היגיינה.",
        personalized_note: "חשוב לשמירה על ניקיון וסניטציה.",
        importance: 2,
      },
      {
        name: "נרות",
        category: "lighting_energy",
        description: "נרות לתאורה ולחימום במקרה של הפסקת חשמל ממושכת.",
        personalized_note: "גיבוי לפנסים ולתאורה ממושכת.",
        importance: 2,
      },
      {
        name: "מגבות נייר ומגבונים",
        category: "hygiene",
        description: "מגבות נייר ומגבונים לחים לניקוי ללא מים.",
        personalized_note: "שימושי כאשר אין גישה למים זורמים.",
        importance: 2,
      },
      {
        name: "ערכת תיקונים קטנה",
        category: "other",
        description: "ערכה קטנה הכוללת כלי עבודה בסיסיים, סלוטייפ, חוט ברזל וכו'.",
        personalized_note: "שימושית לתיקונים קטנים בזמן חירום.",
        importance: 2,
      },
      {
        name: "מטהר מים נייד",
        category: "water_food",
        description: "מטהר מים נייד לטיהור מים במקרה שאין גישה למים נקיים.",
        personalized_note: "חשוב במקרה של פגיעה במערכת המים.",
        importance: 3,
      },
      {
        name: "שמיכה תרמית",
        category: "other",
        description: "שמיכה תרמית קלה לשמירה על חום הגוף.",
        personalized_note: "שימושית במקלטים קרים או בלילות קרים.",
        importance: 2,
      },
      {
        name: "אמצעי בישול חלופי",
        category: "water_food",
        description: "כירת גז קטנה או כירה על בסיס אלכוהול לחימום מזון.",
        personalized_note: "שימושי לחימום מזון במקרה של הפסקת חשמל ממושכת.",
        importance: 2,
      },
      {
        name: "מזון מוכן לאכילה",
        category: "water_food",
        description: "מזון שאינו דורש בישול או חימום.",
        personalized_note: "חשוב במקרה שאין אפשרות לבשל או לחמם מזון.",
        importance: 3,
      },
      {
        name: "ערכת עזרה ראשונה מורחבת",
        category: "medical",
        description: "ערכת עזרה ראשונה מורחבת הכוללת פריטים נוספים מעבר לערכה הבסיסית.",
        personalized_note: "חשובה לטיפול במגוון רחב יותר של פציעות ומצבים רפואיים.",
        importance: 3,
      },
    ],
  }

  // בחירת קטגוריות רלוונטיות בהתאם לפרופיל
  const relevantCategories = []

  if (profile?.babies > 0) relevantCategories.push("babies")
  if (profile?.children > 0) relevantCategories.push("children")
  if (profile?.elderly > 0) relevantCategories.push("elderly")
  if (profile?.pets > 0) relevantCategories.push("pets")
  if (profile?.special_needs) relevantCategories.push("special_needs")

  // בדיקת מאפיינים נוספים מהפרומפט
  const promptLower = JSON.stringify(profile).toLowerCase()
  if (promptLower.includes("היריון") || promptLower.includes("בהריון") || promptLower.includes("pregnant")) {
    relevantCategories.push("pregnancy")
  }
  if (promptLower.includes("אלרגי") || promptLower.includes("אלרגיה") || promptLower.includes("allerg")) {
    relevantCategories.push("allergies")
  }
  if (
    promptLower.includes("קומה") ||
    promptLower.includes("מדרגות") ||
    promptLower.includes("floor") ||
    promptLower.includes("stairs") ||
    (profile?.housing_details &&
      (profile.housing_details.includes("קומה") || profile.housing_details.includes("מדרגות")))
  ) {
    relevantCategories.push("high_floor")
  }

  // תמיד להוסיף פריטים כלליים
  relevantCategories.push("general")

  // יצירת רשימת פריטים מכל הקטגוריות הרלוונטיות
  let allRelevantItems = []
  relevantCategories.forEach((category) => {
    if (itemsByCategory[category]) {
      allRelevantItems = [...allRelevantItems, ...itemsByCategory[category]]
    }
  })

  // אם אין מספיק פריטים רלוונטיים, הוסף פריטים כלליים
  if (allRelevantItems.length < 10) {
    const generalItemsNeeded = 10 - allRelevantItems.length
    allRelevantItems = [...allRelevantItems, ...itemsByCategory.general.slice(0, generalItemsNeeded)]
  }

  // בחירת פריט לפי האינדקס
  const selectedItem = allRelevantItems[index % allRelevantItems.length]

  if (!selectedItem) {
    // פריט ברירת מחדל אם אין פריט מתאים
    return {
      id: `generic-${index + 1}`,
      name: "פריט כללי מותאם אישית",
      category: "other",
      quantity: 1,
      unit: "יחידות",
      importance: 2,
      description: "פריט כללי המותאם לצרכי המשפחה.",
      shelf_life: "שנה",
      usage_instructions: "יש להשתמש לפי הצורך.",
      recommended_quantity_per_person: "1 יחידה",
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "פריט מותאם אישית לצרכי המשפחה.",
      is_mandatory: false,
    }
  }

  // החזרת הפריט המלא עם כל השדות הנדרשים
  return {
    id: `generic-${index + 1}`,
    name: selectedItem.name,
    category: selectedItem.category,
    quantity: calculateQuantityForItem(selectedItem.name, profile),
    unit: getUnitForItem(selectedItem.name),
    importance: selectedItem.importance,
    description: selectedItem.description,
    shelf_life: getShelfLifeForItem(selectedItem.name),
    usage_instructions: getUsageInstructionsForItem(selectedItem.name),
    recommended_quantity_per_person: getRecommendedQuantityForItem(selectedItem.name),
    obtained: false,
    expiryDate: null,
    aiSuggestedExpiryDate: getExpiryDateForItem(selectedItem.name),
    sendExpiryReminder: false,
    personalized_note: selectedItem.personalized_note,
    is_mandatory: false,
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

function calculateQuantityForItem(itemName: string, profile: any): number {
  if (!profile) return 1

  const totalPeople = (profile.adults || 1) + (profile.children || 0) + (profile.babies || 0) + (profile.elderly || 0)
  const days = Math.ceil((profile.duration_hours || 72) / 24)

  if (itemName.includes("חיתולים") && profile.babies) {
    return profile.babies * days * 8 // 8 diapers per baby per day
  } else if (itemName.includes("מזון") && itemName.includes("חיות")) {
    return (profile.pets || 1) * days * 2 // 2 meals per pet per day
  } else if (itemName.includes("ספר") || itemName.includes("משחק")) {
    return profile.children || 1
  } else if (itemName.includes("משקפיים")) {
    return profile.elderly || 1
  } else if (itemName.includes("חטיף")) {
    return (profile.children || 1) * days * 2 // 2 snacks per child per day
  }

  return Math.max(1, Math.ceil(totalPeople / 2)) // Default: 1 item per 2 people
}

function getUnitForItem(itemName: string): string {
  if (itemName.includes("מים")) return "ליטרים"
  if (itemName.includes("מזון") || itemName.includes("חטיף")) return "מנות"
  if (itemName.includes("חיתולים")) return "יחידות"
  if (itemName.includes("סוללות")) return "יחידות"
  if (itemName.includes("נרות")) return "יחידות"
  return "יחידות"
}

function getShelfLifeForItem(itemName: string): string {
  if (itemName.includes("מזון") || itemName.includes("חטיף")) return "שנה"
  if (itemName.includes("סוללות")) return "5 שנים"
  if (itemName.includes("תרופות")) return "2 שנים"
  if (itemName.includes("חיתולים")) return "3 שנים"
  if (itemName.includes("נרות")) return "לא רלוונטי"
  return "שנה"
}

function getUsageInstructionsForItem(itemName: string): string {
  if (itemName.includes("סוללות")) return "יש לאחסן במקום יבש וקריר."
  if (itemName.includes("מזון")) return "יש לבדוק תאריכי תפוגה."
  if (itemName.includes("נרות")) return "יש להשתמש בזהירות ובאוורור טוב."
  if (itemName.includes("תרופות")) return "יש לשמור במקום קריר ויבש."
  return "יש להשתמש לפי הצורך."
}

function getRecommendedQuantityForItem(itemName: string): string {
  if (itemName.includes("חיתולים")) return "8 ליום לתינוק"
  if (itemName.includes("מזון") && itemName.includes("חיות")) return "2 מנות ליום לחיה"
  if (itemName.includes("חטיף")) return "2 ליום לילד"
  return "לפי הצורך"
}

function getExpiryDateForItem(itemName: string): string | null {
  const now = new Date()
  if (itemName.includes("מזון") || itemName.includes("חטיף")) {
    now.setFullYear(now.getFullYear() + 1)
    return now.toISOString().split("T")[0]
  }
  if (itemName.includes("תרופות")) {
    now.setFullYear(now.getFullYear() + 2)
    return now.toISOString().split("T")[0]
  }
  return null
}

function getRecommendedQuantityPerPerson(itemName: string): string {
  if (itemName.includes("מים")) return "3 ליטר ליום"
  if (itemName.includes("מזון")) return "מנה ליום"
  return ""
}
