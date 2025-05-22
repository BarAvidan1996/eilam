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
      !prompt.match(/\b(שני מבוגרים|2 מבוגרים|שני אנשים|2 אנשים|זוג|אני ובן זוגי|אני ואשתי)\b/i)
    ) {
      usingDefaults.push("adults")
    }

    if (structuredData.children === 0 && !prompt.match(/\b(אין ילדים|ללא ילדים)\b/i)) {
      usingDefaults.push("children")
    }

    if (structuredData.babies === 0 && !prompt.match(/\b(אין תינוקות|ללא תינוקות)\b/i)) {
      usingDefaults.push("babies")
    }

    if (structuredData.elderly === 0 && !prompt.match(/\b(אין קשישים|ללא קשישים)\b/i)) {
      usingDefaults.push("elderly")
    }

    if (structuredData.pets === 0 && !prompt.match(/\b(אין חיות|ללא חיות|אין חיות מחמד|ללא חיות מחמד)\b/i)) {
      usingDefaults.push("pets")
    }

    if (structuredData.duration_hours === 72 && !prompt.match(/\b(72 שעות|שלושה ימים|3 ימים)\b/i)) {
      usingDefaults.push("duration_hours")
    }

    if (!structuredData.special_needs || structuredData.special_needs.length === 0) {
      usingDefaults.push("special_needs")
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
      return {
        adults: 2,
        children: 0,
        children_ages: [],
        babies: 0,
        elderly: 0,
        pets: 0,
        pet_types: [],
        special_needs: "",
        duration_hours: 72,
        location: "",
      }
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
            
            השתמש בטכניקות של חיפוש סמנטי ומרחק לוינשטיין כדי לזהות מושגים דומים. למשל:
            - "ילד בן 5" צריך להיות מזוהה כילד אחד בגיל 5
            - "יש לנו כלב" צריך להיות מזוהה כחיית מחמד אחת מסוג כלב
            - "אני משתמש בהליכון" צריך להיות מזוהה כצורך מיוחד של ניידות מוגבלת
            
            נסה לזהות גם מידע משתמע, אך אל תמציא מידע שלא קיים בטקסט.`,
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
              
              חשוב: אל תוסיף מידע שלא מופיע בטקסט המקורי. אם מידע מסוים לא מופיע, השתמש בברירת המחדל.
            `,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error("Error extracting structured data:", await response.text())
      return {
        adults: 2,
        children: 0,
        children_ages: [],
        babies: 0,
        elderly: 0,
        pets: 0,
        pet_types: [],
        special_needs: "",
        duration_hours: 72,
        location: "",
      }
    }

    const data = await response.json()
    try {
      const parsedData = JSON.parse(data.choices[0].message.content)
      return {
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
    } catch (error) {
      console.error("Error parsing structured data:", error, "Raw content:", data.choices[0].message.content)
      return {
        adults: 2,
        children: 0,
        children_ages: [],
        babies: 0,
        elderly: 0,
        pets: 0,
        pet_types: [],
        special_needs: "",
        duration_hours: 72,
        location: "",
      }
    }
  } catch (error) {
    console.error("Unexpected error in extractStructuredData:", error)
    return {
      adults: 2,
      children: 0,
      children_ages: [],
      babies: 0,
      elderly: 0,
      pets: 0,
      pet_types: [],
      special_needs: "",
      duration_hours: 72,
      location: "",
    }
  }
}
