import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 === TESTING OPENAI API ===")

    // Check if we have API key
    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    console.log("🧪 OpenAI API Key available:", !!openaiKey)

    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: "No OpenAI API key found",
        checkedVars: ["OPENAI_API_KEY", "NEXT_PUBLIC_OPENAI_API_KEY"],
      })
    }

    console.log("🧪 API Key length:", openaiKey.length)
    console.log("🧪 API Key prefix:", openaiKey.substring(0, 10) + "...")

    // Test simple text generation
    const startTime = Date.now()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Say hello in Hebrew",
      temperature: 0.1,
    })

    const endTime = Date.now()

    console.log("✅ OpenAI API test successful")
    console.log("✅ Response:", text)
    console.log("✅ Time taken:", endTime - startTime, "ms")

    return NextResponse.json({
      success: true,
      response: text,
      timeTaken: endTime - startTime,
      model: "gpt-4o",
    })
  } catch (error) {
    console.error("❌ OpenAI API test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    )
  }
}
