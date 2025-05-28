"use client"

import React from "react"

// פונקציה לניקוי כותרת המקור
const getCleanSourceTitle = (source: { title: string; file_name: string; storage_path?: string }) => {
  // אם יש כותרת נקייה ולא מתחילה ב-web_result_, השתמש בה
  if (source.title && !source.title.startsWith("web_result_") && source.title.trim() !== "") {
    return source.title
  }

  // אם זה מקור web, נסה לחלץ דומיין נקי
  if (source.storage_path && source.storage_path.startsWith("http")) {
    try {
      const url = new URL(source.storage_path)
      return `מקור: ${url.hostname}`
    } catch (e) {
      return "מקור אינטרנטי"
    }
  }

  // fallback
  return source.file_name || "מקור לא ידוע"
}

const ChatPage = () => {
  const [messages, setMessages] = React.useState<any[]>([])
  const [input, setInput] = React.useState("")
  const [sources, setSources] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { text: input, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const botMessage = { text: data.response, sender: "bot" }
      setMessages((prev) => [...prev, botMessage])
      setSources(data.sources)
    } catch (error) {
      console.error("Error sending message:", error)
      const errorBotMessage = { text: "An error occurred. Please try again.", sender: "bot" }
      setMessages((prev) => [...prev, errorBotMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const openSource = (source: { file_name: string; storage_path?: string }) => {
    if (source.storage_path) {
      window.open(source.storage_path, "_blank")
    } else {
      alert(`Source file: ${source.file_name}`)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-100 dark:bg-gray-800 p-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Chat with your data</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-3 rounded-lg ${
              message.sender === "user" ? "bg-blue-100 dark:bg-blue-900 text-right" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {message.text}
          </div>
        ))}
        {isLoading && <div className="mb-2 p-3 bg-gray-200 dark:bg-gray-700">Loading...</div>}
      </main>

      {sources.length > 0 && (
        <aside className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">מקורות:</h2>
          <ul>
            {sources.map((source, index) => (
              <li key={index} className="mb-1">
                <button
                  onClick={() => openSource(source)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-left"
                >
                  {getCleanSourceTitle(source)}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <footer className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage()
              }
            }}
          />
          <button
            className="ml-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={sendMessage}
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  )
}

export default ChatPage
