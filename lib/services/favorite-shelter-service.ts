import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface FavoriteShelter {
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

      console.log("Fetching favorites for user:", user.id)

      const { data, error } = await this.supabase
        .from("favorite_shelters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching favorite shelters:", error)
        return []
      }

      console.log("Fetched favorites data:", data)

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

  async create(shelter: Omit<FavoriteShelter, "user_id" | "created_at">): Promise<FavoriteShelter> {
    try {
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

      console.log("Creating shelter with data:", shelterData)

      const { data, error } = await this.supabase.from("favorite_shelters").insert(shelterData).select().single()

      if (error) {
        console.error("Error creating favorite shelter:", error)
        throw error
      }

      console.log("Created shelter data:", data)

      // Transform back to our interface format
      return {
        ...data,
        location: {
          lat: data.lat,
          lng: data.lng,
        },
      }
    } catch (error) {
      console.error("Error in create method:", error)
      throw error
    }
  }

  async update(placeId: string, shelter: Partial<FavoriteShelter>): Promise<FavoriteShelter> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Remove fields that shouldn't be updated
      const { location, user_id, created_at, place_id, ...updateData } = shelter

      // Add lat/lng if location is provided
      if (location) {
        updateData.lat = location.lat
        updateData.lng = location.lng
      }

      console.log("Updating shelter with place_id:", placeId)
      console.log("Update data:", updateData)

      const { data, error } = await this.supabase
        .from("favorite_shelters")
        .update(updateData)
        .eq("place_id", placeId)
        .eq("user_id", user.id) // Security check
        .select()
        .single()

      if (error) {
        console.error("Error updating favorite shelter:", error)
        throw error
      }

      if (!data) {
        throw new Error("No data returned from update operation")
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

  async delete(placeId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      console.log("Deleting shelter with place_id:", placeId, "for user:", user.id)

      const { error } = await this.supabase
        .from("favorite_shelters")
        .delete()
        .eq("place_id", placeId)
        .eq("user_id", user.id) // Security check

      if (error) {
        console.error("Error deleting favorite shelter:", error)
        throw error
      }

      console.log("Successfully deleted shelter with place_id:", placeId)
    } catch (error) {
      console.error("Error in delete method:", error)
      throw error
    }
  }

  async deleteByPlaceId(placeId: string): Promise<void> {
    return this.delete(placeId)
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
