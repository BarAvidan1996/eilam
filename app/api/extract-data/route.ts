import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // חילוץ מידע מובנה מהפרומפט
    const structuredData = await extractStructuredData(prompt)

    // זיהוי אילו שדות משתמשים בערכי ברירת מחדל
    const usingDefaults = []

    if (
      structuredData.adults === 2 &&
      !prompt.toLowerCase().match(/\b(שני מבוגרים|2 מבוגרים|שני אנשים|2 אנשים|זוג|אני ובן זוגי|אני ואשתי|עם אשתי)\b/i)
    ) {
      usingDefaults.push("adults")
    }

    if (structuredData.children === 0 && !prompt.match(/\b(אין ילדים|ללא ילדים)\b/i)) {
      // בדיקה אם יש אזכור של ילדים בטקסט
      const childrenMentioned = prompt.match(/\b(ילד|ילדים|ילדה|ילדות|בן|בת|בנים|בנות)\b/i)
      if (childrenMentioned && structuredData.children === 0) {
        usingDefaults.push("children")
      }
    }

    if (structuredData.babies === 0 && !prompt.match(/\b(אין תינוקות|ללא תינוקות)\b/i)) {
      usingDefaults.push("babies")
    }

    if (structuredData.elderly === 0 && !prompt.match(/\b(אין קשישים|ללא קשישים)\b/i)) {
      usingDefaults.push("elderly")
    }

    if (structuredData.pets === 0 && !prompt.match(/\b(אין חיות|ללא חיות|אין חיות מחמד|ללא חיות מחמד)\b/i)) {
      // בדיקה אם יש אזכור של חיות מחמד בטקסט
      const petsMentioned = prompt.match(/\b(כלב|חתול|חיית מחמד|חיות מחמד)\b/i)
      if (petsMentioned && structuredData.pets === 0) {
        usingDefaults.push("pets")
      }
    }

    if (structuredData.duration_hours === 72) {
      // בדיקה אם יש אזכור של משך זמן אחר
      const durationMentioned = prompt.match(/\b(\d+)\s*(שעות|שעה)\b/i) || prompt.match(/\b(\d+)\s*(ימים|יום)\b/i)
      if (durationMentioned) {
        usingDefaults.push("duration_hours")
      }
    }

    // בדיקה אם יש אזכור של צרכים מיוחדים נוספים מעבר למה שזוהה
    if (structuredData.special_needs) {
      const allergiesMentioned = prompt.match(/\b(אלרגיה|אלרגי|אלרגית)\b/i)
      if (allergiesMentioned && !structuredData.special_needs.includes("אלרגיה")) {
        usingDefaults.push("special_needs")
      }
    }

    // הוספת מידע על ערכי ברירת מחדל לתשובה
    const responseData = {
      ...structuredData,
      using_defaults: usingDefaults,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error extracting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// פונקציה לחילוץ מידע מובנה מהפרומפט
async function extractStructuredData(prompt: string) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.error("OpenAI API key is missing")
      return fallbackExtraction(prompt)
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `אתה מערכת לחילוץ מידע מובנה מטקסט. תפקידך לחלץ מידע מדויק על משק בית לצורך הכנת רשימת ציוד חירום.
            
            חשוב מאוד לחלץ את כל הפרטים הבאים בצורה מדויקת:
            1. מספר המבוגרים במשפחה
            2. מספר הילדים וגילאיהם (ילדים מעל גיל שנתיים ועד גיל 12)
            3. מספר התינוקות (מתחת לגיל שנתיים)
            4. מספר הקשישים
            5. מספר וסוג חיות המחמד
            6. צרכים מיוחדים או מוגבלויות (כגון אלרגיות, אסטמה, מוגבלות פיזית וכו')
            7. משך זמן בשעות שהציוד צריך להספיק
            
            הנה כמה דוגמאות לחילוץ מידע:
            - "אני גר עם אשתי ושני ילדים בני 3 ו-7" = 2 מבוגרים, 2 ילדים בגילאי 3 ו-7
            - "יש לנו כלב קטן" = חיית מחמד אחת מסוג כלב
            - "אחד הילדים סובל מאלרגיה לבוטנים ואסטמה" = צרכים מיוחדים: אלרגיה לבוטנים ואסטמה
            - "להיערך לשהייה של 48 שעות" = משך זמן: 48 שעות
            
            אל תפספס פרטים חשובים ואל תניח הנחות שאינן מופיעות בטקסט.`,
          },
          {
            role: "user",
            content: `
              חלץ את המידע הבא מהטקסט והחזר אותו בפורמט JSON:
              
              1. מספר מבוגרים
              2. מספר ילדים וגילאיהם
              3. מספר תינוקות (מתחת לגיל שנתיים)
              4. מספר קשישים
              5. מספר וסוג חיות מחמד
              6. צרכים מיוחדים או מוגבלויות (כגון אלרגיות, אסטמה, מוגבלות פיזית וכו')
              7. משך זמן בשעות שהציוד צריך להספיק
              8. מיקום המגורים (דירה, בית פרטי וכו')
              
              הטקסט: "${prompt}"
              
              החזר JSON בפורמט הבא:
              {
                "adults": מספר (ברירת מחדל 2 אם לא צוין),
                "children": מספר (ברירת מחדל 0 אם לא צוין),
                "children_ages": [גילאים] (מערך ריק אם לא צוין),
                "babies": מספר (ברירת מחדל 0 אם לא צוין),
                "elderly": מספר (ברירת מחדל 0 אם לא צוין),
                "pets": מספר (ברירת מחדל 0 אם לא צוין),
                "pet_types": ["סוגי חיות"] (מערך ריק אם לא צוין),
                "special_needs": "תיאור צרכים מיוחדים" (ריק אם לא צוין),
                "duration_hours": מספר (ברירת מחדל 72 אם לא צוין),
                "location": "מיקום" (ריק אם לא צוין)
              }
              
              חשוב: אל תפספס פרטים חשובים. אם מוזכרים ילדים, חיות מחמד, צרכים מיוחדים או משך זמן ספציפי - חלץ אותם במדויק.
            `,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error("Error extracting structured data:", await response.text())
      return fallbackExtraction(prompt)
    }

    const data = await response.json()
    try {
      const parsedData = JSON.parse(data.choices[0].message.content)

      // בדיקה נוספת לפרטים חשובים שאולי פוספסו
      const result = {
        adults: parsedData.adults || 2,
        children: parsedData.children || 0,
        children_ages: parsedData.children_ages || [],
        babies: parsedData.babies || 0,
        elderly: parsedData.elderly || 0,
        pets: parsedData.pets || 0,
        pet_types: parsedData.pet_types || [],
        special_needs: parsedData.special_needs || "",
        duration_hours: parsedData.duration_hours || 72,
        location: parsedData.location || "",
      }

      // בדיקה נוספת לפרטים חשובים
      if (prompt.match(/\b(כלב|חתול)\b/i) && result.pets === 0) {
        result.pets = 1
        result.pet_types = prompt.match(/\b(כלב)\b/i) ? ["כלב"] : prompt.match(/\b(חתול)\b/i) ? ["חתול"] : []
      }

      // בדיקה למשך זמן
      const durationMatch = prompt.match(/\b(\d+)\s*(שעות|שעה)\b/i)
      if (durationMatch && result.duration_hours === 72) {
        result.duration_hours = Number.parseInt(durationMatch[1])
      }

      // בדיקה לימים והמרה לשעות
      const daysMatch = prompt.match(/\b(\d+)\s*(ימים|יום)\b/i)
      if (daysMatch && result.duration_hours === 72) {
        result.duration_hours = Number.parseInt(daysMatch[1]) * 24
      }

      // בדיקה לאלרגיות
      if (prompt.match(/\b(אלרגיה|אלרגי|אלרגית)\b/i) && !result.special_needs.includes("אלרגיה")) {
        const allergyMatch = prompt.match(/אלרגיה\s+ל([א-ת\s]+)/i)
        if (allergyMatch) {
          const allergyTo = allergyMatch[1].trim()
          result.special_needs = result.special_needs
            ? `${result.special_needs}, אלרגיה ל${allergyTo}`
            : `אלרגיה ל${allergyTo}`
        } else {
          result.special_needs = result.special_needs ? `${result.special_needs}, אלרגיה` : "אלרגיה"
        }
      }

      // בדיקה לאסטמה
      if (prompt.match(/\b(אסטמה)\b/i) && !result.special_needs.includes("אסטמה")) {
        result.special_needs = result.special_needs ? `${result.special_needs}, אסטמה` : "אסטמה"
      }

      return result
    } catch (error) {
      console.error("Error parsing structured data:", error, "Raw content:", data.choices[0].message.content)
      return fallbackExtraction(prompt)
    }
  } catch (error) {
    console.error("Unexpected error in extractStructuredData:", error)
    return fallbackExtraction(prompt)
  }
}

