import { NextResponse } from "next/server"
import { EquipmentList } from "@/entities/EquipmentList"

export async function GET(request: Request, { params }: { params: { listId: string } }) {
  try {
    const listId = params.listId

    // Get equipment list
    const list = await EquipmentList.get(listId)

    if (!list) {
      return NextResponse.json({ error: "Equipment list not found" }, { status: 404 })
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error("Error in get equipment list route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { listId: string } }) {
  try {
    const listId = params.listId
    const data = await request.json()

    // Update equipment list
    const list = await EquipmentList.update(listId, data)

    return NextResponse.json({ list })
  } catch (error) {
    console.error("Error in update equipment list route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { listId: string } }) {
  try {
    const listId = params.listId

    // Delete equipment list
    const success = await EquipmentList.delete(listId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete equipment list" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete equipment list route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
