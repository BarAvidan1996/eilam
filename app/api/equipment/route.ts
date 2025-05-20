import { NextResponse } from "next/server"
import { EquipmentList } from "@/entities/EquipmentList"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderBy = searchParams.get("orderBy") || undefined

    // Get equipment lists
    const lists = await EquipmentList.list(orderBy)

    return NextResponse.json({ lists })
  } catch (error) {
    console.error("Error in equipment lists route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate input
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Create equipment list
    const list = await EquipmentList.create(data)

    return NextResponse.json({ list })
  } catch (error) {
    console.error("Error in create equipment list route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
