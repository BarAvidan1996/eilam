import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define mandatory items that must be included
const MANDATORY_ITEMS = [
  {
    key: "water",
    name: "מים (3 ליטר לאדם ליום)",
    keywords: ["מים", "שתיה", "שתייה"],
    category: "water_food",
    importance: 5,
    description: "מים לשתייה ולשימוש בסיסי. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לאחסן במקום קריר ויבש. מומלץ להחליף כל שנה.",
  },
  {
    key: "food",
    name: "מזון יבש/משומר",
    keywords: ["מזון", "אוכל", "שימורים", "קופסאות", "יבש"],
    category: "water_food",
    importance: 5,
    description: "מזון שאינו דורש קירור או בישול. פריט חובה של פיקוד העורף.",
    shelf_life: "שנה",
    usage_instructions: "יש לבדוק תאריכי תפוגה ולהחליף בהתאם.",
  },
  {
    key: "first_aid",
    name: "ערכת עזרה ראשונה",
    keywords: ["עזרה", "ראשונה", "תחבושות", "פלסטרים"],
    category: "medical",
    importance: 5,
    description: "ערכה בסיסית לטיפול בפציעות קלות. פריט חובה של פיקוד העורף.",
    shelf_life: "שנתיים",
    usage_instructions: "יש לבדוק שלמות ותקינות הפריטים אחת לחצי שנה.",
  },
  {
    key: "medications",
    name: "תרופות קבועות + מרשמים מודפסים",
    keywords: ["תרופות", "מרשמים", "כדורים", "רפואה"],
    category: "medical",
    importance: 5,
    description: "תרופות קבועות לבני המשפחה ומרשמים מודפסים. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לתרופה",
    usage_instructions: "יש לוודא מלאי לפחות לשבוע ימים ולבדוק תאריכי תפוגה.",
  },
  {
    key: "radio",
    name: "רדיו + סוללות",
    keywords: ["רדיו", "מקלט"],
    category: "communication",
    importance: 5,
    description: "רדיו המופעל על סוללות לקבלת עדכונים. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
  },
  {
    key: "flashlights",
    name: "פנסים + סוללות",
    keywords: ["פנס", "פנסים", "תאורה"],
    category: "lighting_energy",
    importance: 5,
    description: "פנסים לתאורת חירום. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לחודש ולהחליף סוללות בהתאם.",
  },
  {
    key: "chargers",
    name: "מטענים ניידים לטלפונים",
    keywords: ["מטען", "מטענים", "סוללה", "פאוור"],
    category: "communication",
    importance: 5,
    description: "מטענים ניידים לטעינת טלפונים ניידים. פריט חובה של פיקוד העורף.",
    shelf_life: "3 שנים",
    usage_instructions: "יש לוודא שהמטענים טעונים במלואם.",
  },
  {
    key: "special_equipment",
    name: "ציוד ייחודי לתינוקות/קשישים/חיות מחמד",
    keywords: ["ציוד", "ייחודי", "תינוקות", "קשישים", "חיות"],
    category: "other",
    importance: 5,
    description: "ציוד ייחודי בהתאם לצרכים המיוחדים של בני המשפחה. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לצרכים הספציפיים של המשפחה.",
  },
  {
    key: "documents",
    name: "עותקים של מסמכים חשובים",
    keywords: ["מסמכים", "תעודות", "דרכון", "רישיון"],
    category: "documents_money",
    importance: 5,
    description: "עותקים של תעודות זהות, דרכונים, רישיונות וכו'. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום אטום למים ולעדכן בהתאם לשינויים.",
  },
  {
    key: "fire_extinguisher",
    name: "מטף כיבוי אש",
    keywords: ["מטף", "כיבוי", "אש", "שריפה"],
    category: "other",
    importance: 5,
    description: "מטף לכיבוי שריפות קטנות. פריט חובה של פיקוד העורף.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לשנה ולתחזק בהתאם להוראות היצרן.",
  },
  {
    key: "fuel",
    name: "חצי מיכל דלק ברכב",
    keywords: ["דלק", "רכב", "מיכל", "בנזין", "סולר"],
    category: "other",
    importance: 5,
    description: "שמירה על לפחות חצי מיכל דלק ברכב. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לוודא שהרכב תמיד עם לפחות חצי מיכל דלק.",
  },
  {
    key: "games",
    name: "משחקים ופעילויות לילדים",
    keywords: ["משחקים", "פעילויות", "ילדים", "שעמום"],
    category: "children",
    importance: 5,
    description: "משחקים ופעילויות להפגת מתח ושעמום. פריט חובה של פיקוד העורף.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש להתאים לגיל הילדים ולהעדפותיהם.",
  },
  {
    key: "pet_supplies",
    name: "ציוד בסיסי לחיות מחמד",
    keywords: ["חיות", "מחמד", "כלב", "חתול", "מזון"],
    category: "pets",
    importance: 5,
    description: "מזון, מים, ותרופות לחיות המחמד. פריט חובה של פיקוד העורף.",
    shelf_life: "בהתאם לפריט",
    usage_instructions: "יש להתאים לסוג חיית המחמד ולצרכיה.",
  },
]

