import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Initialize Twilio client
const twilio = require("twilio")(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!)

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Get phone number from query params or use a default
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")
    const itemId = searchParams.get("itemId")

    // Validate parameters
    if (!phone && !itemId) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          message: "Please provide either 'phone' or 'itemId' parameter",
          example: "/api/test-sms?phone=0501234567 or /api/test-sms?itemId=123",
        },
        { status: 400 },
      )
    }

    let targetPhone = phone
    let itemName = "בדיקת מערכת"
    let expiryDate = new Date().toLocaleDateString("he-IL")

    // If itemId is provided, get the item and user details
    if (itemId) {
      const { data: item, error: itemError } = await supabase
        .from("equipment_items")
        .select(`
          id,
          name,
          expiration_date,
          equipment_lists!inner (
            id,
            user_id
          )
        `)
        .eq("id", itemId)
        .single()

      if (itemError || !item) {
        return NextResponse.json(
          { error: "Item not found", details: itemError?.message || "Item with this ID does not exist" },
          { status: 404 },
        )
      }

      // Get user phone
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", item.equipment_lists.user_id)
        .single()

      if (userError || !userData || !userData.phone) {
        return NextResponse.json(
          { error: "User phone not found", details: userError?.message || "User has no phone number" },
          { status: 404 },
        )
      }

      targetPhone = userData.phone
      itemName = item.name
      expiryDate = new Date(item.expiration_date).toLocaleDateString("he-IL")
    }

    if (!targetPhone) {
      return NextResponse.json({ error: "No phone number available" }, { status: 400 })
    }

    // Format phone number for Israel (+972)
    let formattedPhone = targetPhone
    if (targetPhone.startsWith("0")) {
      formattedPhone = `+972${targetPhone.substring(1)}`
    } else if (!targetPhone.startsWith("+")) {
      formattedPhone = `+972${targetPhone}`
    }

    // Create test message
    const message = `🧪 בדיקת מערכת: תזכורת לפריט "${itemName}" שתוקפו פג או עומד לפוג (${expiryDate}). מומלץ להחליפו בהקדם.`

    // Send SMS via Twilio
    const smsResult = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_FROM!,
      to: formattedPhone,
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: `SMS sent successfully to ${formattedPhone}`,
      smsId: smsResult.sid,
      details: {
        phone: formattedPhone,
        itemName,
        expiryDate,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error sending test SMS:", error)
    return NextResponse.json(
      {
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
