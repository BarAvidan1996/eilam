"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"

// FAQ data
const faqData = {
  he: [
    {
      category: "כללי",
      questions: [
        {
          question: "מהו עיל״ם?",
          answer:
            "עיל״ם (עוזר ייעודי למצבי חירום) הוא אפליקציה שנועדה לסייע לאזרחים במצבי חירום. האפליקציה מספקת מידע, הנחיות והכוונה בזמן אמת.",
        },
        {
          question: "האם השימוש באפליקציה הוא בחינם?",
          answer: "כן, השימוש באפליקציה הוא ללא עלות.",
        },
        {
          question: "האם האפליקציה זמינה גם ללא חיבור לאינטרנט?",
          answer:
            "חלק מהפונקציות באפליקציה דורשות חיבור לאינטרנט, אך המידע הבסיסי והנחיות החירום זמינים גם במצב לא מקוון.",
        },
      ],
    },
    {
      category: "מקלטים",
      questions: [
        {
          question: "איך אני מוצא את המקלט הקרוב אליי?",
          answer:
            "באפליקציה יש פונקציה של 'חיפוש מקלט' שמשתמשת במיקום שלך כדי להציג את המקלטים הקרובים ביותר. ניתן גם לחפש לפי כתובת.",
        },
        {
          question: "האם המידע על המקלטים מעודכן?",
          answer: "כן, המידע על המקלטים מתעדכן באופן שוטף בשיתוף עם פיקוד העורף והרשויות המקומיות.",
        },
        {
          question: "מה עושים אם אין מקלט בקרבת מקום?",
          answer:
            "אם אין מקלט בקרבת מקום, יש להיכנס למרחב הכי מוגן שיש. באפליקציה יש הנחיות מפורטות לבחירת מרחב מוגן בבית או בסביבה.",
        },
      ],
    },
    {
      category: "ציוד חירום",
      questions: [
        {
          question: "איזה ציוד חירום מומלץ להחזיק בבית?",
          answer:
            "מומלץ להחזיק מים, מזון לא מתכלה, תרופות, פנס, רדיו, סוללות, ערכת עזרה ראשונה ומסמכים חשובים. באפליקציה יש רשימות מפורטות לפי גודל המשפחה וצרכים מיוחדים.",
        },
        {
          question: "איך אני יוצר רשימת ציוד מותאמת אישית?",
          answer:
            "באפליקציה יש אפשרות ליצור רשימת ציוד מותאמת אישית לפי מספר האנשים, גילאים, צרכים מיוחדים וסוג מצב החירום.",
        },
        {
          question: "האם האפליקציה מתריעה על פריטים שפג תוקפם?",
          answer:
            "כן, ניתן להגדיר תאריכי תפוגה לפריטים כמו מזון, מים ותרופות, והאפליקציה תשלח התראות לפני שהם פגי תוקף.",
        },
      ],
    },
    {
      category: "התראות",
      questions: [
        {
          question: "איך מקבלים התראות על מצבי חירום?",
          answer:
            "האפליקציה מתממשקת עם מערכת ההתראות של פיקוד העורף ושולחת התראות בזמן אמת. יש לוודא שהרשאות ההתראות מופעלות בהגדרות המכשיר.",
        },
        {
          question: "האם ניתן להתאים אישית את סוגי ההתראות?",
          answer: "כן, ניתן לבחור אילו סוגי התראות לקבל (למשל, רק באזור מסוים) ואת אופן קבלת ההתראות.",
        },
      ],
    },
    {
      category: "תמיכה",
      questions: [
        {
          question: "למי פונים בבעיה טכנית באפליקציה?",
          answer:
            "ניתן לפנות לתמיכה הטכנית דרך האפליקציה בלחיצה על 'תמיכה' בתפריט ההגדרות, או לשלוח מייל ל-support@eilam.app.",
        },
        {
          question: "האם יש מוקד טלפוני לשאלות?",
          answer: "כן, מוקד התמיכה זמין בטלפון 1-800-100-200 בימים א'-ה' בין השעות 8:00-20:00.",
        },
      ],
    },
  ],
  en: [
    {
      category: "General",
      questions: [
        {
          question: "What is EILAM?",
          answer:
            "EILAM (Emergency Information and Location Assistant Module) is an application designed to assist citizens during emergency situations. The app provides information, guidelines, and real-time directions.",
        },
        {
          question: "Is the app free to use?",
          answer: "Yes, the app is free to use.",
        },
        {
          question: "Is the app available offline?",
          answer:
            "Some features require an internet connection, but basic information and emergency guidelines are available offline.",
        },
      ],
    },
    {
      category: "Shelters",
      questions: [
        {
          question: "How do I find the nearest shelter?",
          answer:
            "The app has a 'Find Shelter' function that uses your location to show the nearest shelters. You can also search by address.",
        },
        {
          question: "Is the shelter information up-to-date?",
          answer:
            "Yes, shelter information is regularly updated in collaboration with the Home Front Command and local authorities.",
        },
        {
          question: "What to do if there's no shelter nearby?",
          answer:
            "If there's no shelter nearby, you should enter the most protected space available. The app provides detailed instructions for choosing a protected space at home or in your surroundings.",
        },
      ],
    },
    {
      category: "Emergency Equipment",
      questions: [
        {
          question: "What emergency equipment is recommended to keep at home?",
          answer:
            "It's recommended to keep water, non-perishable food, medications, flashlight, radio, batteries, first aid kit, and important documents. The app provides detailed lists based on family size and special needs.",
        },
        {
          question: "How do I create a personalized equipment list?",
          answer:
            "The app allows you to create a personalized equipment list based on the number of people, ages, special needs, and type of emergency situation.",
        },
        {
          question: "Does the app alert about expired items?",
          answer:
            "Yes, you can set expiration dates for items like food, water, and medications, and the app will send alerts before they expire.",
        },
      ],
    },
    {
      category: "Alerts",
      questions: [
        {
          question: "How do I receive emergency alerts?",
          answer:
            "The app interfaces with the Home Front Command alert system and sends real-time alerts. Make sure notification permissions are enabled in your device settings.",
        },
        {
          question: "Can I customize the types of alerts?",
          answer:
            "Yes, you can choose which types of alerts to receive (for example, only in a specific area) and how to receive the alerts.",
        },
      ],
    },
    {
      category: "Support",
      questions: [
        {
          question: "Who do I contact for technical issues with the app?",
          answer:
            "You can contact technical support through the app by clicking on 'Support' in the settings menu, or by sending an email to support@eilam.app.",
        },
        {
          question: "Is there a phone support center for questions?",
          answer: "Yes, the support center is available at 1-800-100-200 from Sunday to Thursday, 8:00 AM to 8:00 PM.",
        },
      ],
    },
  ],
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFAQ, setFilteredFAQ] = useState([])
  const { language } = useLanguage()
  const [currentLanguage, setCurrentLanguage] = useState("he")

  // Update language when it changes in context
  useEffect(() => {
    setCurrentLanguage(language)
    setFilteredFAQ(faqData[language] || faqData.he)
  }, [language])

  // Filter FAQ based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFAQ(faqData[currentLanguage] || faqData.he)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = (faqData[currentLanguage] || faqData.he)
      .map((category) => {
        const filteredQuestions = category.questions.filter(
          (q) => q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query),
        )
        if (filteredQuestions.length === 0) return null
        return {
          ...category,
          questions: filteredQuestions,
        }
      })
      .filter(Boolean)

    setFilteredFAQ(filtered)
  }, [searchQuery, currentLanguage])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <HelpCircle className="text-purple-600" />
          {currentLanguage === "he" ? "שאלות נפוצות" : "Frequently Asked Questions"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {currentLanguage === "he"
            ? "מצא תשובות לשאלות הנפוצות ביותר על אפליקציית עיל״ם"
            : "Find answers to the most common questions about the EILAM app"}
        </p>
      </div>

      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={currentLanguage === "he" ? "חפש שאלות ותשובות..." : "Search questions and answers..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
            dir={currentLanguage === "he" ? "rtl" : "ltr"}
          />
        </div>
      </div>

      {filteredFAQ.length === 0 ? (
        <div className="text-center py-8">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {currentLanguage === "he" ? "לא נמצאו תוצאות לחיפוש שלך" : "No results found for your search"}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {currentLanguage === "he"
              ? "נסה לחפש מונחים אחרים או עיין בכל השאלות הנפוצות"
              : "Try searching for different terms or browse all FAQs"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFAQ.map((category, index) => (
            <Card key={index} className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-purple-700 dark:text-gray-100">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIndex) => (
                    <AccordionItem key={qIndex} value={`item-${index}-${qIndex}`}>
                      <AccordionTrigger className="text-left font-medium text-gray-800 dark:text-gray-200">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-300">{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
