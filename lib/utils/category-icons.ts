import {
  Droplets,
  Pill,
  HeartHandshake,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  UsersIcon,
  ListChecks,
  ShieldCheck,
  Utensils,
  Shirt,
  Wrench,
  Smartphone,
  BookOpen,
  Pencil,
  Bed,
  Tent,
  Flame,
  Stethoscope,
  Scissors,
  Zap,
  Wifi,
  Wallet,
  Briefcase,
  Backpack,
  Glasses,
  Thermometer,
  Umbrella,
  Map,
  Compass,
  Radio,
  Battery,
  Sun,
  Moon,
  Flashlight,
  FileText,
} from "lucide-react"

// מיפוי קטגוריות לאייקונים - הרחבה משמעותית
export const categoryIcons = {
  // קטגוריות בסיסיות
  water_food: Droplets,
  medical: Pill,
  hygiene: HeartHandshake,
  lighting_energy: Lightbulb,
  communication: Smartphone,
  documents_money: Wallet,
  children: Baby,
  pets: Cat,
  elderly: UsersIcon,
  special_needs: Activity,
  other: ListChecks,
  emergency: ShieldCheck,

  // מיפויים נוספים לקטגוריות שזוהו בתמונות
  food: Utensils,
  pet: Cat,
  equipment: Wrench,
  clothing: Shirt,
  education: BookOpen,
  writing: Pencil,
  sleeping: Bed,
  shelter: Tent,
  cooking: Flame,
  health: Stethoscope,
  tools: Scissors,
  power: Zap,
  internet: Wifi,
  finance: Briefcase,
  travel: Backpack,
  vision: Glasses,
  temperature: Thermometer,
  weather: Umbrella,
  navigation: Compass,
  maps: Map,
  radio: Radio,
  battery: Battery,
  daylight: Sun,
  night: Moon,
  light: Flashlight,

  // מיפויים בעברית
  "מים וזון": Droplets,
  "ציוד רפואי": Pill,
  תקשורת: Smartphone,
  ילדים: Baby,
  "חיות מחמד": Cat,
  "ציוד כללי": Wrench,
  ציוד: Wrench,
  מזון: Utensils,

  // ברירת מחדל
  default: FileText,
}

// פונקציה לקבלת אייקון לפי קטגוריה
export function getCategoryIcon(category) {
  // אם הקטגוריה היא מחרוזת ריקה או לא מוגדרת, נחזיר אייקון ברירת מחדל
  if (!category) {
    return categoryIcons.default
  }

  // מיפוי קטגוריות נוספות לקטגוריות קיימות
  const categoryMapping = {
    food: "food",
    pet: "pet",
    equipment: "equipment",
    // הוספת מיפויים נוספים שזוהו בתמונות
    "מים וזון": "water_food",
    "ציוד רפואי": "medical",
    תקשורת: "communication",
    ילדים: "children",
    "חיות מחמד": "pets",
    "ציוד כללי": "equipment",
    ציוד: "equipment",
  }

  // אם יש מיפוי לקטגוריה, נשתמש בו
  const mappedCategory = categoryMapping[category] || category

  // בדיקה אם יש אייקון מתאים, אחרת נשתמש באייקון ברירת מחדל
  return categoryIcons[mappedCategory] || categoryIcons.default
}
