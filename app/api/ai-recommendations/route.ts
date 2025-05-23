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

    console.log("Starting AI recommendations generation...")
    console.log("Extracted data:", extractedData)

    // Create ALL 13 mandatory items - NO EXCEPTIONS
    const mandatoryItems = MANDATORY_ITEMS.map((item, index) => {
      const mandatoryItem = {
        id: `mandatory-${index + 1}`,
        name: item.name,
        category: item.category,
        quantity: calculateQuantity(item.name, extractedData),
        unit: getUnitForItem(item.name),
        importance: 5, // Always 5 for mandatory items
        description: item.description,
        shelf_life: item.shelf_life,
        usage_instructions: item.usage_instructions,
        recommended_quantity_per_person: getRecommendedQuantityPerPerson(item.name),
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: getExpiryDateForItem(item.name),
        sms_notification: false,
        personalized_note: "",
        is_mandatory: true,
      }
      console.log(`Created mandatory item ${index + 1}: ${mandatoryItem.name}`)
      return mandatoryItem
    })

    // VERIFY we have exactly 13 mandatory items
    if (mandatoryItems.length !== 13) {
      console.error(`CRITICAL ERROR: Expected 13 mandatory items, got ${mandatoryItems.length}`)
      throw new Error(`Failed to create all mandatory items. Expected 13, got ${mandatoryItems.length}`)
    }

    console.log(`✅ Successfully created ${mandatoryItems.length} mandatory items`)

    // Get personalized items from AI
    let personalizedItems: any[] = []

    try {
      personalizedItems = await getPersonalizedItems(prompt, extractedData)
      console.log(`AI generated ${personalizedItems.length} personalized items`)
    } catch (error) {
      console.error("Error getting AI personalized items:", error)
      personalizedItems = []
    }

    // ENSURE we have exactly 10 personalized items
    while (personalizedItems.length < 10) {
      const newItem = generateGenericPersonalizedItem(personalizedItems.length, extractedData)
      personalizedItems.push(newItem)
      console.log(`Added fallback personalized item ${personalizedItems.length}: ${newItem.name}`)
    }

    // Trim if we have more than 10
    if (personalizedItems.length > 10) {
      personalizedItems = personalizedItems.slice(0, 10)
      console.log(`Trimmed personalized items to 10`)
    }

    // VERIFY we have exactly 10 personalized items
    if (personalizedItems.length !== 10) {
      console.error(`CRITICAL ERROR: Expected 10 personalized items, got ${personalizedItems.length}`)
      throw new Error(`Failed to create enough personalized items. Expected 10, got ${personalizedItems.length}`)
    }

    console.log(`✅ Successfully created ${personalizedItems.length} personalized items`)

    // Ensure all personalized items are marked correctly
    personalizedItems.forEach((item, index) => {
      item.is_mandatory = false
      item.id = item.id || `personalized-${index + 1}`
      if (item.importance >= 5) {
        item.importance = 4 // Cap at 4 for personalized items
      }
    })

    // Combine mandatory and personalized items
    const allItems = [...mandatoryItems, ...personalizedItems]

    console.log(`Final verification:`)
    console.log(`- Mandatory items: ${mandatoryItems.length}`)
    console.log(`- Personalized items: ${personalizedItems.length}`)
    console.log(`- Total items: ${allItems.length}`)

    // FINAL VERIFICATION
    const mandatoryCount = allItems.filter((item) => item.is_mandatory === true).length
    const personalizedCount = allItems.filter((item) => item.is_mandatory === false).length

    if (mandatoryCount !== 13) {
      console.error(`FINAL CHECK FAILED: Expected 13 mandatory items, got ${mandatoryCount}`)
      throw new Error(`Final verification failed for mandatory items`)
    }

    if (personalizedCount !== 10) {
      console.error(`FINAL CHECK FAILED: Expected 10 personalized items, got ${personalizedCount}`)
      throw new Error(`Final verification failed for personalized items`)
    }

    console.log(
      `✅ FINAL VERIFICATION PASSED: ${mandatoryCount} mandatory + ${personalizedCount} personalized = ${allItems.length} total`,
    )

    // Create the final response
    const finalResponse = {
      profile: extractedData || {},
      items: allItems,
    }

    return NextResponse.json(finalResponse)
  } catch (error) {
    console.error("Error generating AI recommendations:", error)

    // Even in case of error, return the mandatory items + fallback personalized items
    console.log("Generating fallback response with all mandatory items...")

    const fallbackMandatoryItems = MANDATORY_ITEMS.map((item, index) => ({
      id: `mandatory-${index + 1}`,
      name: item.name,
      category: item.category,
      quantity: calculateQuantity(item.name, extractedData),
      unit: getUnitForItem(item.name),
      importance: 5,
      description: item.description,
      shelf_life: item.shelf_life,
      usage_instructions: item.usage_instructions,
      recommended_quantity_per_person: getRecommendedQuantityPerPerson(item.name),
      obtained: false,
      expiryDate: null,
      aiSuggestedExpiryDate: getExpiryDateForItem(item.name),
      sms_notification: false,
      personalized_note: "",
      is_mandatory: true,
    }))

    const fallbackPersonalizedItems = Array.from({ length: 10 }, (_, i) =>
      generateGenericPersonalizedItem(i, extractedData),
    )

    const fallbackResponse = {
      profile: extractedData || {},
      items: [...fallbackMandatoryItems, ...fallbackPersonalizedItems],
    }

    console.log(
      `Fallback response created with ${fallbackMandatoryItems.length} mandatory + ${fallbackPersonalizedItems.length} personalized items`,
    )

    return NextResponse.json(fallbackResponse)
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
      if (data.items.length < 10) {
        const missingCount = 10 - data.items.length
        console.log(`Generating ${missingCount} missing personalized items`)

        // Generate generic personalized items based on family profile
        for (let i = 0; i < missingCount; i++) {
          data.items.push(generateGenericPersonalizedItem(data.items.length + i, extractedData))
        }
      }

      // If we have more than 10, trim the list
      if (data.items.length > 10) {
        data.items = data.items.slice(0, 10)
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
  // רשימה קבועה של 10 פריטים מותאמים אישית
  const fallbackItems = [
    {
      name: "סוללות נטענות ומטען סולארי",
      category: "lighting_energy",
      description: "סוללות נטענות ומטען סולארי לטעינה ללא חשמל במהלך הפסקות חשמל ממושכות.",
      personalized_note: "שימושי לטעינת מכשירים קטנים במהלך הפסקות חשמל.",
      importance: 3,
      shelf_life: "5 שנים",
      usage_instructions: "יש לאחסן במקום יבש וקריר.",
    },
    {
      name: "שקיות אשפה וכפפות חד-פעמיות",
      category: "hygiene",
      description: "שקיות לאשפה וכפפות חד-פעמיות לשמירה על היגיינה וניקיון במהלך החירום.",
      personalized_note: "חשוב לשמירה על ניקיון וסניטציה במקלט.",
      importance: 2,
      shelf_life: "3 שנים",
      usage_instructions: "יש להשתמש לפי הצורך ולהחליף כפפות בין שימושים.",
    },
    {
      name: "נרות ומקלות גפרורים",
      category: "lighting_energy",
      description: "נרות לתאורה ולחימום במקרה של הפסקת חשמל ממושכת.",
      personalized_note: "גיבוי לפנסים ולתאורה ממושכת במקלט.",
      importance: 2,
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש להשתמש בזהירות ובאוורור טוב.",
    },
    {
      name: "מגבות נייר ומגבונים לחים",
      category: "hygiene",
      description: "מגבות נייר ומגבונים לחים לניקוי ללא מים זורמים.",
      personalized_note: "שימושי כאשר אין גישה למים זורמים במקלט.",
      importance: 2,
      shelf_life: "2 שנים",
      usage_instructions: "יש לשמור במקום יבש ולהשתמש לפי הצורך.",
    },
    {
      name: "ערכת תיקונים בסיסית",
      category: "other",
      description: "ערכה קטנה הכוללת כלי עבודה בסיסיים, סלוטייפ, חוט ברזל ומברגים קטנים.",
      personalized_note: "שימושית לתיקונים קטנים וחיוניים בזמן חירום.",
      importance: 2,
      shelf_life: "10 שנים",
      usage_instructions: "יש לבדוק תקינות הכלים מעת לעת.",
    },
    {
      name: "מטהר מים נייד",
      category: "water_food",
      description: "מטהר מים נייד או טבליות לטיהור מים במקרה שאין גישה למים נקיים.",
      personalized_note: "חשוב במקרה של פגיעה במערכת המים או זיהום.",
      importance: 3,
      shelf_life: "5 שנים",
      usage_instructions: "יש לפעול לפי הוראות היצרן בדיוק.",
    },
    {
      name: "שמיכה תרמית חירום",
      category: "other",
      description: "שמיכה תרמית קלה וקומפקטית לשמירה על חום הגוף.",
      personalized_note: "שימושית במקלטים קרים או בלילות קרים.",
      importance: 2,
      shelf_life: "לא רלוונטי",
      usage_instructions: "יש לפרוש על הגוף או להתכסות בה.",
    },
    {
      name: "כירת גז נייד קטן",
      category: "water_food",
      description: "כירת גז קטנה וניידת לחימום מזון ומים במקרה של הפסקת חשמל.",
      personalized_note: "שימושי לחימום מזון במקרה של הפסקת חשמל ממושכת.",
      importance: 2,
      shelf_life: "10 שנים",
      usage_instructions: "יש להשתמש רק באוורור טוב ולבדוק דליפות גז.",
    },
    {
      name: "מזון מוכן לאכילה (קופסאות שימורים)",
      category: "water_food",
      description: "מזון מוכן לאכילה שאינו דורש בישול או חימום - קופסאות שימורים, חטיפי אנרגיה.",
      personalized_note: "חשוב במקרה שאין אפשרות לבשל או לחמם מזון.",
      importance: 3,
      shelf_life: "2 שנים",
      usage_instructions: "יש לבדוק תאריכי תפוגה ולהחליף בהתאם.",
    },
    {
      name: "ערכת היגיינה אישית מורחבת",
      category: "hygiene",
      description: "ערכת היגיינה הכוללת מברשת שיניים, משחת שיניים, סבון, שמפו יבש ומוצרי היגיינה נוספים.",
      personalized_note: "חשובה לשמירה על היגיינה אישית במהלך שהייה ממושכת במקלט.",
      importance: 3,
      shelf_life: "2 שנים",
      usage_instructions: "יש להשתמש במינון חסכוני ולשמור על ניקיון.",
    },
  ]

  // בחר פריט לפי האינדקס (עם מודולו כדי למנוע חריגה מהמערך)
  const selectedItem = fallbackItems[index % fallbackItems.length]

  // החזר את הפריט המלא עם כל השדות הנדרשים
  return {
    id: `personalized-${index + 1}`,
    name: selectedItem.name,
    category: selectedItem.category,
    quantity: calculateQuantityForItem(selectedItem.name, profile),
    unit: getUnitForItem(selectedItem.name),
    importance: selectedItem.importance,
    description: selectedItem.description,
    shelf_life: selectedItem.shelf_life,
    usage_instructions: selectedItem.usage_instructions,
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
