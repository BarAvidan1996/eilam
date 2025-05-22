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

      // Get all lists for the user
      const { data, error } = await supabase
        .from("equipment_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // For each list, get the count of items
      if (data && data.length > 0) {
        const listsWithItemCounts = await Promise.all(
          data.map(async (list) => {
            const { count, error: countError } = await supabase
              .from("equipment_items")
              .select("*", { count: "exact", head: true })
              .eq("list_id", list.id)

            if (countError) {
              console.error(`Error getting item count for list ${list.id}:`, countError)
              return { ...list, itemCount: 0 }
            }

            return {
              id: list.id,
              title: list.title,
              description: list.description,
              created_at: list.created_at,
              updated_at: list.updated_at,
              itemCount: count || 0,
            }
          }),
        )

        return listsWithItemCounts
      }

      return data || []
    } catch (error) {
      console.error("Error fetching equipment lists:", error)
      throw error
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
      const { data: items, error: itemsError } = await supabase
        .from("equipment_items")
        .select("*")
        .eq("list_id", id)
        .order("created_at", { ascending: true })

      if (itemsError) throw itemsError

      // Transform the data to match the frontend model
      const transformedItems = (items || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || "other",
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "יחידות",
        obtained: item.obtained || false,
        importance: item.importance || 3,
        description: item.description || "",
        shelf_life: item.shelf_life || "",
        usage_instructions: item.usage_instructions || "",
        recommended_quantity_per_person: item.recommended_quantity_per_person || "",
        expiryDate: item.expiration_date || null,
        sendExpiryReminder: item.wants_expiry_reminder || false,
        sms_notification: item.sms_notification || false,
        personalized_note: item.personalized_note || "",
        is_mandatory: item.is_mandatory || false,
      }))

      return {
        id: list.id,
        name: list.title,
        description: list.description || "",
        items: transformedItems,
        created_at: list.created_at,
        updated_at: list.updated_at,
      }
    } catch (error) {
      console.error(`Error fetching equipment list ${id}:`, error)
      throw error
    }
  },

  async createList(listData) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        throw new Error("User not authenticated")
      }

      // Create the list
      const { data: list, error: listError } = await supabase
        .from("equipment_list")
        .insert({
          user_id: user.id,
          title: listData.name,
          description: listData.description || "",
        })
        .select()
        .single()

      if (listError) throw listError

      // Create the items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: list.id,
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          description: item.description || "",
          importance: item.importance || 3,
          obtained: item.obtained || false,
          expiration_date: item.expiryDate || null,
          wants_expiry_reminder: item.sendExpiryReminder || false,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
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

  async updateList(id, listData) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        throw new Error("User not authenticated")
      }

      // Update the list
      const { error: listError } = await supabase
        .from("equipment_list")
        .update({
          title: listData.name,
          description: listData.description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (listError) throw listError

      // Delete existing items
      const { error: deleteError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (deleteError) throw deleteError

      // Create new items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          list_id: id,
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          description: item.description || "",
          importance: item.importance || 3,
          obtained: item.obtained || false,
          expiration_date: item.expiryDate || null,
          wants_expiry_reminder: item.sendExpiryReminder || false,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
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

  async deleteList(id) {
    try {
      const supabase = createSupabaseClient()
      const user = await this.getCurrentUser()

      if (!user) {
        console.warn("No authenticated user found")
        throw new Error("User not authenticated")
      }

      // Delete the list (items will be deleted automatically due to CASCADE constraint)
      const { error } = await supabase.from("equipment_list").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      return true
    } catch (error) {
      console.error(`Error deleting equipment list ${id}:`, error)
      throw error
    }
  },

  // Aliases for backward compatibility
  createEquipmentList: function (listData) {
    return this.createList(listData)
  },

  updateEquipmentList: function (id, listData) {
    return this.updateList(id, listData)
  },

  deleteEquipmentList: function (id) {
    return this.deleteList(id)
  },

  get: function (id) {
    return this.getEquipmentList(id)
  },

  create: function (listData) {
    return this.createList(listData)
  },

  update: function (id, listData) {
    return this.updateList(id, listData)
  },
}
