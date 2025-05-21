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

    // Prepare the prompt for OpenAI
    const systemPrompt = `
      אתה מומחה לציוד חירום ובטיחות. 
      תפקידך הוא לנתח את המידע על משק הבית ולהמליץ על רשימת ציוד חירום מותאמת אישית.
      התייחס למספר האנשים, גילאים, צרכים מיוחדים, חיות מחמד וכל מידע רלוונטי אחר.
      
      הנה הפורמט שבו עליך להחזיר את התשובה (JSON בלבד):
      {
        "profile": {
          "adults": מספר המבוגרים,
          "children": מספר הילדים,
          "babies": מספר התינוקות,
          "elderly": מספר הקשישים,
          "pets": מספר חיות המחמד,
          "special_needs": תיאור צרכים מיוחדים,
          "duration_hours": משך זמן בשעות שהציוד אמור להספיק (ברירת מחדל 72)
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
    `

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
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
