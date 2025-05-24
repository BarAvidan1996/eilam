import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface ChatMessageProps {
  id: string
  text: string
  sender: "user" | "bot"
}

export function ChatMessage({ text, sender }: ChatMessageProps) {
  const isUser = sender === "user"

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
              alt="Bot Avatar"
            />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm max-w-[70%]",
            isUser
              ? "bg-purple-600 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-bl-none",
          )}
        >
          <div className="whitespace-pre-wrap break-words">{text}</div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}