// Default personalized items to add if AI fails to generate enough
const DEFAULT_PERSONALIZED_ITEMS = [
  {
    name: "תיק חירום מוכן לפינוי מהיר",
    category: "other",
    importance: 4,
    description: "תיק המכיל את כל הציוד החיוני למקרה של פינוי מהיר מהבית.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום נגיש וקל לאחזור.",
  },
  {
    name: "מסכות אב״כ",
    category: "safety",
    importance: 4,
    description: "מסכות להגנה מפני חומרים כימיים.",
    shelf_life: "10 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לשנה.",
  },
  {
    name: "שמיכות חירום",
    category: "other",
    importance: 3,
    description: "שמיכות דקות עשויות מחומר מבודד חום.",
    shelf_life: "10 שנים",
    usage_instructions: "יש לשמור במקום יבש.",
  },
  {
    name: "כסף מזומן",
    category: "documents_money",
    importance: 4,
    description: "סכום כסף מזומן למקרה שלא ניתן להשתמש בכרטיסי אשראי.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום בטוח ונגיש.",
  },
  {
    name: "מטהר מים",
    category: "water_food",
    importance: 3,
    description: "מטהר מים לטיהור מים ממקורות לא בטוחים.",
    shelf_life: "5 שנים",
    usage_instructions: "יש לבדוק תקינות אחת לשנה.",
  },
  {
    name: "ערכת תיקונים בסיסית",
    category: "tools",
    importance: 3,
    description: "ערכה הכוללת כלים בסיסיים לתיקונים קלים.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לשמור במקום יבש ונגיש.",
  },
  {
    name: "ציוד היגיינה אישית",
    category: "hygiene",
    importance: 4,
    description: "ציוד היגיינה אישי כגון מברשות שיניים, משחת שיניים, סבון וכו'.",
    shelf_life: "שנה",
    usage_instructions: "יש להחליף אחת לשנה.",
  },
  {
    name: "תיק עזרה ראשונה מורחב",
    category: "medical",
    importance: 4,
    description: "תיק עזרה ראשונה מורחב הכולל ציוד לטיפול בפציעות קשות יותר.",
    shelf_life: "שנתיים",
    usage_instructions: "יש לבדוק תקינות אחת לחצי שנה.",
  },
  {
    name: "מסמכי ביטוח",
    category: "documents_money",
    importance: 3,
    description: "עותקים של מסמכי ביטוח רפואי, ביטוח דירה וכו'.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לעדכן בהתאם לשינויים.",
  },
  {
    name: "רשימת טלפונים חיוניים",
    category: "communication",
    importance: 4,
    description: "רשימה מודפסת של מספרי טלפון חיוניים.",
    shelf_life: "לא רלוונטי",
    usage_instructions: "יש לעדכן אחת לחצי שנה.",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { prompt, extractedData } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create mandatory items first
    const mandatoryItems = MANDATORY_ITEMS.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category,
      quantity: calculateQuantity(item.name, extractedData),
      unit: getUnitForItem(item.name),
      importance: item.importance,
      description: item.description,
      shelf_life: item.shelf_life,
      usage_instructions: item.usage_instructions,
      recommended_quantity_per_person: getRecommendedQuantityPerPerson(item.name),
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: null,
      sendExpiryReminder: false,
      personalized_note: "",
      is_mandatory: true,
    }))

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

המשימה שלך היא ליצור לפחות 10 פריטים מותאמים אישית (ולא יותר מ-15) בהתבסס על המאפיינים הספציפיים של המשפחה.
אל תכלול פריטים שכבר נמצאים ברשימת החובה של פיקוד העורף.

