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

export const EquipmentService = {
  async getAll() {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("equipment_lists")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching equipment lists:", error)
      return []
    }
  },

  async get(id) {
    try {
      const supabase = createSupabaseClient()

      // Get the list
      const { data: list, error: listError } = await supabase.from("equipment_lists").select("*").eq("id", id).single()

      if (listError) throw listError

      // Get the items for this list
      const { data: items, error: itemsError } = await supabase.from("equipment_items").select("*").eq("list_id", id)

      if (itemsError) throw itemsError

      return { ...list, items: items || [] }
    } catch (error) {
      console.error(`Error fetching equipment list ${id}:`, error)
      return null
    }
  },

  async create(listData) {
    try {
      const supabase = createSupabaseClient()

      // Create the list
      const { data: list, error: listError } = await supabase
        .from("equipment_lists")
        .insert({
          title: listData.name,
          user_id: "705cfb06-546c-49b4-8f60-d970eecc6b9d", // Default user ID
          is_favorite: false,
        })
        .select()
        .single()

      if (listError) throw listError

      // Create the items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: list.id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          obtained: item.obtained || false,
          expiry_date: item.expiryDate,
          send_reminder: item.sendExpiryReminder || false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
        }))

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      return list
    } catch (error) {
      console.error("Error creating equipment list:", error)
      throw error
    }
  },

  async update(id, listData) {
    try {
      const supabase = createSupabaseClient()

      // Update the list
      const { error: listError } = await supabase.from("equipment_lists").update({ title: listData.name }).eq("id", id)

      if (listError) throw listError

      // Delete existing items
      const { error: deleteError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (deleteError) throw deleteError

      // Create new items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          obtained: item.obtained || false,
          expiry_date: item.expiryDate,
          send_reminder: item.sendExpiryReminder || false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
        }))

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      return { id, ...listData }
    } catch (error) {
      console.error(`Error updating equipment list ${id}:`, error)
      throw error
    }
  },

  async delete(id) {
    try {
      const supabase = createSupabaseClient()

      // Delete items first (foreign key constraint)
      const { error: itemsError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (itemsError) throw itemsError

      // Delete the list
      const { error: listError } = await supabase.from("equipment_lists").delete().eq("id", id)

      if (listError) throw listError

      return true
    } catch (error) {
      console.error(`Error deleting equipment list ${id}:`, error)
      throw error
    }
  },
}
