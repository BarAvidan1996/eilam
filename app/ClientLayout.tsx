"use client"

import type React from "react"

import { useLanguage } from "@/hooks/use-language"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import type { T } from "@/components/translation-wrapper"

interface NavItem {
  name: T
  href: string
}

interface NewActionItem {
  name: T
  href: string
}

interface Props {
  children: React.ReactNode
}

const navItems: NavItem[] = [
  { name: { key: "nav.home", ns: "common" }, href: "/" },
  { name: { key: "nav.about", ns: "common" }, href: "/about" },
  { name: { key: "nav.contact", ns: "common" }, href: "/contact" },
]

const newActionItems: NewActionItem[] = [
  { name: { key: "nav.new_post", ns: "common" }, href: "/post/new" },
  { name: { key: "nav.new_project", ns: "common" }, href: "/project/new" },
]

export default function AppLayout({ children }: Props) {
  const { language, setLanguage, isRTL } = useLanguage()
  const { ts, isTranslating } = useTranslation()
  const { theme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border flex items-center justify-between p-4">
        <div className="flex items-center">
          <div className={cn("text-xl font-bold", theme === "dark" ? "text-white" : "text-purple-600")}>
            {ts(t.appName)}
            {isTranslating && <span className="ml-2 animate-spin">⟳</span>}
            <p className={cn("text-xs font-normal", theme === "dark" ? "text-gray-300" : "text-purple-500")}>
              {ts(t.appDescription)}
            </p>
          </div>
          <nav className="ml-8 flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium hover:underline">
                {ts(item.name)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-32 justify-between">
                {ts(t.newAction)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {newActionItems.map((item) => (
                <DropdownMenuItem key={item.href} onSelect={() => router.push(item.href)}>
                  {ts(item.name)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{ts(t.profile)}</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{ts(t.logout)}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{ts(t.language)}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(t.languages).map((langKey) => (
                <DropdownMenuItem key={langKey} onClick={() => setLanguage(langKey)}>
                  {ts(t.languages[langKey])}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}

const t = {
  appName: {
    key: "app_name",
    ns: "common",
  },
  appDescription: {
    key: "app_description",
    ns: "common",
  },
  newAction: {
    key: "new_action",
    ns: "common",
  },
  profile: {
    key: "profile",
    ns: "common",
  },
  logout: {
    key: "logout",
    ns: "common",
  },
  language: {
    key: "language",
    ns: "common",
  },
  languages: {
    en: {
      key: "english",
      ns: "languages",
    },
    he: {
      key: "hebrew",
      ns: "languages",
    },
    ru: {
      key: "russian",
      ns: "languages",
    },
  },
}
