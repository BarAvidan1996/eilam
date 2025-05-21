export const AIRecommendationService = {
  async generateRecommendations(prompt: string) {
    try {
      // Call our server-side API route instead of OpenAI directly
      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        console.error("Error calling AI recommendations API:", await response.text())
        return this.generateFallbackRecommendations(prompt)
      }

      const data = await response.json()

      if (data.error) {
        console.error("AI recommendations API error:", data.error)
        return this.generateFallbackRecommendations(prompt)
      }

      return data
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
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

    // Generate items based on household composition - at least 15 items
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
        id: "ai6",
        name: "מטען נייד",
        category: "communication",
        quantity: adults,
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
        id: "ai7",
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
        id: "ai8",
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
      {
        id: "ai9",
        name: "סוללות",
        category: "lighting_energy",
        quantity: 12,
        unit: "יחידות",
        importance: 4,
        description: "סוללות לפנסים ומכשירים חיוניים",
        shelf_life: "5 שנים",
        usage_instructions: "לאחסן במקום קריר ויבש",
        recommended_quantity_per_person: "3 יחידות לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2029-12-31",
        sendExpiryReminder: false,
      },
      {
        id: "ai10",
        name: "תרופות מרשם",
        category: "medical",
        quantity: adults + children,
        unit: "סטים",
        importance: 5,
        description: "תרופות מרשם לכל בני המשפחה",
        shelf_life: "בהתאם לתרופה",
        usage_instructions: "לשמור בהתאם להוראות היצרן",
        recommended_quantity_per_person: "מלאי לשבוע לפחות",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2024-12-31",
        sendExpiryReminder: true,
      },
      {
        id: "ai11",
        name: "מזון משומר",
        category: "water_food",
        quantity: 6 * (adults + children),
        unit: "פחיות",
        importance: 4,
        description: "מזון משומר שאינו דורש בישול",
        shelf_life: "3 שנים",
        usage_instructions: "לבדוק תאריך תפוגה",
        recommended_quantity_per_person: "2 פחיות ליום",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2027-12-31",
        sendExpiryReminder: false,
      },
      {
        id: "ai12",
        name: "פנסי ראש",
        category: "lighting_energy",
        quantity: adults + children,
        unit: "יחידות",
        importance: 3,
        description: "פנסי ראש לשימוש ידיים חופשיות",
        shelf_life: "לא רלוונטי",
        usage_instructions: "לוודא שהסוללות טעונות",
        recommended_quantity_per_person: "1 יחידה לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "ai13",
        name: "מצעים חמים",
        category: "other",
        quantity: adults + children,
        unit: "סטים",
        importance: 3,
        description: "שמיכות ומצעים חמים",
        shelf_life: "לא רלוונטי",
        usage_instructions: "לשמור במקום יבש",
        recommended_quantity_per_person: "סט אחד לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "ai14",
        name: "כסף מזומן",
        category: "documents_money",
        quantity: 500 * (adults + 0.5 * children),
        unit: "₪",
        importance: 4,
        description: "כסף מזומן למקרה חירום",
        shelf_life: "לא רלוונטי",
        usage_instructions: "לשמור במקום בטוח",
        recommended_quantity_per_person: "500 ₪ לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "ai15",
        name: "ציוד היגיינה",
        category: "hygiene",
        quantity: adults + children,
        unit: "ערכות",
        importance: 4,
        description: "ציוד היגיינה אישי (מברשות שיניים, סבון, שמפו וכו')",
        shelf_life: "שנה",
        usage_instructions: "לשמור במקום יבש",
        recommended_quantity_per_person: "ערכה אחת לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2025-12-31",
        sendExpiryReminder: false,
      },
    ]

    // Add items for babies if needed
    if (babies > 0) {
      items.push({
        id: "ai16",
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
        id: "ai17",
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
        id: "ai18",
        name: "מזון לחיות מחמד",
        category: "pets",
        quantity: 1 * pets * 3, // 1 kg per pet per day for 3 days
        unit: 'ק"ג',
        importance: 5,
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
        id: "ai19",
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
