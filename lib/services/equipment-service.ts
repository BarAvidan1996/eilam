import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"

// Create a singleton Supabase client for browser
let supabaseInstance = null
const createSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance
  supabaseInstance = createBrowserSupabaseClient()
  return supabaseInstance
}

async function getCurrentUser() {
  try {
    const supabase = createSupabaseClient()

    // קבל את הסשן הנוכחי
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError.message)
      return null
    }

    if (!session) {
      console.warn("No active session found")
      return null
    }

    // אם יש סשן, קבל את המשתמש
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("User error:", userError.message)
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export const EquipmentService = {
  async getCurrentUser() {
    return getCurrentUser()
  },

  async getEquipmentLists() {
    try {
      const supabase = createSupabaseClient()

      // קבל את הסשן תחילה
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("No active session found for getEquipmentLists")
        return []
      }

      const userId = session.user.id

      // Get all lists for the user
      const { data, error } = await supabase
        .from("equipment_list")
        .select("*")
        .eq("user_id", userId)
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

      // קבל את הסשן תחילה
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("No active session found for getEquipmentList")
        return null
      }

      const userId = session.user.id

      // Get the list
      const { data: list, error: listError } = await supabase
        .from("equipment_list")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
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

      // קבל את הסשן תחילה
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error in createList:", sessionError.message)
        throw new Error("Session error: " + sessionError.message)
      }

      if (!session) {
        console.error("No active session found in createList")
        throw new Error("No active session found. Please log in again.")
      }

      const userId = session.user.id
      console.log("Creating list for user:", userId)

      // Create the list
      const { data: list, error: listError } = await supabase
        .from("equipment_list")
        .insert({
          user_id: userId,
          title: listData.name,
          description: listData.description || "",
        })
        .select()
        .single()

      if (listError) {
        console.error("Error creating list:", listError)
        throw listError
      }

      console.log("List created successfully:", list)

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

        if (itemsError) {
          console.error("Error creating items:", itemsError)
          throw itemsError
        }

        console.log("Items created successfully")
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

      // קבל את הסשן תחילה
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("No active session found for updateList")
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // Update the list
      const { error: listError } = await supabase
        .from("equipment_list")
        .update({
          title: listData.name,
          description: listData.description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

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

      // קבל את הסשן תחילה
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn("No active session found for deleteList")
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // Delete the list (items will be deleted automatically due to CASCADE constraint)
      const { error } = await supabase.from("equipment_list").delete().eq("id", id).eq("user_id", userId)

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
