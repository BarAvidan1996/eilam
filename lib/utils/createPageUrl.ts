/**
 * Creates a URL for a page in the application
 * This is a utility function to replace the React Router createPageUrl function
 *
 * @param pageName The name of the page to create a URL for
 * @param params Optional query parameters
 * @returns The URL for the page
 */
export function createPageUrl(pageName: string, params?: Record<string, string>): string {
  // Map page names to their corresponding paths
  const pageMap: Record<string, string> = {
    HomePage: "/",
    ChatPage: "/chat",
    SheltersPage: "/shelters",
    EquipmentPage: "/equipment",
    ChatHistoryPage: "/chat-history",
    FavoriteSheltersPage: "/favorite-shelters",
    AllEquipmentListsPage: "/equipment-lists",
    FAQPage: "/faq",
    UserProfilePage: "/profile",
    UserLoginPage: "/login",
    UserRegisterPage: "/register",
    AgentPage: "/agent",
  }

  // Get the path for the page
  const path = pageMap[pageName] || "/"

  // If there are params, add them as query parameters
  if (params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value)
    })
    return `${path}?${queryParams.toString()}`
  }

  return path
}
