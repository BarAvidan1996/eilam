import { NextResponse } from "next/server"

// Regex patterns for entity extraction
const patterns = {
  adults: /(\d+)\s*(מבוגרים|בוגרים|אנשים|אדם|מבוגר|בוגר)/i,
  children: /(\d+)\s*(ילדים|ילד|ילדות|ילדה)/i,
  babies: /(\d+)\s*(תינוקות|תינוק|תינוקת)/i,
  elderly: /(\d+)\s*(קשישים|קשיש|קשישה|קשישות|מבוגרים מעל 65|זקנים|זקן|זקנה)/i,
  pets: /(\d+)\s*(חיות מחמד|חיות|חיה|כלבים|כלב|חתולים|חתול|חתולה|חיית מחמד)/i,
  duration_hours: /(\d+)\s*(שעות|שעה|שע'|ש'|שעות חירום|שעות של חירום)/i,
  duration_days: /(\d+)\s*(ימים|יום|י'|ימי חירום|ימים של חירום)/i,
}

// Special needs patterns
const specialNeedsPatterns = [
  { pattern: /(מוגבלות|נכות|נכה|כיסא גלגלים|הליכון|קביים)/i, value: "מוגבלות פיזית" },
  { pattern: /(אלרגיה|אלרגי|אלרגית|רגישות|אלרגיות)/i, value: "אלרגיה" },
  { pattern: /(אסטמה|קוצר נשימה|בעיות נשימה|מחלת ריאות)/i, value: "בעיות נשימה" },
  { pattern: /(סוכרת|סכרת|סוכרתי|סוכרתית)/i, value: "סוכרת" },
  { pattern: /(לחץ דם|יתר לחץ דם|לחץ דם גבוה)/i, value: "לחץ דם גבוה" },
  { pattern: /(לב|מחלת לב|בעיות לב|התקף לב)/i, value: "בעיות לב" },
  { pattern: /(תרופות|תרופה|טיפול תרופתי|תרופות קבועות)/i, value: "נדרש טיפול תרופתי קבוע" },
  { pattern: /(חירש|חירשת|חירשות|כבד שמיעה|לקות שמיעה|בעיות שמיעה)/i, value: "לקות שמיעה" },
  { pattern: /(עיוור|עיוורת|עיוורון|לקות ראייה|בעיות ראייה|כבד ראייה)/i, value: "לקות ראייה" },
  { pattern: /(אוטיזם|ספקטרום האוטיזם|על הרצף|אוטיסט|אוטיסטית)/i, value: "על הספקטרום האוטיסטי" },
  { pattern: /(קוגניטיבי|לקות קוגניטיבית|פיגור|מוגבלות שכלית)/i, value: "מוגבלות קוגניטיבית" },
  { pattern: /(נפשי|בעיה נפשית|הפרעה נפשית|חרדה|דיכאון)/i, value: "בעיות נפשיות" },
]

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Initialize extracted data with default values
    const extractedData = {
      adults: 0,
      children: 0,
      babies: 0,
      elderly: 0,
      pets: 0,
      duration_hours: 72, // Default 3 days
      special_needs: "",
      using_defaults: {
        adults: true,
        children: true,
        babies: true,
        elderly: true,
        pets: true,
        duration: true,
        special_needs: true,
      },
    }

    // Extract numeric entities
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = prompt.match(pattern)
      if (match && match[1]) {
        const value = Number.parseInt(match[1], 10)

        if (key === "duration_days") {
          // Convert days to hours
          extractedData.duration_hours = value * 24
          extractedData.using_defaults.duration = false
        } else if (key === "duration_hours") {
          extractedData.duration_hours = value
          extractedData.using_defaults.duration = false
        } else if (key in extractedData) {
          extractedData[key] = value
          extractedData.using_defaults[key] = false
        }
      }
    }

    // If no adults were detected but there are children or babies, assume at least 1 adult
    if (extractedData.adults === 0 && (extractedData.children > 0 || extractedData.babies > 0)) {
      extractedData.adults = 1
      // Still mark as default since it's an assumption
      extractedData.using_defaults.adults = true
    }

    // Extract special needs
    const specialNeeds = []
    for (const { pattern, value } of specialNeedsPatterns) {
      if (pattern.test(prompt)) {
        specialNeeds.push(value)
      }
    }

    if (specialNeeds.length > 0) {
      extractedData.special_needs = specialNeeds.join(", ")
      extractedData.using_defaults.special_needs = false
    } else {
      extractedData.special_needs = "לא צוין"
    }

    // If we have no information at all, assume a default family
    if (
      extractedData.adults === 0 &&
      extractedData.children === 0 &&
      extractedData.babies === 0 &&
      extractedData.elderly === 0
    ) {
      extractedData.adults = 2
      extractedData.using_defaults.adults = true
    }

    console.log("Extracted data:", extractedData)
    return NextResponse.json(extractedData)
  } catch (error) {
    console.error("Error in extract-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
