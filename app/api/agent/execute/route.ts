import { type NextRequest, NextResponse } from "next/server"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { initializeAgentExecutorWithOptions } from "langchain/agents"
import { SerpAPI } from "langchain/tools"
import { Calculator } from "langchain/tools/calculator"

import { CustomWebBrowser } from "@/utils/custom_web_browser"
import { z } from "zod"
import { getPrompt } from "@/utils/prompts"
import { ZapierNLAWrapper } from "@/utils/zapier"
import { EmailPlugin } from "@/utils/email"
import { ShelterSearchService } from "@/utils/shelter_search"

const TEMPLATE = `You are a helpful assistant designed to use tools to answer questions.
You have access to the following tools:

{tool_descriptions}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
{agent_scratchpad}`

const SHELTER_SEARCH_DESCRIPTION = `שימושי כאשר משתמש מבקש למצוא מקלטים בסביבה שלו.
הכלי מקבל מיקום, רדיוס חיפוש ומספר תוצאות מקסימלי.
השתמש תמיד בערכים מספריים עבור רדיוס החיפוש ומספר התוצאות המקסימלי.
אם המשתמש לא מציין רדיוס חיפוש, השתמש בערך ברירת מחדל של 1000 מטר.
אם המשתמש לא מציין מספר תוצאות מקסימלי, השתמש בערך ברירת מחדל של 3.`

const SHELTER_SEARCH_SCHEMA = z.object({
  location: z.string().optional().describe("המיקום בו יתבצע חיפוש המקלטים"),
  radius: z.number().optional().describe("רדיוס החיפוש במטרים, ברירת מחדל היא 1000"),
  maxResults: z.number().optional().describe("מספר התוצאות המקסימלי שיוחזרו, ברירת מחדל היא 3"),
  lat: z.string().optional().describe("קו רוחב של מיקום החיפוש"),
  lng: z.string().optional().describe("קו אורך של מיקום החיפוש"),
})

const MISINFORMATION_CHECK_DESCRIPTION = `שימושי כדי לבדוק אם טענה מסוימת היא נכונה או לא.
הכלי מקבל טענה (query) ומחזיר את תוצאות בדיקת העובדות הרלוונטיות ביותר.`

const MISINFORMATION_CHECK_SCHEMA = z.object({
  query: z.string().describe("השאילתה לחיפוש"),
})

const WEATHER_CHECK_DESCRIPTION = `שימושי כדי לבדוק מה מזג האוויר כרגע במיקום מסוים.
הכלי מקבל מיקום (location) ומחזיר את נתוני מזג האוויר הרלוונטיים ביותר.`

const WEATHER_CHECK_SCHEMA = z.object({
  location: z.string().describe("המיקום לבדיקת מזג האוויר"),
})

const EMAIL_SEND_DESCRIPTION = `שימושי כדי לשלוח מייל למישהו.
הכלי מקבל כתובת מייל של הנמען, נושא ותוכן.`

const EMAIL_SEND_SCHEMA = z.object({
  to: z.string().describe("כתובת המייל של הנמען"),
  subject: z.string().describe("נושא המייל"),
  body: z.string().describe("תוכן המייל"),
})