// פונקציית גיבוי לחילוץ מידע בסיסי באמצעות ביטויים רגולריים
function fallbackExtraction(prompt: string) {
  console.log("Using fallback extraction for prompt:", prompt)

  // ערכי ברירת מחדל
  let adults = 2
  let children = 0
  let children_ages = []
  let babies = 0
  const elderly = 0
  let pets = 0
  const pet_types = []
  let special_needs = ""
  let duration_hours = 72
  let location = ""

  // חילוץ מספר מבוגרים
  const adultsMatch =
    prompt.match(/\b(\d+)\s*(מבוגרים|אנשים|בוגרים)\b/i) ||
    prompt.match(/\b(אני ואשתי|אני ובעלי|אני ובן זוגי|אני ובת זוגי|זוג)\b/i)
  if (adultsMatch) {
    if (adultsMatch[1] && !isNaN(Number.parseInt(adultsMatch[1]))) {
      adults = Number.parseInt(adultsMatch[1])
    } else {
      adults = 2 // זוג = 2 מבוגרים
    }
  }

  // חילוץ מספר ילדים
  const childrenMatch = prompt.match(/\b(\d+)\s*(ילדים|ילד)\b/i)
  if (childrenMatch && childrenMatch[1]) {
    children = Number.parseInt(childrenMatch[1])

    // חילוץ גילאי ילדים
    const agesMatch =
      prompt.match(/\bגילאים?\s*(\d+)\s*ו[-]?(\d+)\b/i) ||
      prompt.match(/\bבני\s*(\d+)\s*ו[-]?(\d+)\b/i) ||
      prompt.match(/\bבגילאי\s*(\d+)\s*ו[-]?(\d+)\b/i)
    if (agesMatch && agesMatch[1] && agesMatch[2]) {
      children_ages = [Number.parseInt(agesMatch[1]), Number.parseInt(agesMatch[2])]
    } else {
      // חיפוש גילאים בודדים
      const singleAgeMatches = [...prompt.matchAll(/\bבן\s*(\d+)\b|\bבת\s*(\d+)\b|\bגיל\s*(\d+)\b/gi)]
      if (singleAgeMatches.length > 0) {
        children_ages = singleAgeMatches
          .map((match) => Number.parseInt(match[1] || match[2] || match[3]))
          .filter((age) => !isNaN(age))
      }
    }

    // בדיקה אם יש תינוקות (מתחת לגיל שנתיים)
    if (children_ages.length > 0) {
      const babiesCount = children_ages.filter((age) => age < 2).length
      if (babiesCount > 0) {
        babies = babiesCount
        children = children - babiesCount
        children_ages = children_ages.filter((age) => age >= 2)
      }
    }
  }

  // חילוץ מספר חיות מחמד
  const petsMatch =
    prompt.match(/\b(\d+)\s*(חיות|חיות מחמד|כלבים|חתולים)\b/i) || prompt.match(/\b(כלב|חתול|חיית מחמד)\b/i)
  if (petsMatch) {
    if (petsMatch[1] && !isNaN(Number.parseInt(petsMatch[1]))) {
      pets = Number.parseInt(petsMatch[1])
    } else {
      pets = 1 // אם מוזכר כלב/חתול ללא מספר, מניחים שיש אחד
    }

    // זיהוי סוג חיית המחמד
    if (prompt.match(/\b(כלב)\b/i)) {
      pet_types.push("כלב")
    }
    if (prompt.match(/\b(חתול)\b/i)) {
      pet_types.push("חתול")
    }
  }

  // חילוץ צרכים מיוחדים
  if (prompt.match(/\b(אסטמה)\b/i)) {
    special_needs = special_needs ? `${special_needs}, אסטמה` : "אסטמה"
  }
  if (prompt.match(/\b(אלרגיה|אלרגי|אלרגית)\b/i)) {
    const allergyMatch = prompt.match(/אלרגיה\s+ל([א-ת\s]+)/i)
    if (allergyMatch) {
      const allergyTo = allergyMatch[1].trim()
      special_needs = special_needs ? `${special_needs}, אלרגיה ל${allergyTo}` : `אלרגיה ל${allergyTo}`
    } else {
      special_needs = special_needs ? `${special_needs}, אלרגיה` : "אלרגיה"
    }
  }
  if (prompt.match(/\b(סוכרת|סכרת)\b/i)) {
    special_needs = special_needs ? `${special_needs}, סוכרת` : "סוכרת"
  }
  if (prompt.match(/\b(לחץ דם גבוה|יתר לחץ דם)\b/i)) {
    special_needs = special_needs ? `${special_needs}, לחץ דם גבוה` : "לחץ דם גבוה"
  }
  if (prompt.match(/\b(מוגבלות|נכות|כיסא גלגלים|הליכון)\b/i)) {
    special_needs = special_needs ? `${special_needs}, מוגבלות פיזית` : "מוגבלות פיזית"
  }

  // חילוץ משך זמן
  const hoursMatch = prompt.match(/\b(\d+)\s*(שעות|שעה)\b/i)
  if (hoursMatch && hoursMatch[1]) {
    duration_hours = Number.parseInt(hoursMatch[1])
  } else {
    const daysMatch = prompt.match(/\b(\d+)\s*(ימים|יום)\b/i)
    if (daysMatch && daysMatch[1]) {
      duration_hours = Number.parseInt(daysMatch[1]) * 24
    }
  }

  // חילוץ מיקום
  if (prompt.match(/\b(דירה)\b/i)) {
    location = "דירה"

    // בדיקה אם יש מידע על קומה
    const floorMatch = prompt.match(/\b(קומה|בקומה)\s*(\d+)\b/i)
    if (floorMatch && floorMatch[2]) {
      location = `דירה בקומה ${floorMatch[2]}`
    }
  } else if (prompt.match(/\b(בית פרטי|בית צמוד קרקע|וילה)\b/i)) {
    location = "בית פרטי"
  }

  // בדיקה אם יש מידע על עיר/יישוב
  const cityMatch = prompt.match(
    /\b(ב|ב־|ב-)(תל אביב|ירושלים|חיפה|באר שבע|רמת גן|גבעתיים|הרצליה|רעננה|כפר סבא|נתניה|חולון|בת ים|אשדוד|אשקלון|פתח תקווה|רחובות|לוד|רמלה|מודיעין|אילת)\b/i,
  )
  if (cityMatch && cityMatch[2]) {
    location = location ? `${location} ב${cityMatch[2]}` : cityMatch[2]
  }

  return {
    adults,
    children,
    children_ages,
    babies,
    elderly,
    pets,
    pet_types,
    special_needs,
    duration_hours,
    location,
  }
}
