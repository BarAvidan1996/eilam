import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfmxtaefgvjbuipcdcya.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.Rl-QQhQxQXTzgJLQYQKRGJDEQQDcnrJCBj0aCxRKAXs"

// Create a singleton Supabase client
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Mock data for equipment lists when not using Supabase
const mockEquipmentLists = [
  {
    id: "1",
    name: "רשימת ציוד לחירום",
    description: "ציוד חיוני למקרה חירום",
    items: [
      {
        id: "item1",
        name: "מים",
        category: "water_food",
        quantity: 9,
        unit: "ליטרים",
        obtained: false,
        importance: 5,
        description: "מים לשתייה ובישול",
        shelf_life: "שנה",
        usage_instructions: "3 ליטרים לאדם ליום",
        recommended_quantity_per_person: "3 ליטרים ליום",
        expiryDate: null,
        sendExpiryReminder: false,
      },
      // ... other items
    ],
  },
]

export const EquipmentService = {
  async getCurrentUser() {
    try {
      const supabase = createSupabaseClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      return user
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  },

  async getEquipmentLists() {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        return []
      }

      const { data, error } = await supabase
        .from("equipment_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get item counts for each list
      const listsWithCounts = await Promise.all(
        (data || []).map(async (list) => {
          const { count, error: countError } = await supabase
            .from("equipment_items")
            .select("*", { count: "exact", head: true })
            .eq("list_id", list.id)

          return {
            ...list,
            itemCount: countError ? 0 : count || 0,
          }
        }),
      )

      return listsWithCounts || []
    } catch (error) {
      console.error("Error fetching equipment lists:", error)
      return mockEquipmentLists // Fallback to mock data
    }
  },

  async getEquipmentList(id) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        return null
      }

      // Get the list
      const { data: list, error: listError } = await supabase
        .from("equipment_list")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (listError) throw listError

      // Get the items for this list
      const { data: items, error: itemsError } = await supabase.from("equipment_items").select("*").eq("list_id", id)

      if (itemsError) throw itemsError

      return { ...list, items: items || [] }
    } catch (error) {
      console.error(`Error fetching equipment list ${id}:`, error)
      return mockEquipmentLists[0] // Fallback to first mock list
    }
  },

  async createEquipmentList(listData) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        return null
      }

      console.log(
        "Creating equipment list with data:",
        JSON.stringify(
          {
            title: listData.name,
            description: listData.description || "",
            user_id: user.id,
            itemCount: listData.items?.length || 0,
          },
          null,
          2,
        ),
      )

      // Create the list
      const { data: list, error: listError } = await supabase
        .from("equipment_list")
        .insert({
          title: listData.name,
          description: listData.description || "",
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (listError) {
        console.error("Error creating equipment list:", listError)
        throw listError
      }

      console.log("Created list:", list)

      // Create the items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: list.id,
          name: item.name,
          quantity: Number(item.quantity) || 1,
          category: item.category,
          description: item.description || "",
          expiration_date: item.expiryDate,
          wants_expiry_reminder: item.sendExpiryReminder || false,
          obtained: item.obtained || false,
          usage_instructions: item.usage_instructions || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        console.log(`Inserting ${itemsToInsert.length} items for list ${list.id}`)

        const { data: insertedItems, error: itemsError } = await supabase
          .from("equipment_items")
          .insert(itemsToInsert)
          .select()

        if (itemsError) {
          console.error("Error creating equipment items:", itemsError)
          throw itemsError
        }

        console.log(`Successfully inserted ${insertedItems?.length || 0} items`)
      }

      return list
    } catch (error) {
      console.error("Error creating equipment list:", error)
      return { id: "mock-id-" + Date.now(), ...listData } // Return mock data with generated ID
    }
  },

  async updateEquipmentList(id, listData) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        return null
      }

      console.log(
        `Updating equipment list ${id} with data:`,
        JSON.stringify(
          {
            title: listData.name,
            description: listData.description || "",
            itemCount: listData.items?.length || 0,
          },
          null,
          2,
        ),
      )

      // Update the list
      const { data: updatedList, error: listError } = await supabase
        .from("equipment_list")
        .update({
          title: listData.name,
          description: listData.description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (listError) {
        console.error(`Error updating equipment list ${id}:`, listError)
        throw listError
      }

      console.log("Updated list:", updatedList)

      // Delete existing items
      const { error: deleteError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (deleteError) {
        console.error(`Error deleting items for list ${id}:`, deleteError)
        throw deleteError
      }

      console.log(`Successfully deleted existing items for list ${id}`)

      // Create new items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: id,
          name: item.name,
          quantity: Number(item.quantity) || 1,
          category: item.category,
          description: item.description || "",
          expiration_date: item.expiryDate,
          wants_expiry_reminder: item.sendExpiryReminder || false,
          obtained: item.obtained || false,
          usage_instructions: item.usage_instructions || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        console.log(`Inserting ${itemsToInsert.length} new items for list ${id}`)

        const { data: insertedItems, error: itemsError } = await supabase
          .from("equipment_items")
          .insert(itemsToInsert)
          .select()

        if (itemsError) {
          console.error(`Error inserting new items for list ${id}:`, itemsError)
          throw itemsError
        }

        console.log(`Successfully inserted ${insertedItems?.length || 0} new items`)
      }

      return { id, ...listData }
    } catch (error) {
      console.error(`Error updating equipment list ${id}:`, error)
      return { id, ...listData } // Return the data that was passed in
    }
  },

  async deleteEquipmentList(id) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        return false
      }

      console.log(`Deleting equipment list ${id}`)

      // Delete items first (foreign key constraint)
      const { error: itemsError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (itemsError) {
        console.error(`Error deleting items for list ${id}:`, itemsError)
        throw itemsError
      }

      console.log(`Successfully deleted items for list ${id}`)

      // Delete the list
      const { error: listError } = await supabase.from("equipment_list").delete().eq("id", id).eq("user_id", user.id)

      if (listError) {
        console.error(`Error deleting list ${id}:`, listError)
        throw listError
      }

      console.log(`Successfully deleted list ${id}`)

      return true
    } catch (error) {
      console.error(`Error deleting equipment list ${id}:`, error)
      return false
    }
  },
}
