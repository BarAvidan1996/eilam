"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useTranslation } from "@/hooks/use-translation"
import { T } from "@/components/translation-wrapper"
import { Loader2 } from "lucide-react"
import { MapPin, MessageSquare, Users, Shield } from "lucide-react"

export default function DashboardPage() {
  const { ts, isTranslating } = useTranslation()
  const router = useRouter()
  const [session, setSession] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const features = [
    {
      icon: Shield,
      title: "Equipment Management",
      description: "Manage your emergency equipment lists efficiently",
      href: "/equipment-lists",
    },
    {
      icon: MapPin,
      title: "Shelter Finder",
      description: "Find nearby shelters and safe locations",
      href: "/shelters",
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Get help and guidance from our AI assistant",
      href: "/chat",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with your community for emergency preparedness",
      href: "/profile",
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        {isTranslating && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
        <T>Dashboard</T>
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        <T>Welcome to your emergency preparedness dashboard</T>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {features.map((feature) => (
          <Card key={feature.title} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <feature.icon className="h-5 w-5 text-blue-500" />
                <T>{feature.title}</T>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                <T>{feature.description}</T>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push(feature.href)} className="w-full">
                <T>Go to {feature.title}</T>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
          Logout
        </Button>
      </div>
    </div>
  )
}
