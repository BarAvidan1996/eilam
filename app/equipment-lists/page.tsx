"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const EquipmentListsPage = () => {
  const [lists, setLists] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch("/api/equipment-lists")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setLists(data)
      } catch (error) {
        console.error("Could not fetch the lists:", error)
      }
    }

    fetchLists()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Equipment Lists</h1>
      {lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="bg-white dark:bg-gray-800 shadow rounded-md p-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{list.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{list.description}</p>
              <div className="flex justify-between items-center">
                <Link
                  href={`/equipment?listId=${list.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#005c72] hover:bg-[#004a5e] dark:bg-[#d3e3fd] dark:hover:bg-[#e1ecfd] text-white dark:text-gray-800 rounded-md"
                >
                  View Equipment
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No equipment lists found.</p>
      )}
    </div>
  )
}

export default EquipmentListsPage
