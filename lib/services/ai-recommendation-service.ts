// Método de fallback para cuando la API falla
const generateFallbackRecommendations = (prompt: string) => {
  // Extraer información básica del prompt usando expresiones regulares
  let adults = 2
  let children = 0
  let babies = 0
  let elderly = 0
  let pets = 0
  let special_needs = ""

  // Intentar extraer números de adultos
  const adultsMatch = prompt.match(/(\d+)\s*(מבוגרים|אנשים|בוגרים)/)
  if (adultsMatch) {
    adults = Number.parseInt(adultsMatch[1])
  }

  // Intentar extraer números de niños
  const childrenMatch = prompt.match(/(\d+)\s*(ילדים|ילד)/)
  if (childrenMatch) {
    children = Number.parseInt(childrenMatch[1])
  }

  // Intentar extraer números de bebés
  const babiesMatch = prompt.match(/(\d+)\s*(תינוקות|תינוק)/)
  if (babiesMatch) {
    babies = Number.parseInt(babiesMatch[1])
  }

  // Intentar extraer números de ancianos
  const elderlyMatch = prompt.match(/(\d+)\s*(קשישים|קשיש)/)
  if (elderlyMatch) {
    elderly = Number.parseInt(elderlyMatch[1])
  }

  // Intentar extraer números de mascotas
  const petsMatch = prompt.match(/(\d+)\s*(חיות|חיות מחמד|כלבים|חתולים)/)
  if (petsMatch) {
    pets = Number.parseInt(petsMatch[1])
  }

  // Intentar extraer necesidades especiales
  if (prompt.includes("אסטמה")) {
    special_needs = "אסטמה"
  } else if (prompt.includes("סוכרת")) {
    special_needs = "סוכרת"
  } else if (prompt.includes("לחץ דם")) {
    special_needs = "לחץ דם גבוה"
  } else if (prompt.includes("אלרגיה")) {
    special_needs = "אלרגיה"
  }

  // Crear recomendaciones básicas
  const totalPeople = adults + children + babies + elderly

  return {
    profile: {
      adults,
      children,
      babies,
      elderly,
      pets,
      special_needs,
      duration_hours: 72,
      using_defaults: [],
    },
    items: [
      {
        id: "fallback1",
        name: "מים",
        category: "water_food",
        quantity: 3 * totalPeople * 3,
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
        quantity: totalPeople,
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
        quantity: Math.ceil(totalPeople / 2),
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
      // Añadir elementos específicos basados en la información extraída
      ...(babies > 0
        ? [
            {
              id: "fallback9",
              name: "מזון לתינוקות",
              category: "children",
              quantity: babies * 3,
              unit: "קופסאות",
              importance: 5,
              description: "מזון לתינוקות",
              shelf_life: "שנה",
              usage_instructions: "לפי הוראות היצרן",
              recommended_quantity_per_person: "3 קופסאות לתינוק ליום",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2025-06-30",
              sendExpiryReminder: false,
            },
          ]
        : []),
      ...(pets > 0
        ? [
            {
              id: "fallback10",
              name: "מזון לחיות מחמד",
              category: "pets",
              quantity: pets * 3,
              unit: 'ק"ג',
              importance: 5,
              description: "מזון לחיות מחמד",
              shelf_life: "שנה",
              usage_instructions: "לפי הוראות היצרן",
              recommended_quantity_per_person: '3 ק"ג לחיה ליום',
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: "2025-06-30",
              sendExpiryReminder: false,
            },
          ]
        : []),
      ...(special_needs
        ? [
            {
              id: "fallback11",
              name: "תרופות מיוחדות",
              category: "special_needs",
              quantity: 1,
              unit: "סט",
              importance: 5,
              description: `תרופות מיוחדות ל${special_needs}`,
              shelf_life: "לפי תאריך התפוגה",
              usage_instructions: "לפי הוראות הרופא",
              recommended_quantity_per_person: "לפי הצורך",
              obtained: false,
              expiryDate: null,
              aiSuggestedExpiryDate: null,
              sendExpiryReminder: false,
            },
          ]
        : []),
      {
        id: "fallback12",
        name: "סוללות",
        category: "lighting_energy",
        quantity: 10,
        unit: "יחידות",
        importance: 4,
        description: "סוללות לפנסים ומכשירים אחרים",
        shelf_life: "5 שנים",
        usage_instructions: "לאחסן במקום יבש וקריר",
        recommended_quantity_per_person: "2 יחידות לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2029-12-31",
        sendExpiryReminder: false,
      },
      {
        id: "fallback13",
        name: "שמיכות",
        category: "other",
        quantity: totalPeople,
        unit: "יחידות",
        importance: 4,
        description: "שמיכות לחימום",
        shelf_life: "לא רלוונטי",
        usage_instructions: "לשמור במקום יבש",
        recommended_quantity_per_person: "1 יחידה לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "fallback14",
        name: "כסף מזומן",
        category: "documents_money",
        quantity: 500,
        unit: "₪",
        importance: 4,
        description: "כסף מזומן למקרה חירום",
        shelf_life: "לא רלוונטי",
        usage_instructions: "לשמור במקום בטוח",
        recommended_quantity_per_person: "250 ₪ לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: null,
        sendExpiryReminder: false,
      },
      {
        id: "fallback15",
        name: "מגבונים לחים",
        category: "hygiene",
        quantity: 5,
        unit: "חבילות",
        importance: 3,
        description: "מגבונים לחים לניקיון אישי",
        shelf_life: "שנתיים",
        usage_instructions: "לשמור סגור היטב",
        recommended_quantity_per_person: "1 חבילה לאדם",
        obtained: false,
        expiryDate: null,
        aiSuggestedExpiryDate: "2026-12-31",
        sendExpiryReminder: false,
      },
    ],
  }
}

const generateRecommendations = async (prompt: string) => {
  try {
    // קודם כל, חלץ את הנתונים מהפרומפט
    const extractResponse = await fetch("/api/extract-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!extractResponse.ok) {
      console.error("Error extracting data from prompt:", await extractResponse.text())
      return generateFallbackRecommendations(prompt)
    }

    const extractedData = await extractResponse.json()
    console.log("Extracted data:", extractedData)

    // עכשיו, השתמש בנתונים המחולצים כדי ליצור פרומפט מותאם אישית ל-AI
    const customizedPrompt = `
יצירת רשימת ציוד חירום מותאמת אישית עבור משפחה עם המאפיינים הבאים:

- מבוגרים: ${extractedData.adults}
- ילדים: ${extractedData.children}${extractedData.children_ages && extractedData.children_ages.length > 0 ? ` (גילאים: ${extractedData.children_ages.join(", ")})` : ""}
- תינוקות: ${extractedData.babies}
- קשישים: ${extractedData.elderly}
- חיות מחמד: ${extractedData.pets}${extractedData.pet_types && extractedData.pet_types.length > 0 ? ` (${extractedData.pet_types.join(", ")})` : ""}
- צרכים מיוחדים: ${extractedData.special_needs || "אין"}
- משך זמן: ${extractedData.duration_hours} שעות
- מיקום: ${extractedData.location || "לא צוין"}

הפרומפט המקורי של המשתמש:
${prompt}

צור רשימת ציוד חירום מותאמת אישית למשפחה זו, עם דגש מיוחד על הצרכים הייחודיים שלהם.
`

    // שלח את הפרומפט המותאם אישית ל-API
    const response = await fetch("/api/ai-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: customizedPrompt,
        extractedData: extractedData, // שלח גם את הנתונים המחולצים כדי שה-API יוכל להשתמש בהם ישירות
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

    return data
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    console.log("Using fallback recommendations generator due to error")
    return generateFallbackRecommendations(prompt)
  }
}

// Exportar el servicio
export const AIRecommendationService = {
  generateRecommendations,
  generateFallbackRecommendations,
}
