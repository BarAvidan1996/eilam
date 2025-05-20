"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export class FavoriteShelterService {
  private supabase = createClientComponentClient()

  async list() {
    const { data, error } = await this.supabase
      .from("favorite_shelters")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching favorite shelters:", error)
      throw error
    }

    return data || []
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.from("favorite_shelters").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching favorite shelter:", error)
      throw error
    }

    return data
  }

  async getByPlaceId(placeId: string) {
    const { data, error } = await this.supabase.from("favorite_shelters").select("*").eq("place_id", placeId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching favorite shelter by place_id:", error)
      throw error
    }

    return data
  }

  async create(shelterData: any) {
    const { data, error } = await this.supabase
      .from("favorite_shelters")
      .insert({
        place_id: shelterData.place_id,
        name: shelterData.name,
        address: shelterData.address,
        lat: shelterData.location?.lat,
        lng: shelterData.location?.lng,
        label: shelterData.label || "אחר",
        custom_label: shelterData.custom_label,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating favorite shelter:", error)
      throw error
    }

    return data
  }

  async update(id: string, shelterData: any) {
    const { data, error } = await this.supabase
      .from("favorite_shelters")
      .update({
        name: shelterData.name,
        address: shelterData.address,
        lat: shelterData.location?.lat,
        lng: shelterData.location?.lng,
        label: shelterData.label,
        custom_label: shelterData.custom_label,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating favorite shelter:", error)
      throw error
    }

    return data
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("favorite_shelters").delete().eq("id", id)

    if (error) {
      console.error("Error deleting favorite shelter:", error)
      throw error
    }

    return true
  }

  async deleteByPlaceId(placeId: string) {
    const { error } = await this.supabase.from("favorite_shelters").delete().eq("place_id", placeId)

    if (error) {
      console.error("Error deleting favorite shelter by place_id:", error)
      throw error
    }

    return true
  }
}

// יצירת מופע יחיד של השירות
export const favoriteShelterService = new FavoriteShelterService()
