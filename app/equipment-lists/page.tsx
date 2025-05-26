"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EquipmentList {
  id: string
  name: string
}

const EquipmentListsPage = () => {
  const [equipmentLists, setEquipmentLists] = useState<EquipmentList[]>([])
  const [newListName, setNewListName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchEquipmentLists()
  }, [])

  const fetchEquipmentLists = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/equipment-lists")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setEquipmentLists(data)
    } catch (error) {
      console.error("Could not fetch equipment lists:", error)
      toast.error("Failed to load equipment lists.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("List name cannot be empty.")
      return
    }

    try {
      const response = await fetch("/api/equipment-lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newListName }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setNewListName("")
      fetchEquipmentLists()
      toast.success("List created successfully!")
    } catch (error) {
      console.error("Could not create equipment list:", error)
      toast.error("Failed to create list.")
    }
  }

  const handleDeleteList = async (id: string) => {
    try {
      const response = await fetch(`/api/equipment-lists/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      fetchEquipmentLists()
      toast.success("List deleted successfully!")
    } catch (error) {
      console.error("Could not delete equipment list:", error)
      toast.error("Failed to delete list.")
    }
  }

  const handleViewList = (id: string) => {
    router.push(`/equipment-lists/${id}`)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Equipment Lists</h1>

      {/* Create New List Section */}
      <div className="mb-6 flex items-center gap-4">
        <Input
          type="text"
          placeholder="Enter new list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <Button onClick={handleCreateList}>Create List</Button>
      </div>

      {/* Equipment Lists Table */}
      {isLoading ? (
        <p>Loading equipment lists...</p>
      ) : (
        <Table>
          <TableCaption>A list of your equipment.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipmentLists.map((list) => (
              <TableRow key={list.id}>
                <TableCell className="font-medium">{list.name}</TableCell>
                <TableCell>
                  <Button variant="secondary" size="sm" onClick={() => handleViewList(list.id)}>
                    View
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the list and remove all its data.
                          Please confirm your intention.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteList(list.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default EquipmentListsPage
