import { NextResponse } from "next/server"

const analyzePromptAndCreatePlan = async (prompt: string) => {
  const promptLower = prompt.toLowerCase()
  const tools: any[] = []

  // Enhanced shelter search detection
  if (
    promptLower.includes("מקלט") ||
    promptLower.includes("מקלטים") ||
    promptLower.includes("איפה") ||
    promptLower.includes("מיקום") ||
    promptLower.includes("קרוב") ||
    promptLower.includes("shelter") ||
    promptLower.includes("אזעקה") ||
    promptLower.includes("alert") ||
    promptLower.includes("ממ״ד") ||
    promptLower.includes("ממ״ק") ||
    promptLower.includes("מרחב מוגן") ||
    (promptLower.includes("לאן") && (promptLower.includes("ללכת") || promptLower.includes("לרוץ")))
  ) {
    // Extract location from prompt
    let location = "תל אביב" // default
    const radius = 2000 // default 2km

    // Try to extract specific location
    const locationPatterns = [
      /ב([א-ת\s]+)/g, // "ב..." pattern
      /רחוב\s+([א-ת\s]+)/g, // "רחוב ..." pattern
      /(תל אביב|ירושלים|חיפה|באר שבע|אשדוד|פתח תקווה|נתניה|חולון|בת ים|רמת גן|אשקלון|ראשון לציון)/gi,
    ]

    for (const pattern of locationPatterns) {
      const match = pattern.exec(prompt)
      if (match && match[1]) {
        location = match[1].trim()
        break
      }
    }

    tools.push({
      id: "find_shelters",
      name: "חיפוש מקלטים קרובים",
      priority: 1,
      reasoning: `מזהה בקשה לחיפוש מקלטים באזור ${location}. חיפוש ברדיוס ${radius / 1000} ק"מ.`,
      parameters: {
        location: location,
        radius: radius,
        maxResults: 10,
      },
    })
  }

  return tools
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const plan = await analyzePromptAndCreatePlan(prompt)

    return NextResponse.json(plan)
  } catch (error) {
    console.log("[AGENT_PLAN_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
