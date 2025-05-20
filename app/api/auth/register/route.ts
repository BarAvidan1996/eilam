import { NextResponse } from "next/server"
import { User } from "@/entities/User"

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Register user
    const user = await User.register(email, password, userData)

    if (!user) {
      return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in register route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
