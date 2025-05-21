import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { keyword, itemName, lang } = await request.json()

    if (!keyword || !itemName) {
      return NextResponse.json({ error: "Keyword and itemName are required" }, { status: 400 })
    }

    // בדיקה אם מפתח ה-API של OpenAI זמין
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    // הכנת הפרומפט עבור OpenAI
    const prompt = `
      Decide if the term "${keyword}" is semantically related to the emergency item "${itemName}". 
      Return only "yes" or "no".
      Language: ${lang}
    `

    // קריאה ל-OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an assistant that decides if two terms are semantically related." },
          { role: "user", content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 2,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json({ error: "Error calling OpenAI API" }, { status: 500 })
    }

    const data = await response.json()
    const answer = data.choices[0].message.content.toLowerCase()
    const isMatch = answer.includes("yes")

    return NextResponse.json({ isMatch })
  } catch (error) {
    console.error("Error in semantic match API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
