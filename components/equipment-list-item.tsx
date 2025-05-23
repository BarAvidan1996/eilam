import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Droplets,
  Pill,
  HeartHandshake,
  Lightbulb,
  FileText,
  Baby,
  Cat,
  Activity,
  UsersIcon,
  ListChecks,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react"

// מיפוי קטגוריות לאייקונים
const categoryIcons = {
  water_food: <Droplets className="h-4 w-4" />,
  medical: <Pill className="h-4 w-4" />,
  hygiene: <HeartHandshake className="h-4 w-4" />,
  lighting_energy: <Lightbulb className="h-4 w-4" />,
  communication: <FileText className="h-4 w-4" />,
  documents_money: <FileText className="h-4 w-4" />,
  children: <Baby className="h-4 w-4" />,
  pets: <Cat className="h-4 w-4" />,
  elderly: <UsersIcon className="h-4 w-4" />,
  special_needs: <Activity className="h-4 w-4" />,
  other: <ListChecks className="h-4 w-4" />,
  emergency: <ShieldCheck className="h-4 w-4" />,
  food: <Droplets className="h-4 w-4" />,
  pet: <Cat className="h-4 w-4" />,
}

// מיפוי קטגוריות לסגנונות
const categoryStyles = {
  water_food: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
  },
  medical: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
  hygiene: {
    bg: "bg-green-100",
    text: "text-green-800",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  lighting_energy: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-900/30",
    darkText: "dark:text-yellow-400",
  },
  communication: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400",
  },
  documents_money: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-400",
  },
  children: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    darkBg: "dark:bg-pink-900/30",
    darkText: "dark:text-pink-400",
  },
  pets: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  elderly: {
    bg: "bg-teal-100",
    text: "text-teal-800",
    darkBg: "dark:bg-teal-900/30",
    darkText: "dark:text-teal-400",
  },
  special_needs: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    darkBg: "dark:bg-cyan-900/30",
    darkText: "dark:text-cyan-400",
  },
  other: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-400",
  },
  emergency: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
  food: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
  },
  pet: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
}

// פונקציה לקבלת האייקון והסגנון המתאימים לקטגוריה
const getCategoryInfo = (category) => {
  // אם הקטגוריה היא מחרוזת ריקה או לא מוגדרת, נחזיר קטגוריית ברירת מחדל
  if (!category) {
    return {
      icon: <ListChecks className="h-4 w-4" />,
      style: categoryStyles.other,
    }
  }

  // מיפוי קטגוריות נוספות לקטגוריות קיימות
  const categoryMapping = {
    food: "water_food",
    pet: "pets",
    emergency: "other",
  }

  // אם יש מיפוי לקטגוריה, נשתמש בו
  const mappedCategory = categoryMapping[category] || category

  return {
    icon: categoryIcons[mappedCategory] || categoryIcons.other,
    style: categoryStyles[mappedCategory] || categoryStyles.other,
  }
}

// פונקציה לקבלת תג חשיבות
const getImportanceBadge = (importance, t) => {
  const baseClasses = "text-xs flex-shrink-0 break-words px-2 py-1"

  if (importance >= 5) {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800`}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {t?.aiCategories?.essential || "הכרחי"}
      </Badge>
    )
  } else if (importance >= 4) {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800`}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {t?.aiCategories?.very_important || "חשוב מאוד"}
      </Badge>
    )
  } else if (importance >= 3) {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800`}
      >
        {t?.aiCategories?.important || "חשוב"}
      </Badge>
    )
  } else if (importance >= 2) {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800`}
      >
        {t?.aiCategories?.recommended || "מומלץ"}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700`}
    >
      {t?.aiCategories?.optional || "אופציונלי"}
    </Badge>
  )
}

// קומפוננטה לפריט ברשימת ציוד
export const EquipmentListItem = ({ item, t, isRTL = true, onToggleObtained, isEditing = false, onRemove }) => {
  const categoryInfo = getCategoryInfo(item.category)

  return (
    <div
      className={`flex items-center justify-between w-full gap-2 sm:gap-3 p-3 border-b dark:border-gray-700 ${isRTL ? "text-right" : "text-left"}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
        {onToggleObtained && (
          <Checkbox
            id={`item-${item.id}`}
            checked={item.obtained}
            onCheckedChange={() => onToggleObtained(item.id, !item.obtained)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:text-white dark:data-[state=checked]:bg-green-600"
          />
        )}
        <Badge
          variant="outline"
          className={`text-xs transition-colors px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0 max-w-[120px] sm:max-w-none ${categoryInfo.style.bg} ${categoryInfo.style.text} ${categoryInfo.style.darkBg} ${categoryInfo.style.darkText}`}
        >
          {categoryInfo.icon}
          <span className="truncate">{t?.aiCategories?.[item.category] || item.category}</span>
        </Badge>
      </div>

      <div
        className={`flex flex-col items-start gap-0.5 sm:gap-1 min-w-0 flex-1 ${isRTL ? "order-1 sm:order-2 text-right" : "order-2 sm:order-2 text-left"}`}
      >
        <span
          className={`font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate w-full ${item.obtained ? "line-through text-gray-400 dark:text-gray-500" : ""}`}
        >
          {item.name}
        </span>
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span className="truncate">
            {item.quantity} {item.unit}
          </span>
          {item.shelf_life && (
            <>
              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate">{item.shelf_life}</span>
            </>
          )}
        </div>
      </div>

      <div
        className={`flex flex-col xs:flex-row items-end xs:items-center gap-1 xs:gap-2 shrink-0 ${isRTL ? "order-3 sm:order-3 mr-auto" : "order-3 sm:order-3 ml-auto"}`}
      >
        {getImportanceBadge(item.importance, t)}

        {/* Mandatory item badge */}
        {item.is_mandatory && (
          <Badge
            variant="outline"
            className="text-xs ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            {t?.mandatoryItem || "פריט חובה"}
          </Badge>
        )}

        {/* Personalized item badge */}
        {!item.is_mandatory && item.personalized_note && (
          <Badge
            variant="outline"
            className="text-xs ml-1 bg-[#005c72]/10 text-[#005c72] dark:bg-[#005c72]/20 dark:text-white border-[#005c72]/20 dark:border-[#005c72]/40"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {t?.personalizedItem || "פריט מותאם אישית"}
          </Badge>
        )}
      </div>
    </div>
  )
}
