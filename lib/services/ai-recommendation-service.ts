export const AIRecommendationService = {
  async generateRecommendations(prompt: string) {
    try {
      // Check if OpenAI API key is available
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

      if (!openaiApiKey) {
        console.error("OpenAI API key is missing. Please set the NEXT_PUBLIC_OPENAI_API_KEY environment variable.")
        return this.generateFallbackRecommendations(prompt)
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
        return this.generateFallbackRecommendations(prompt)
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

          return parsedResponse
        } else {
          console.error("Invalid response structure from OpenAI:", parsedResponse)
          return this.generateFallbackRecommendations(prompt)
        }
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError)
        return this.generateFallbackRecommendations(prompt)
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return this.generateFallbackRecommendations(prompt)
    }
  },

  // Fallback function that generates basic recommendations when OpenAI is unavailable
  generateFallbackRecommendations(prompt: string) {
    console.log("Using fallback recommendations generator")

    // Parse the prompt to extract basic information
    const adults = prompt.match(/(\d+)\s*מבוגרים/) ? Number.parseInt(prompt.match(/(\d+)\s*מבוגרים/)[1]) : 2
    const children = prompt.match(/(\d+)\s*ילדים/) ? Number.parseInt(prompt.match(/(\d+)\s*ילדים/)[1]) : 0
    const babies = prompt.match(/(\d+)\s*תינוקות/) ? Number.parseInt(prompt.match(/(\d+)\s*תינוקות/)[1]) : 0
    const pets = prompt.match(/(\d+)\s*חיות/) ? Number.parseInt(prompt.match(/(\d+)\s*חיות/)[1]) : 0

    // Generate profile
    const profile = {
      adults,
      children,
      babies,
      elderly: 0,
      pets,
      special_needs: prompt.includes("מוגבלות") ? "מוגבלות בניידות" : "לא צוין",
      duration_hours: 72,
    }

    // Generate items based on household composition
    const items = [
      {
        id: "ai1",
        name: "מים",
        category: "water_food",
        quantity: 3 * (adults + children) * 3, // 3 liters per person per day for 3 days
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
        id: "ai2",
        name: "מזון יבש",
        category: "water_food",
        quantity: adults + children,
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
        id: "ai3",
        name: "פנס",
        category: "lighting_energy",
        quantity: Math.ceil((adults + children) / 2),
        unit: "יחידות",
        importance: 4,
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
        id: "ai4",
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
        id: "ai5",
        name: "רדיו",
        category: "communication",
        quantity: 1,
        unit: "יחידה",
        importance: 3,
        description: "רדיו המופעל על סוללות לקבלת עדכונים",
        shelf_life: "לא רלוונטי",
        usage_instructions: "יש לוודא שיש סוללות רזרביות",
        recommended_quantity_per_person: "1 יחידה למשפחה",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
    ]

    // Add items for babies if needed
    if (babies > 0) {
      items.push({
        id: "ai6",
        name: "חלב תינוקות",
        category: "children",
        quantity: 3 * babies,
        unit: "קופסאות",
        importance: 5,
        description: "חלב תינוקות",
        shelf_life: "שנה",
        usage_instructions: "להכין לפי הוראות היצרן",
        recommended_quantity_per_person: "1 קופסה ליום לתינוק",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2025-06-30",
        sendExpiryReminder: false,
      })

      items.push({
        id: "ai7",
        name: "חיתולים",
        category: "children",
        quantity: 6 * babies * 3, // 6 diapers per day per baby for 3 days
        unit: "יחידות",
        importance: 5,
        description: "חיתולים לתינוקות",
        shelf_life: "לא רלוונטי",
        usage_instructions: "להחליף לפי הצורך",
        recommended_quantity_per_person: "6 יחידות ליום לתינוק",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      })
    }

    // Add items for pets if needed
    if (pets > 0) {
      items.push({
        id: "ai8",
        name: "מזון לחיות מחמד",
        category: "pets",
        quantity: 1 * pets * 3, // 1 kg per pet per day for 3 days
        unit: 'ק"ג',
        importance: 4,
        description: "מזון לחיות מחמד",
        shelf_life: "שנה",
        usage_instructions: "לאחסן במקום יבש וקריר",
        recommended_quantity_per_person: '1 ק"ג ליום לחיה',
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2025-06-30",
        sendExpiryReminder: false,
      })
    }

    // Add items for people with mobility issues if needed
    if (prompt.includes("מוגבלות") || prompt.includes("הליכון")) {
      items.push({
        id: "ai9",
        name: "סוללות להליכון חשמלי",
        category: "special_needs",
        quantity: 2,
        unit: "יחידות",
        importance: 5,
        description: "סוללות רזרביות להליכון חשמלי",
        shelf_life: "לא רלוונטי",
        usage_instructions: "יש לוודא שהסוללות טעונות",
        recommended_quantity_per_person: "2 יחידות לאדם עם מוגבלות",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      })
    }

    return { profile, items }
  },
}
