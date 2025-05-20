export function Spinner({ size = "default", className = "" }) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    default: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full animate-spin border-b-transparent border-red-600 ${className}`}
    />
  )
}
