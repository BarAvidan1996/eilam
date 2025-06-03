"use client"

import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function ChatPage() {
  const { ts, isTranslating } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-100 py-4 px-6">
        <h1 className="text-2xl font-semibold">Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Chat messages will go here */}
        <div>Message 1</div>
        <div>Message 2</div>
      </div>

      <div className="bg-gray-100 py-4 px-6 border-t">
        <div className="flex items-center">
          <input
            type="text"
            placeholder={ts("Type your message")}
            className="flex-1 border rounded-l-md py-2 px-3 focus:outline-none"
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => {
                setIsLoading(false)
              }, 2000)
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <T>Send Message</T>}
          </button>
        </div>
      </div>
    </div>
  )
}
