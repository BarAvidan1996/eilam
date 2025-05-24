import { type NextRequest, NextResponse } from "next/server"
import { answerQuestion } from "@/lib/services/rag-service"

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId, userId, method = "stepback" } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const result = await answerQuestion(question, sessionId, userId, method)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
