import { NextResponse } from "next/server"
import { EquipmentList } from "@/entities/EquipmentList"

export async function POST(request: Request, { params }: { params: { listId: string } }) {
  try {
    const listId = params.listId
    const itemData = await request.json()

    // Get the list
    const list = await EquipmentList.get(listId)

    if (!list) {
      return NextResponse.json({ error: "Equipment list not found" }, { status: 404 })
    }

    // Add the item to the list
    const items = [...(list.items || []), { ...itemData, id: crypto.randomUUID() }]

    // Update the list with the new items
    const updatedList = await EquipmentList.update(listId, { items })

    return NextResponse.json({ list: updatedList })
  } catch (error) {
    console.error("Error in add equipment item route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
