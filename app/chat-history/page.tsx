import { auth } from "@/auth"
import { ChatHistory } from "@/components/chat-history"
import { redirect } from "next/navigation"

export default async function ChatHistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container relative">
      <h1 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Chat History
      </h1>
      <ChatHistory userId={session.user.id} />
    </div>
  )
}
