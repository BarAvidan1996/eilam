import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Log in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Login failed" }, { status: 500 })
    }

    // Check if user exists in private.users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    // If user doesn't exist in private.users, create them
    if (userError && userError.code === "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.user_metadata?.first_name || "",
        last_name: data.user.user_metadata?.last_name || "",
        phone: data.user.user_metadata?.phone || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error creating user profile:", insertError)
        // We still want to continue with login even if profile creation fails
      }
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error("Error in login route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
