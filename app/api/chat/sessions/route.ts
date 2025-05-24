import { type NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createChatSession, getUserChatSessions } from "@/lib/services/rag-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientComponentClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chatSessions = await getUserChatSessions(session.user.id)
    return NextResponse.json({ sessions: chatSessions })
  } catch (error) {
    console.error("Sessions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientComponentClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await request.json()
    const sessionId = await createChatSession(session.user.id, title)

    return NextResponse.json({ sessionId })
  } catch (error) {
    console.error("Create session API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
