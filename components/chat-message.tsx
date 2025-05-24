import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bot } from "lucide-react"

export interface ChatMessageProps {
  id: string
  text: string
  sender: "user" | "bot"
}

export function ChatMessage({ text, sender }: ChatMessageProps) {
  return (
    <div className={`flex items-start gap-3 mb-4 ${sender === "user" ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {sender === "bot" ? (
          <>
            <AvatarImage
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fcae81_support-agent.png"
              alt="Bot Avatar"
            />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          sender === "user"
            ? "bg-purple-600 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
      </div>
    </div>
  )
}
