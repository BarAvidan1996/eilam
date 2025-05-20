import { NextResponse } from "next/server"
import { EquipmentList } from "@/entities/EquipmentList"

export async function PUT(request: Request, { params }: { params: { listId: string; itemId: string } }) {
  try {
    const { listId, itemId } = params
    const itemData = await request.json()

    // Get the list
    const list = await EquipmentList.get(listId)

    if (!list) {
      return NextResponse.json({ error: "Equipment list not found" }, { status: 404 })
    }

    // Update the item in the list
    const items = (list.items || []).map((item) => (item.id === itemId ? { ...item, ...itemData } : item))

    // Update the list with the updated items
    const updatedList = await EquipmentList.update(listId, { items })

    return NextResponse.json({ list: updatedList })
  } catch (error) {
    console.error("Error in update equipment item route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { listId: string; itemId: string } }) {
  try {
    const { listId, itemId } = params

    // Get the list
    const list = await EquipmentList.get(listId)

    if (!list) {
      return NextResponse.json({ error: "Equipment list not found" }, { status: 404 })
    }

    // Remove the item from the list
    const items = (list.items || []).filter((item) => item.id !== itemId)

    // Update the list with the filtered items
    const updatedList = await EquipmentList.update(listId, { items })

    return NextResponse.json({ list: updatedList })
  } catch (error) {
    console.error("Error in delete equipment item route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
