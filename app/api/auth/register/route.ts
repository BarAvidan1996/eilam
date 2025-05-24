import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // 1. Register user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    // 2. Add user to private.users table
    const { error: insertError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("DB insert error:", insertError)
      // We don't want to fail the registration if the DB insert fails
      // The auth record is still created, and we can fix the DB issue later
      return NextResponse.json({
        user: authData.user,
        warning: "User created but profile data not saved. Please update your profile.",
      })
    }

    // 3. Create an empty equipment list for the new user
    try {
      const { error: equipmentListError } = await supabase.from("equipment_list").insert({
        title: "רשימת ציוד לחירום",
        description: "רשימת ציוד חיונית למצבי חירום",
        user_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (equipmentListError) {
        console.error("Error creating empty equipment list:", equipmentListError)
        // We don't want to fail the registration if this fails
      }
    } catch (equipmentError) {
      console.error("Error creating empty equipment list:", equipmentError)
      // We don't want to fail the registration if this fails
    }

    return NextResponse.json({ user: authData.user })
  } catch (error) {
    console.error("Error in register route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