❗ חשוב מאוד: אתה חייב להחזיר לפחות 10 פריטים מותאמים אישית (is_mandatory=false), בנוסף ל-13 פריטי החובה.
❗ אסור להחזיר רק את רשימת החובה. סך כל הפריטים ברשימה הסופית צריך להיות לפחות 23.

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
{
  "id": "unique-id-1",
  "name": "משאף אסטמה נוסף",
  "category": "medical",
  "quantity": 2,
  "unit": "יחידות",
  "importance": 4,
  "description": "משאף נוסף לילד הסובל מאסטמה, למקרה שהמשאף הראשי יאבד או יתקלקל",
  "shelf_life": "שנה",
  "usage_instructions": "יש לבדוק תאריך תפוגה ולשמור במקום קריר",
  "recommended_quantity_per_person": "2 יחידות לכל אדם עם אסטמה",
  "obtained": false,
  "expiryDate": null,
  "aiSuggestedExpiryDate": "2024-05-01",
  "sendExpiryReminder": false,
  "personalized_note": "חשוב במיוחד עבור הילד בן ה-3 שסובל מאסטמה. יש לוודא שיש לפחות 2 משאפים תקינים בכל עת.",
  "is_mandatory": false
}

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

חשוב: כל הפריטים שתיצור חייבים להיות מסומנים כ-is_mandatory=false כי הם פריטים מותאמים אישית ולא פריטי חובה של פיקוד העורף.
`

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "אתה מומחה לציוד חירום שיוצר רשימות מותאמות אישית לחלוטין לפי צרכים ספציפיים של משפחות. תפקידך ליצור רשימה של פריטים ייחודיים ומותאמים אישית לכל מאפיין של המשפחה. חשוב מאוד שתוסיף פריטים ספציפיים לכל אחד מהמאפיינים שחולצו (ילדים, חיות מחמד, צרכים מיוחדים וכו') ושתסביר בדיוק למה כל פריט חשוב למשפחה הספציפית הזו. אתה חייב להחזיר לפחות 10 פריטים מותאמים אישית.",
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

      // Ensure all personalized items are marked as non-mandatory
      let personalizedItems = []
      if (data.items && Array.isArray(data.items)) {
        personalizedItems = data.items.map((item) => {
          // Ensure item has an ID
          if (!item.id) {
            item.id = crypto.randomUUID()
          }

          // Ensure item is marked as non-mandatory
          item.is_mandatory = false

          // Ensure importance is not 5 (reserved for mandatory items)
          if (item.importance >= 5) {
            item.importance = 4
          }

          return item
        })
      }

      // Check if we have enough personalized items
      if (personalizedItems.length < 10) {
        console.warn(`Only ${personalizedItems.length} personalized items were generated. Adding default items.`)

        // Add default personalized items to reach at least 10
        const neededItems = 10 - personalizedItems.length
        const defaultItems = DEFAULT_PERSONALIZED_ITEMS.slice(0, neededItems).map((item) => ({
          id: crypto.randomUUID(),
          name: item.name,
          category: item.category,
          quantity: 1,
          unit: "יחידות",
          importance: item.importance,
          description: item.description,
          shelf_life: item.shelf_life,
          usage_instructions: item.usage_instructions,
          recommended_quantity_per_person: "",
          obtained: false,
          expiryDate: null,
          aiSuggestedExpiryDate: null,
          sendExpiryReminder: false,
          personalized_note: "פריט מומלץ לכל משפחה במצב חירום.",
          is_mandatory: false,
        }))

        personalizedItems = [...personalizedItems, ...defaultItems]
      }

      // Combine mandatory and personalized items
      const allItems = [...mandatoryItems, ...personalizedItems]

      // Create the final response
      const finalResponse = {
        profile: extractedData || {},
        items: allItems,
      }

      console.log(
        `Generated ${mandatoryItems.length} mandatory items and ${personalizedItems.length} personalized items`,
      )

      return NextResponse.json(finalResponse)
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      console.log("Raw response:", content)

      // If we can't parse the AI response, return mandatory items + default personalized items
      const defaultPersonalizedItems = DEFAULT_PERSONALIZED_ITEMS.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category,
        quantity: 1,
        unit: "יחידות",
        importance: item.importance,
        description: item.description,
        shelf_life: item.shelf_life,
        usage_instructions: item.usage_instructions,
        recommended_quantity_per_person: "",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
        personalized_note: "פריט מומלץ לכל משפחה במצב חירום.",
        is_mandatory: false,
      }))

      return NextResponse.json({
        profile: extractedData || {},
        items: [...mandatoryItems, ...defaultPersonalizedItems],
        error: "Failed to parse AI response for personalized items",
      })
    }
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
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

// Function to match an item name to a mandatory item using fuzzy matching
function matchMandatoryItem(itemName: string): string | null {
  if (!itemName) return null

  // Normalize the item name (remove non-Hebrew characters)
  const normalized = itemName.replace(/[^א-ת\s]/g, "").trim()

  for (const mandatoryItem of MANDATORY_ITEMS) {
    // Check if any of the keywords match
    for (const keyword of mandatoryItem.keywords) {
      if (normalized.includes(keyword)) {
        return mandatoryItem.key
      }
    }
  }

  return null
}
