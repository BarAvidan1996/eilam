import { NextResponse } from "next/server"
import { User } from "@/entities/User"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Login user
    const user = await User.login(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in login route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
