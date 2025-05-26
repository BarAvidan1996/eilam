"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { marked } from "marked"
import DOMPurify from "dompurify"

interface Message {
  id: string
  createdAt: string
  content: string
  role: string
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chatId")

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!chatId) {
        return
      }

      try {
        const response = await fetch(`/api/chat/history?chatId=${chatId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: Message[] = await response.json()

        const mappedMessages = data.map((message) => ({
          ...message,
          content: DOMPurify.sanitize(marked(message.content)),
        }))

        setMessages(mappedMessages)
      } catch (error) {
        console.error("Failed to load chat history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    loadChatHistory()
  }, [chatId])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return

    const newMessage = {
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      content: input,
      role: "user",
    }

    setMessages((prevMessages) => [...prevMessages, newMessage])
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, message: input }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const botMessage = {
        id: `bot-${Date.now()}`,
        createdAt: new Date().toISOString(),
        content: DOMPurify.sanitize(marked(data.response)),
        role: "assistant",
      }

      setMessages((prevMessages) => [...prevMessages, botMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      // Revert the message on error
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== newMessage.id))
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === "user" ? "bg-blue-200" : "bg-gray-200"}`}>
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4">
        <div className="flex">
          <input
            type="text"
            className="flex-grow border rounded py-2 px-3 mr-2"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage()
              }
            }}
          />
          <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
