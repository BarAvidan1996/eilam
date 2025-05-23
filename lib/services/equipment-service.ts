import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"

// Create a singleton Supabase client for browser
let supabaseInstance = null

const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    return null // אנחנו בצד השרת, לא ניתן להשתמש בקליינט
  }

  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}

export const EquipmentService = {
  async getCurrentUser() {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return null

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Session error:", sessionError.message || sessionError.details || sessionError)
        return null
      }

      if (!session) {
        console.warn("⚠️ No active session found")
        return null
      }

      return session.user
    } catch (error) {
      console.error("❌ Error getting current user:", error.message || error.details || error)
      return null
    }
  },

  async getEquipmentLists() {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return []

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn(
          "⚠️ No active session found for getEquipmentLists:",
          sessionError?.message || sessionError?.details || sessionError,
        )
        return []
      }

      const userId = session.user.id

      // Get all lists for the user
      const { data, error } = await supabase
        .from("equipment_lists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching lists:", error.message || error.details || error)
        throw error
      }

      // For each list, get the count of items
      if (data && data.length > 0) {
        const listsWithItemCounts = await Promise.all(
          data.map(async (list) => {
            const { count, error: countError } = await supabase
              .from("equipment_items")
              .select("*", { count: "exact", head: true })
              .eq("list_id", list.id)

            if (countError) {
              console.error(
                `❌ Error getting item count for list ${list.id}:`,
                countError.message || countError.details || countError,
              )
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
      console.error("❌ Error fetching equipment lists:", error.message || error.details || error)
      throw error
    }
  },

  async getEquipmentList(id) {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return null

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn(
          "⚠️ No active session found for getEquipmentList:",
          sessionError?.message || sessionError?.details || sessionError,
        )
        return null
      }

      const userId = session.user.id

      // Get the list
      const { data: list, error: listError } = await supabase
        .from("equipment_lists")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (listError) {
        console.error("❌ Error fetching list:", listError.message || listError.details || listError)
        throw listError
      }

      // Get the items for this list
      const { data: items, error: itemsError } = await supabase
        .from("equipment_items")
        .select("*")
        .eq("list_id", id)
        .order("created_at", { ascending: true })

      if (itemsError) {
        console.error("❌ Error fetching items:", itemsError.message || itemsError.details || itemsError)
        throw itemsError
      }

      // Transform the data to match the frontend model
      const transformedItems = (items || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category || "other",
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "יחידות",
        obtained: item.obtained || false,
        importance: item.importance_level || 3,
        description: item.description || "",
        shelf_life: item.shelf_life || "",
        usage_instructions: item.usage_instructions || "",
        recommended_quantity_per_person: item.recommended_quantity_per_person || "",
        expiryDate: item.expiration_date || null,
        sendExpiryReminder: item.sms_notification || false,
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
      console.error(`❌ Error fetching equipment list ${id}:`, error.message || error.details || error)
      throw error
    }
  },

  async createList(listData) {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("❌ Supabase client not available")
        throw new Error("Supabase client not available")
      }

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Session error in createList:", sessionError.message || sessionError.details || sessionError)
        throw new Error("Session error: " + (sessionError.message || "Unknown error"))
      }

      if (!session) {
        console.error("❌ No active session found in createList")
        throw new Error("No active session found. Please log in again.")
      }

      const userId = session.user.id
      console.log("ℹ️ Creating list for user:", userId)

      // Generate a UUID for the list
      const listId = uuidv4()

      // Create the list with explicit ID
      const { data: list, error: listError } = await supabase
        .from("equipment_lists")
        .insert({
          id: listId,
          user_id: userId,
          title: listData.name,
          description: listData.description || "",
        })
        .select()
        .single()

      if (listError) {
        console.error("❌ Error creating list:", listError.message || listError.details || listError)
        throw listError
      }

      console.log("✅ List created successfully:", list)

      // Verify the list was created
      const { data: verifyList, error: verifyError } = await supabase
        .from("equipment_lists")
        .select("id")
        .eq("id", listId)
        .single()

      if (verifyError || !verifyList) {
        console.error("❌ List creation verification failed:", verifyError?.message || "List not found after creation")
        throw new Error("List creation verification failed")
      }

      console.log("✅ List creation verified:", verifyList.id)

      // Create the items
      if (listData.items && listData.items.length > 0) {
        // הדפס את המבנה של הפריט הראשון לצורך דיבוג
        console.log("📦 First item structure:", JSON.stringify(listData.items[0], null, 2))

        const itemsToInsert = listData.items.map((item) => ({
          id: uuidv4(), // Generate UUID for each item
          list_id: listId,
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          description: item.description || "",
          importance_level: item.importance || 3,
          obtained: item.obtained || false,
          expiration_date: item.expiryDate || null,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
        }))

        // הדפס את המבנה של הפריט הראשון אחרי המרה
        console.log("📦 First item after transformation:", JSON.stringify(itemsToInsert[0], null, 2))
        console.log("📋 Inserting items for list ID:", listId)

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) {
          console.error("❌ Error creating items:", itemsError.message || itemsError.details || itemsError)
          throw itemsError
        }

        console.log("✅ Items created successfully")
      }

      return list
    } catch (error) {
      console.error("❌ Error creating equipment list:", error.message || error.details || error)
      throw error
    }
  },

  async updateList(id, listData) {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return null

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn(
          "⚠️ No active session found for updateList:",
          sessionError?.message || sessionError?.details || sessionError,
        )
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // First, check if the list exists
      const { data: existingList, error: checkError } = await supabase
        .from("equipment_lists")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (checkError || !existingList) {
        console.error("❌ List does not exist or user doesn't have access:", checkError?.message || "List not found")
        throw new Error(checkError?.message || "List not found")
      }

      console.log("✅ List exists, proceeding with update:", existingList.id)

      // Update the list
      const { error: listError } = await supabase
        .from("equipment_lists")
        .update({
          title: listData.name,
          description: listData.description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (listError) {
        console.error("❌ Error updating list:", listError.message || listError.details || listError)
        throw listError
      }

      // Delete existing items
      const { error: deleteError } = await supabase.from("equipment_items").delete().eq("list_id", id)

      if (deleteError) {
        console.error("❌ Error deleting items:", deleteError.message || deleteError.details || deleteError)
        throw deleteError
      }

      // Create new items
      if (listData.items && listData.items.length > 0) {
        const itemsToInsert = listData.items.map((item) => ({
          id: uuidv4(), // Generate UUID for each item
          list_id: id,
          name: item.name,
          category: item.category || "other",
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "יחידות",
          description: item.description || "",
          importance_level: item.importance || 3,
          obtained: item.obtained || false,
          expiration_date: item.expiryDate || null,
          sms_notification: item.sms_notification || false,
          usage_instructions: item.usage_instructions || "",
          shelf_life: item.shelf_life || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
        }))

        console.log("📦 First item to insert:", JSON.stringify(itemsToInsert[0], null, 2))
        console.log("📋 Inserting items for list ID:", id)

        const { error: itemsError } = await supabase.from("equipment_items").insert(itemsToInsert)

        if (itemsError) {
          console.error("❌ Error creating new items:", itemsError.message || itemsError.details || itemsError)
          throw itemsError
        }
      }

      return { id, ...listData }
    } catch (error) {
      console.error(`❌ Error updating equipment list ${id}:`, error.message || error.details || error)
      throw error
    }
  },

  async deleteList(id) {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return false

      // קבל את הסשן הנוכחי
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn(
          "⚠️ No active session found for deleteList:",
          sessionError?.message || sessionError?.details || sessionError,
        )
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // Delete the list (items will be deleted automatically due to CASCADE constraint)
      const { error } = await supabase.from("equipment_lists").delete().eq("id", id).eq("user_id", userId)

      if (error) {
        console.error("❌ Error deleting list:", error.message || error.details || error)
        throw error
      }

      return true
    } catch (error) {
      console.error(`❌ Error deleting equipment list ${id}:`, error.message || error.details || error)
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
