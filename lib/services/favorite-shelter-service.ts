import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface FavoriteShelter {
  id?: number
  user_id?: string
  place_id: string
  name: string
  address: string
  location?: {
    lat: number
    lng: number
  }
  lat?: number
  lng?: number
  label?: string
  custom_label?: string
  created_at?: string
  updated_at?: string
}

class FavoriteShelterService {
  private supabase = createClientComponentClient()

  async list(): Promise<FavoriteShelter[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        console.log("User not authenticated, returning empty favorites list")
        return []
      }

      const { data, error } = await this.supabase
        .from("favorite_shelters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching favorite shelters:", error)
        return []
      }

      // Transform data to match our interface
      return (data || []).map((item) => ({
        ...item,
        location: {
          lat: item.lat,
          lng: item.lng,
        },
      }))
    } catch (error) {
      console.error("Error in list() method:", error)
      return []
    }
  }

  async create(
    shelter: Omit<FavoriteShelter, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<FavoriteShelter> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Extract lat/lng from location object for database storage
    const { location, ...restShelter } = shelter
    const shelterData = {
      ...restShelter,
      user_id: user.id,
      lat: location?.lat,
      lng: location?.lng,
    }

    const { data, error } = await this.supabase.from("favorite_shelters").insert(shelterData).select().single()

    if (error) {
      console.error("Error creating favorite shelter:", error)
      throw error
    }

    // Transform back to our interface format
    return {
      ...data,
      location: {
        lat: data.lat,
        lng: data.lng,
      },
    }
  }

  async update(id: number, shelter: Partial<FavoriteShelter>): Promise<FavoriteShelter> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const { location, ...restShelter } = shelter
      const updateData = {
        ...restShelter,
        ...(location ? { lat: location.lat, lng: location.lng } : {}),
      }

      console.log("Updating shelter with data:", updateData)

      const { data, error } = await this.supabase
        .from("favorite_shelters")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id) // Add user_id check for security
        .select()
        .single()

      if (error) {
        console.error("Error updating favorite shelter:", error)
        throw error
      }

      if (!data) {
        throw new Error("No data returned from update")
      }

      console.log("Updated shelter data:", data)

      return {
        ...data,
        location: {
          lat: data.lat,
          lng: data.lng,
        },
      }
    } catch (error) {
      console.error("Error in update method:", error)
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      console.log("Deleting shelter with id:", id)

      const { error } = await this.supabase.from("favorite_shelters").delete().eq("id", id).eq("user_id", user.id) // Add user_id check for security

      if (error) {
        console.error("Error deleting favorite shelter:", error)
        throw error
      }

      console.log("Successfully deleted shelter")
    } catch (error) {
      console.error("Error in delete method:", error)
      throw error
    }
  }

  async deleteByPlaceId(placeId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        console.log("User not authenticated, cannot delete favorite")
        return
      }

      const { error } = await this.supabase
        .from("favorite_shelters")
        .delete()
        .eq("place_id", placeId)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error deleting favorite shelter by place_id:", error)
      }
    } catch (error) {
      console.error("Error in deleteByPlaceId() method:", error)
    }
  }

  async getByPlaceId(placeId: string): Promise<FavoriteShelter | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return null
      }

      const { data, error } = await this.supabase
        .from("favorite_shelters")
        .select("*")
        .eq("place_id", placeId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null
        }
        console.error("Error getting favorite shelter by place_id:", error)
        return null
      }

      if (!data) return null

      return {
        ...data,
        location: {
          lat: data.lat,
          lng: data.lng,
        },
      }
    } catch (error) {
      console.error("Error in getByPlaceId() method:", error)
      return null
    }
  }
}

export const favoriteShelterService = new FavoriteShelterService()
