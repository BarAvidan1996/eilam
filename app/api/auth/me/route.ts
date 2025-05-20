import { NextResponse } from "next/server"
import { User } from "@/entities/User"

export async function GET() {
  try {
    // Get current user
    const user = await User.me()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in me route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
