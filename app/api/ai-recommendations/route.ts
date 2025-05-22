import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    // שלב חדש: חילוץ מידע מובנה מהפרומפט
    let structuredData
    try {
      const extractResponse = await fetch(`${request.nextUrl.origin}/api/extract-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!extractResponse.ok) {
        console.error("Error extracting data:", await extractResponse.text())
        // Use default structured data if extraction fails
        structuredData = {
          adults: 2,
          children: 0,
          babies: 0,
          elderly: 0,
          pets: 0,
          special_needs: "",
          duration_hours: 72,
          using_defaults: ["adults", "children", "babies", "elderly", "pets", "special_needs", "duration_hours"],
        }
      } else {
        structuredData = await extractResponse.json()
      }
    } catch (error) {
      console.error("Error in extract-data API call:", error)
      // Use default structured data if extraction fails
      structuredData = {
        adults: 2,
        children: 0,
        babies: 0,
        elderly: 0,
        pets: 0,
        special_needs: "",
        duration_hours: 72,
        using_defaults: ["adults", "children", "babies", "elderly", "pets", "special_needs", "duration_hours"],
      }
    }

    console.log("Extracted structured data:", structuredData)

    // Prepare the prompt for OpenAI with recommended items list and structured data
    const systemPrompt = `
      אתה מומחה לציוד חירום ובטיחות. 
      תפקידך הוא לנתח את המידע על משק הבית ולהמליץ על רשימת ציוד חירום מותאמת אישית.
      
      המידע שחולץ מהפרומפט של המשתמש:
      ${JSON.stringify(structuredData, null, 2)}
      
      התייחס למספר האנשים, גילאים, צרכים מיוחדים, חיות מחמד וכל מידע רלוונטי אחר.
      
      חשוב מאוד: עליך להחזיר לפחות 15 פריטים בסך הכל, כאשר לפחות 8 מהם הם פריטים חיוניים (importance=5).
      
      הנה רשימת המלצות כלליות לציוד חירום שעליך להתבסס עליהן:
      
      **המלצות ציוד חירום כלליות:**
      1. מים ומזון שאינו דורש קירור לכל בני הבית למשך לפחות שלושה ימים
      2. תאורת חירום
      3. פנסים וסוללות
      4. ערכת עזרה ראשונה
      5. תרופות ומרשמים מודפסים
      6. רדיו וסוללות
      7. מטענים ניידים לטלפונים
      8. ציוד מיוחד לצרכי המשפחה (למשל, תינוקות, קשישים, חיות מחמד)
      
      **ציוד כללי נוסף:**
      1. סוללות גיבוי למכשירים חיוניים, כמו ציוד רפואי
      2. עותקים של מסמכים חיוניים כמו תעודת זהות, רישיון נהיגה, דרכון וכו'
      3. מטף כיבוי אש, גלאי עשן
      4. לפחות חצי מיכל דלק במכונית
      5. פעילויות לילדים (למשל, משחקים, ספרים וכלי כתיבה)
      6. ציוד לחיות מחמד
      
      הנה הפורמט שבו עליך להחזיר את התשובה (JSON בלבד):
      {
        "profile": {
          "adults": מספר המבוגרים,
          "children": מספר הילדים,
          "babies": מספר התינוקות,
          "elderly": מספר הקשישים,
          "pets": מספר חיות המחמד,
          "special_needs": תיאור צרכים מיוחדים,
          "duration_hours": משך זמן בשעות שהציוד אמור להספיק,
          "using_defaults": ${JSON.stringify(structuredData.using_defaults || [])}
        },
        "items": [
          {
            "id": "מזהה ייחודי",
            "name": "שם הפריט",
            "category": "קטגוריה (water_food, medical, hygiene, lighting_energy, communication, documents_money, children, pets, elderly, special_needs, other)",
            "quantity": כמות מומלצת,
            "unit": "יחידת מידה",
            "importance": דירוג חשיבות (5=הכרחי, 4=חשוב מאוד, 3=חשוב, 2=מומלץ, 1=אופציונלי),
            "description": "תיאור הפריט",
            "shelf_life": "חיי מדף",
            "usage_instructions": "הוראות שימוש",
            "recommended_quantity_per_person": "כמות מומלצת לאדם",
            "obtained": false,
            "expiryDate": null,
            "aiSuggestedExpiryDate": "תאריך תפוגה מומלץ בפורמט YYYY-MM-DD",
            "sendExpiryReminder": false
          }
        ]
      }
      
      הקפד להתאים את הציוד לצרכים הספציפיים שמתוארים בטקסט.
      עבור כל פריט, הקפד לציין את כל השדות הנדרשים.
      התאם את הכמויות לפי מספר האנשים ומשך הזמן.
      הקפד לתת תאריכי תפוגה הגיוניים לפריטים שיש להם חיי מדף.
      זכור: עליך להחזיר לפחות 15 פריטים בסך הכל!
    `

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json({ error: "Error calling OpenAI API" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(aiResponse)

      // Ensure the response has the expected structure
      if (parsedResponse.profile && Array.isArray(parsedResponse.items)) {
        // Add unique IDs to items if they don't have them
        parsedResponse.items = parsedResponse.items.map((item, index) => ({
          ...item,
          id: item.id || `ai${index + 1}`,
        }))

        // Ensure we have at least 8 items
        if (parsedResponse.items.length < 8) {
          console.warn("AI returned fewer than 8 items, using fallback items")
          // Add fallback items if needed
          const fallbackItems = [
            {
              id: "fallback1",
              name: "מים",
              category: "water_food",
              quantity: 3 * (parsedResponse.profile.adults + parsedResponse.profile.children) * 3,
              unit: "ליטרים",
              importance: 5,
              description: "מים לשתייה ובישול",
              shelf_life: "שנה",
              usage_instructions: "3 ליטרים לאדם ליום",
              recommended_quantity_per_person: "3 ליטרים ליום",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2025-12-31",
              sendExpiryReminder: false,
            },
            {
              id: "fallback2",
              name: "מזון יבש",
              category: "water_food",
              quantity: parsedResponse.profile.adults + parsedResponse.profile.children,
              unit: 'ק"ג',
              importance: 5,
              description: "מזון שאינו דורש קירור",
              shelf_life: "שנה",
              usage_instructions: "לאחסן במקום יבש וקריר",
              recommended_quantity_per_person: '1 ק"ג ליום',
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2025-06-30",
              sendExpiryReminder: false,
            },
            {
              id: "fallback3",
              name: "פנס",
              category: "lighting_energy",
              quantity: Math.ceil((parsedResponse.profile.adults + parsedResponse.profile.children) / 2),
              unit: "יחידות",
              importance: 5,
              description: "פנס לתאורת חירום",
              shelf_life: "לא רלוונטי",
              usage_instructions: "יש לוודא שהסוללות טעונות",
              recommended_quantity_per_person: "1 יחידה לכל 2 אנשים",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: null,
              sendExpiryReminder: false,
            },
            {
              id: "fallback4",
              name: "ערכת עזרה ראשונה",
              category: "medical",
              quantity: 1,
              unit: "ערכה",
              importance: 5,
              description: "ערכת עזרה ראשונה בסיסית",
              shelf_life: "שנתיים",
              usage_instructions: "יש לבדוק תוקף של תרופות",
              recommended_quantity_per_person: "ערכה אחת למשפחה",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2026-12-31",
              sendExpiryReminder: false,
            },
            {
              id: "fallback5",
              name: "רדיו",
              category: "communication",
              quantity: 1,
              unit: "יחידה",
              importance: 5,
              description: "רדיו המופעל על סוללות לקבלת עדכונים",
              shelf_life: "לא רלוונטי",
              usage_instructions: "יש לוודא שיש סוללות רזרביות",
              recommended_quantity_per_person: "1 יחידה למשפחה",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: null,
              sendExpiryReminder: false,
            },
            {
              id: "fallback6",
              name: "מטען נייד",
              category: "communication",
              quantity: parsedResponse.profile.adults,
              unit: "יחידות",
              importance: 5,
              description: "מטען נייד לטלפונים",
              shelf_life: "לא רלוונטי",
              usage_instructions: "יש לוודא שהמטען טעון",
              recommended_quantity_per_person: "1 יחידה לאדם",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: null,
              sendExpiryReminder: false,
            },
            {
              id: "fallback7",
              name: "עותקי מסמכים",
              category: "documents_money",
              quantity: 1,
              unit: "סט",
              importance: 5,
              description: "עותקים של מסמכים חיוניים (תעודת זהות, דרכון, רישיון נהיגה וכו')",
              shelf_life: "לא רלוונטי",
              usage_instructions: "לשמור במקום יבש ובטוח",
              recommended_quantity_per_person: "סט אחד למשפחה",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: null,
              sendExpiryReminder: false,
            },
            {
              id: "fallback8",
              name: "מטף כיבוי אש",
              category: "other",
              quantity: 1,
              unit: "יחידה",
              importance: 5,
              description: "מטף כיבוי אש לשימוש בחירום",
              shelf_life: "5 שנים",
              usage_instructions: "יש לבדוק תקינות אחת לשנה",
              recommended_quantity_per_person: "1 יחידה לבית",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2029-12-31",
              sendExpiryReminder: false,
            },
          ]

          // Add only the missing number of items
          const missingCount = 8 - parsedResponse.items.length
          parsedResponse.items = [...parsedResponse.items, ...fallbackItems.slice(0, missingCount)]
        }

        // העברת מידע על ערכי ברירת מחדל
        if (structuredData.using_defaults) {
          parsedResponse.profile.using_defaults = structuredData.using_defaults
        }

        return NextResponse.json(parsedResponse)
      } else {
        console.error("Invalid response structure from OpenAI:", parsedResponse)
        return NextResponse.json({ error: "Invalid response structure from OpenAI" }, { status: 500 })
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      return NextResponse.json({ error: "Error parsing OpenAI response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in AI recommendations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
