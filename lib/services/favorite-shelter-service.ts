import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface FavoriteShelter {
  id?: number
  user_id?: string
  place_id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
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

      return data || []
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

    const { data, error } = await this.supabase
      .from("favorite_shelters")
      .insert({
        ...shelter,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating favorite shelter:", error)
      throw error
    }

    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from("favorite_shelters").delete().eq("id", id)

    if (error) {
      console.error("Error deleting favorite shelter:", error)
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

  async filter(filters: Partial<FavoriteShelter>): Promise<FavoriteShelter[]> {
    let query = this.supabase.from("favorite_shelters").select("*")

    if (filters.place_id) {
      query = query.eq("place_id", filters.place_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error filtering favorite shelters:", error)
      throw error
    }

    return data || []
  }
}

export const favoriteShelterService = new FavoriteShelterService()
