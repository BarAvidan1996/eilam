import { NextResponse } from "next/server"
import { User } from "@/entities/User"

export async function POST() {
  try {
    // Logout user
    const success = await User.logout()

    if (!success) {
      return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in logout route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
