import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Initialize Supabase client with service role key for admin access
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Twilio client
const twilio = require("twilio")(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Starting expiry notifications cron job...")

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Query for equipment items that need SMS notifications
    const { data: items, error } = await supabase
      .from("equipment_items")
      .select(`
        id,
        name,
        expiration_date,
        sms_notification,
        sms_sent,
        equipment_lists!inner (
          id,
          user_id
        )
      `)
      .eq("sms_notification", true)
      .or("sms_sent.is.null,sms_sent.eq.false")
      .lte("expiration_date", today)
      .not("expiration_date", "is", null)

    if (error) {
      console.error("❌ Error fetching equipment items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!items || items.length === 0) {
      console.log("✅ No items found that need expiry notifications")
      return NextResponse.json({
        message: "No items found that need expiry notifications",
        processed: 0,
      })
    }

    console.log(`📋 Found ${items.length} items that need notifications`)

    let successCount = 0
    let errorCount = 0

    // Process each item
    for (const item of items) {
      try {
        // Get user data from private.users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("phone")
          .eq("id", item.equipment_lists.user_id)
          .single()

        if (userError || !userData) {
          console.error(`❌ Error fetching user data for item ${item.id}:`, userError)
          errorCount++
          continue
        }

        // Get phone number directly from users table
        const phone = userData.phone

        if (!phone) {
          console.log(`⚠️ No phone number found for item ${item.id}`)
          errorCount++
          continue
        }

        // Format phone number for Israel (+972)
        let formattedPhone = phone
        if (phone.startsWith("0")) {
          formattedPhone = `+972${phone.substring(1)}`
        } else if (!phone.startsWith("+")) {
          formattedPhone = `+972${phone}`
        }

        // Create SMS message
        const expiryDate = new Date(item.expiration_date).toLocaleDateString("he-IL")
        const message = `🚨 תזכורת: תוקף הפריט "${item.name}" פג או עומד לפוג (${expiryDate}). מומלץ להחליפו בהקדם.`

        // Send SMS via Twilio
        await twilio.messages.create({
          body: message,
          from: process.env.TWILIO_FROM!,
          to: formattedPhone,
        })

        // Mark as SMS sent
        const { error: updateError } = await supabase
          .from("equipment_items")
          .update({
            sms_sent: true,
            sms_sent_at: new Date().toISOString(),
          })
          .eq("id", item.id)

        if (updateError) {
          console.error(`❌ Error updating SMS status for item ${item.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ SMS sent successfully to ${formattedPhone} for item "${item.name}"`)
          successCount++
        }
      } catch (smsError) {
        console.error(`❌ Error sending SMS for item ${item.id}:`, smsError)
        errorCount++
      }

      // Add small delay between SMS sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log(`🎯 Cron job completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      message: "Expiry notifications processed",
      totalItems: items.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Cron job failed:", error)
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Verify the request is from Vercel Cron
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return GET(request)
}
