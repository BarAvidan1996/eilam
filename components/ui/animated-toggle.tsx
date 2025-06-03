"use client"

import { cn } from "@/lib/utils"
import { Sun, Moon } from "lucide-react"

interface AnimatedToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  size?: "sm" | "md"
}

export function AnimatedToggle({ checked, onChange, className, size = "md" }: AnimatedToggleProps) {
  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-8 w-14",
  }

  const circleClasses = {
    sm: "h-3 w-3",
    md: "h-6 w-6",
  }

  const translateClasses = {
    sm: checked ? "translate-x-5" : "translate-x-1",
    md: checked ? "translate-x-7" : "translate-x-1",
  }

  const iconClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
  }

  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        sizeClasses[size],
        checked ? "bg-gray-800 dark:bg-gray-700" : "bg-blue-400 dark:bg-blue-500",
        className,
      )}
      role="switch"
      aria-checked={checked}
    >
      {/* Background gradient for day/night effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300",
          checked ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-gradient-to-r from-blue-400 to-blue-500",
        )}
      >
        {/* Stars for night mode */}
        {checked && size === "md" && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
            <div className="absolute top-2 right-3 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
            <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
          </div>
        )}
        {checked && size === "sm" && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-0.5 left-1 w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
            <div className="absolute top-1 right-1.5 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
          </div>
        )}
      </div>

      {/* Toggle circle with icon */}
      <div
        className={cn(
          "relative inline-block transform rounded-full bg-white transition-transform duration-300 ease-in-out shadow-lg",
          circleClasses[size],
          translateClasses[size],
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {checked ? (
            <Moon className={cn(iconClasses[size], "text-gray-700 transition-opacity duration-200")} />
          ) : (
            <Sun className={cn(iconClasses[size], "text-yellow-500 transition-opacity duration-200")} />
          )}
        </div>
      </div>
    </button>
  )
}
