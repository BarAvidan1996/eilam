// app/equipment-lists/page.tsx

// נוסיף את האייקונים הנדרשים בראש הקובץ
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
} from "lucide-react"

// Get category icon
const getCategoryIcon = (category: string) => {
  const icons = {
    water_food: <Droplets className="h-5 w-5 text-blue-500" />,
    medical: <Pill className="h-5 w-5 text-red-500" />,
    hygiene: <HeartHandshake className="h-5 w-5 text-green-500" />,
    lighting_energy: <Lightbulb className="h-5 w-5 text-yellow-500" />,
    communication: <FileText className="h-5 w-5 text-purple-500" />,
    documents_money: <FileText className="h-5 w-5 text-purple-500" />,
    children: <Baby className="h-5 w-5 text-pink-500" />,
    pets: <Cat className="h-5 w-5 text-orange-500" />,
    elderly: <UsersIcon className="h-5 w-5 text-gray-500" />,
    special_needs: <Activity className="h-5 w-5 text-indigo-500" />,
    emergency: <ShieldCheck className="h-5 w-5 text-red-600" />,
    food: <Droplets className="h-5 w-5 text-blue-500" />,
    pet: <Cat className="h-5 w-5 text-orange-500" />,
    other: <ListChecks className="h-5 w-5 text-gray-400" />,
  }

  return icons[category] || <ListChecks className="h-5 w-5 text-gray-400" />
}

// נוסיף פונקציה שתחזיר את האייקון המתאים לקטגוריה
// const getCategoryIcon = (category) => {
//   const icons = {
//     water_food: <Droplets className="h-5 w-5" />,
//     medical: <Pill className="h-5 w-5" />,
//     hygiene: <HeartHandshake className="h-5 w-5" />,
//     lighting_energy: <Lightbulb className="h-5 w-5" />,
//     communication: <FileText className="h-5 w-5" />,
//     documents_money: <FileText className="h-5 w-5" />,
//     children: <Baby className="h-5 w-5" />,
//     pets: <Cat className="h-5 w-5" />,
//     elderly: <UsersIcon className="h-5 w-5" />,
//     special_needs: <Activity className="h-5 w-5" />,
//     other: <ListChecks className="h-5 w-5" />,
//     emergency: <ShieldCheck className="h-5 w-5" />,
//     food: <Droplets className="h-5 w-5" />,
//     pet: <Cat className="h-5 w-5" />,
//   }

//   return icons[category] || <ListChecks className="h-5 w-5" />
// }

// עכשיו נמצא את המקום בקוד שבו מוצגים הפריטים ברשימה ונוסיף את האייקון
// חפש את המקום שבו מוצג כל פריט ברשימה (בדרך כלל בתוך map על הפריטים)
// ונוסיף את האייקון לצד שם הפריט או הקטגוריה

// לדוגמה, אם יש קוד כזה:
// <div className="flex items-center">
//   <span>{item.name}</span>
// </div>

// נשנה אותו ל:
// <div className="flex items-center">
//   <div className="mr-2">{getCategoryIcon(item.category)}</div>
//   <span>{item.name}</span>
// </div>

// אם יש קוד שמציג את האייקון של הקטגוריה, נוודא שהוא משתמש בפונקציה החדשה:
// למשל, אם יש קוד כזה:
// <div className="category-icon">{/* כאן אמור להיות האייקון */}</div>

// נשנה אותו ל:
// <div className="category-icon">{getCategoryIcon(item.category)}</div>

export default function EquipmentListsPage() {
  // הקוד הקיים של הקומפוננטה נשאר כמו שהוא
}
