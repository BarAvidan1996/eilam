"use client"

import { Button } from "@/components/ui/button"
import { History, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function ChatHistory() {
  const [chatSessions, setChatSessions] = useState([])

  useEffect(() => {
    // Load chat sessions from local storage on component mount
    const storedSessions = localStorage.getItem("chatSessions")
    if (storedSessions) {
      setChatSessions(JSON.parse(storedSessions))
    }
  }, [])

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History className="h-8 w-8" />
            היסטוריית שיחות צ'אט
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            נהל את השיחות שלך עם עיל"ם ({chatSessions.length} שיחות)
          </p>
        </div>

        <div className="flex-shrink-0">
          <Link href="/chat">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:text-black">
              <Plus className="h-4 w-4 mr-2" />
              שיחה חדשה
            </Button>
          </Link>
        </div>
      </div>

      {/* Chat Sessions List */}
      {chatSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatSessions.map((session) => (
            <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {session.title || "שיחה ללא שם"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{session.messages.length} הודעות</p>
              <Link href={`/chat?sessionId=${session.id}`}>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white dark:text-black">המשך שיחה</Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">אין היסטוריית שיחות. התחל שיחה חדשה!</div>
      )}
    </div>
  )
}
