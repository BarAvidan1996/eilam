import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface ChatMessageProps {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp?: string
}

export function ChatMessage({ text, sender, timestamp }: ChatMessageProps) {
  const isUser = sender === "user"

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          {!isUser && (
            <AvatarImage
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
              alt="Bot Avatar"
            />
          )}
          <AvatarFallback>{isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div
          className={cn(
            "max-w-[70%] p-3 rounded-xl",
            isUser
              ? "bg-purple-600 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-bl-none",
          )}
        >
          <p className="text-sm break-words">{text}</p>
          {timestamp && (
            <div className={cn("mt-1 text-xs opacity-70", isUser ? "text-white/70" : "text-gray-500")}>
              {new Date(timestamp).toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