const availableTools = {
  misinformation_check: {
    name: "misinformation_check",
    description: MISINFORMATION_CHECK_DESCRIPTION,
    schema: MISINFORMATION_CHECK_SCHEMA,
  },
  weather_check: {
    name: "weather_check",
    description: WEATHER_CHECK_DESCRIPTION,
    schema: WEATHER_CHECK_SCHEMA,
  },
  send_email: {
    name: "send_email",
    description: EMAIL_SEND_DESCRIPTION,
    schema: EMAIL_SEND_SCHEMA,
  },
  find_shelters: {
    name: "find_shelters",
    description: SHELTER_SEARCH_DESCRIPTION,
    schema: SHELTER_SEARCH_SCHEMA,
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages } = body

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-4",
      // modelName: "gpt-3.5-turbo",
      verbose: true,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const tools = [
      new SerpAPI(process.env.SERPAPI_API_KEY, {
        hl: "he",
        gl: "il",
      }),
      new Calculator(),
      new CustomWebBrowser({ model }),
      new ZapierNLAWrapper({ apiKey: process.env.ZAPIER_NLA_API_KEY }),
      new EmailPlugin(),
    ]

    const shelterSearchService = new ShelterSearchService()

    const prompt = getPrompt(TEMPLATE)

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
      prompt,
      verbose: true,
    })

    const response = await executor.call({ input: messages.at(-1).content })

    const actionMatch =
      response.intermediateSteps.length > 0
        ? response.intermediateSteps[response.intermediateSteps.length - 1][0].tool
        : null

    const parametersMatch =
      response.intermediateSteps.length > 0
        ? JSON.parse(response.intermediateSteps[response.intermediateSteps.length - 1][0].content)
        : null

    switch (actionMatch) {
      case "misinformation_check": {
        try {
          const { query } = parametersMatch

          const fakeCheck = new SerpAPI(process.env.SERPAPI_API_KEY, {
            engine: "google",
            q: `${query} site:meedan.com`,
            location: "Israel",
            hl: "he",
            gl: "il",
          })

          const result = await fakeCheck.call(query)

          return NextResponse.json({
            success: true,
            toolId: "misinformation_check",
            result,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ Fake check error:", error)
          return NextResponse.json({
            success: false,
            toolId: "misinformation_check",
            error: error instanceof Error ? error.message : "שגיאה בבדיקת מידע",
            timestamp: new Date().toISOString(),
          })
        }
      }
      case "weather_check": {
        try {
          const { location } = parametersMatch

          const weatherCheck = new SerpAPI(process.env.SERPAPI_API_KEY, {
            engine: "google",
            q: `weather in ${location}`,
            location: "Israel",
            hl: "he",
            gl: "il",
          })

          const result = await weatherCheck.call(location)

          return NextResponse.json({
            success: true,
            toolId: "weather_check",
            result,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ Weather check error:", error)
          return NextResponse.json({
            success: false,
            toolId: "weather_check",
            error: error instanceof Error ? error.message : "שגיאה בבדיקת מזג האוויר",
            timestamp: new Date().toISOString(),
          })
        }
      }
      case "send_email": {
        try {
          const { to, subject, body } = parametersMatch

          const emailPlugin = new EmailPlugin()

          const result = await emailPlugin.sendEmail(to, subject, body)

          return NextResponse.json({
            success: true,
            toolId: "send_email",
            result,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ Email send error:", error)
          return NextResponse.json({
            success: false,
            toolId: "send_email",
            error: error instanceof Error ? error.message : "שגיאה בשליחת מייל",
            timestamp: new Date().toISOString(),
          })
        }
      }
      case "find_shelters": {
        try {
          const { location, radius = 1000, maxResults = 3, lat, lng } = parametersMatch

          let searchCoordinates: { lat: number; lng: number } | null = null

          // If we have coordinates, use them directly
          if (lat && lng) {
            searchCoordinates = { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) }
            console.log("🏠 Using provided coordinates:", searchCoordinates)
          } else if (location) {
            // Geocode the location
            console.log("🏠 Geocoding location:", location)
            searchCoordinates = await shelterSearchService.geocodeAddress(location)

            if (!searchCoordinates) {
              throw new Error(`לא ניתן למצוא את המיקום: ${location}`)
            }
            console.log("🏠 Geocoded coordinates:", searchCoordinates)
          } else {
            throw new Error("נדרש מיקום או קואורדינטות לחיפוש מקלטים")
          }

          const shelters = await shelterSearchService.searchShelters({
            location: searchCoordinates,
            radius: Number.parseInt(radius.toString()),
            maxResults: Number.parseInt(maxResults.toString()),
          })

          return NextResponse.json({
            success: true,
            toolId: "find_shelters",
            result: {
              type: "shelter_search",
              shelters,
              searchLocation: searchCoordinates, // Include search location for navigation
              coordinates: searchCoordinates, // For backward compatibility
              query: { location, radius, maxResults },
            },
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("❌ Shelter search error:", error)
          return NextResponse.json({
            success: false,
            toolId: "find_shelters",
            error: error instanceof Error ? error.message : "שגיאה בחיפוש מקלטים",
            timestamp: new Date().toISOString(),
          })
        }
      }
      default: {
        return NextResponse.json({
          success: false,
          toolId: null,
          result: response,
          timestamp: new Date().toISOString(),
        })
      }
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    })
  }
}
