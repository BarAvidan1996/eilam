export async function extractProfileData(prompt: string): Promise<any> {
  try {
    const response = await fetch("/api/extract-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // תיקון: אם יש קשישים, לא לספור אותם גם כמבוגרים
    if (data.elderly && data.elderly > 0 && data.adults && data.adults > 0) {
      data.adults = Math.max(0, data.adults - data.elderly)
    }

    return data
  } catch (error) {
    console.error("Error extracting profile data:", error)
    // Return default values if extraction fails
    return {
      adults: 2,
      children: 0,
      babies: 0,
      elderly: 0,
      pets: 0,
      duration_hours: 72,
    }
  }
}
