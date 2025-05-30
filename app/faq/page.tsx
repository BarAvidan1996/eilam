"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// תרגומים לפי שפה
const translations = {
  he: {
    title: "שאלות נפוצות (FAQ)",
    description: 'מצא תשובות לשאלות נפוצות על מערכת עיל"ם ותפעולה.',
    faqItems: [
      {
        question: 'מהי מערכת עיל"ם?',
        answer:
          "עיל\"ם (עוזר ייעודי למצבי חירום) היא מערכת המספקת מידע וסיוע בזמן אמת במצבי חירום ביטחוניים ואזרחיים. היא כוללת צ'אט חכם, איתור מקלטים, ויצירת רשימות ציוד מותאמות.",
      },
      {
        question: "איך עובד הצ'אט החכם?",
        answer:
          "הצ'אט משתמש במודל שפה מתקדם (GPT) ובמאגר ידע ייעודי (RAG) הכולל הנחיות רשמיות מפיקוד העורף ושירותי חירום אחרים כדי לספק תשובות מדויקות ורלוונטיות לשאלותיך.",
      },
      {
        question: "האם המידע על המקלטים מעודכן?",
        answer:
          "אנו שואפים לעדכן את מאגר המקלטים באופן קבוע בהתבסס על מידע ממקורות רשמיים. עם זאת, מומלץ תמיד לבדוק גם עם הרשות המקומית שלך.",
      },
      {
        question: "איך אני יכול ליצור רשימת ציוד מותאמת אישית?",
        answer:
          "אתה יכול ליצור רשימת ציוד על ידי שיחה עם ה-AI, שישאל אותך שאלות על הצרכים שלך (למשל, מספר אנשים, צרכים מיוחדים) ויבנה רשימה בהתאם. אתה יכול גם ליצור רשימה באופן ידני.",
      },
      {
        question: "האם השימוש במערכת מאובטח?",
        answer:
          "אנו מתייחסים לאבטחת נתונים ברצינות. המערכת משתמשת בפרוטוקולים מאובטחים להעברת נתונים. פרטי ההתחברות שלך מאובטחים באמצעות Supabase Auth. עם זאת, זכור לא לשתף מידע רגיש מדי בצ'אט.",
      },
    ],
  },
  en: {
    title: "Frequently Asked Questions (FAQ)",
    description: "Find answers to common questions about the EILAM system and its operation.",
    faqItems: [
      {
        question: "What is the EILAM system?",
        answer:
          "EILAM (Emergency Information and Location Assistant Module) is a system that provides real-time information and assistance in security and civil emergency situations. It includes a smart chat, shelter locator, and creation of customized equipment lists.",
      },
      {
        question: "How does the smart chat work?",
        answer:
          "The chat uses an advanced language model (GPT) and a dedicated knowledge base (RAG) that includes official guidelines from the Home Front Command and other emergency services to provide accurate and relevant answers to your questions.",
      },
      {
        question: "Is the information about shelters up-to-date?",
        answer:
          "We strive to update the shelter database regularly based on information from official sources. However, it is always recommended to also check with your local authority.",
      },
      {
        question: "How can I create a customized equipment list?",
        answer:
          "You can create an equipment list by talking to the AI, which will ask you questions about your needs (e.g., number of people, special needs) and build a list accordingly. You can also create a list manually.",
      },
      {
        question: "Is using the system secure?",
        answer:
          "We take data security seriously. The system uses secure protocols for data transfer. Your login details are secured using Supabase Auth. However, remember not to share too sensitive information in the chat.",
      },
    ],
  },
  ar: {
    title: "الأسئلة الشائعة (FAQ)",
    description: "ابحث عن إجابات للأسئلة الشائعة حول نظام إيلام وتشغيله.",
    faqItems: [
      {
        question: "ما هو نظام إيلام؟",
        answer:
          "إيلام (وحدة مساعد المعلومات والموقع في حالات الطوارئ) هو نظام يوفر معلومات ومساعدة في الوقت الحقيقي في حالات الطوارئ الأمنية والمدنية. يتضمن دردشة ذكية، ومحدد مواقع الملاجئ، وإنشاء قوائم معدات مخصصة.",
      },
      {
        question: "كيف تعمل الدردشة الذكية؟",
        answer:
          "تستخدم الدردشة نموذج لغة متقدم (GPT) وقاعدة معرفية مخصصة (RAG) تتضمن إرشادات رسمية من قيادة الجبهة الداخلية وخدمات الطوارئ الأخرى لتقديم إجابات دقيقة وذات صلة لأسئلتك.",
      },
      {
        question: "هل المعلومات حول الملاجئ محدثة؟",
        answer:
          "نحن نسعى جاهدين لتحديث قاعدة بيانات الملاجئ بانتظام بناءً على معلومات من مصادر رسمية. ومع ذلك، يوصى دائمًا بالتحقق أيضًا مع السلطة المحلية الخاصة بك.",
      },
      {
        question: "كيف يمكنني إنشاء قائمة معدات مخصصة؟",
        answer:
          "يمكنك إنشاء قائمة معدات من خلال التحدث إلى الذكاء الاصطناعي، الذي سيطرح عليك أسئلة حول احتياجاتك (مثل عدد الأشخاص، الاحتياجات الخاصة) وبناء قائمة وفقًا لذلك. يمكنك أيضًا إنشاء قائمة يدويًا.",
      },
      {
        question: "هل استخدام النظام آمن؟",
        answer:
          "نحن نأخذ أمن البيانات على محمل الجد. يستخدم النظام بروتوكولات آمنة لنقل البيانات. تفاصيل تسجيل الدخول الخاصة بك مؤمنة باستخدام Supabase Auth. ومع ذلك، تذكر عدم مشاركة معلومات حساسة للغاية في الدردشة.",
      },
    ],
  },
  ru: {
    title: "Часто задаваемые вопросы (FAQ)",
    description: "Найдите ответы на распространенные вопросы о системе ЭЙЛАМ и ее работе.",
    faqItems: [
      {
        question: "Что такое система ЭЙЛАМ?",
        answer:
          "ЭЙЛАМ (Модуль помощника по информации и местоположению в чрезвычайных ситуациях) - это система, которая предоставляет информацию и помощь в режиме реального времени в ситуациях безопасности и гражданских чрезвычайных ситуациях. Она включает в себя умный чат, локатор убежищ и создание настраиваемых списков оборудования.",
      },
      {
        question: "Как работает умный чат?",
        answer:
          "Чат использует продвинутую языковую модель (GPT) и специальную базу знаний (RAG), которая включает официальные рекомендации от Командования тыла и других служб экстренной помощи, чтобы предоставить точные и релевантные ответы на ваши вопросы.",
      },
      {
        question: "Актуальна ли информация об убежищах?",
        answer:
          "Мы стремимся регулярно обновлять базу данных убежищ на основе информации из официальных источников. Однако всегда рекомендуется также проверять информацию у местных властей.",
      },
      {
        question: "Как я могу создать настраиваемый список оборудования?",
        answer:
          "Вы можете создать список оборудования, общаясь с ИИ, который задаст вам вопросы о ваших потребностях (например, количество людей, особые потребности) и составит список соответственно. Вы также можете создать список вручную.",
      },
      {
        question: "Безопасно ли использование системы?",
        answer:
          "Мы серьезно относимся к безопасности данных. Система использует защищенные протоколы для передачи данных. Ваши данные для входа защищены с помощью Supabase Auth. Однако помните, что не следует делиться слишком конфиденциальной информацией в чате.",
      },
    ],
  },
}

export default function FAQPage() {
  const [language, setLanguage] = useState("he")

  // קביעת השפה מתוך document רק בצד לקוח
  useEffect(() => {
    const lang = document?.documentElement?.lang || "he"
    setLanguage(lang)
  }, [])

  const t = translations[language] || translations.he

  return (
    <div className="container py-10">
      <div className="flex flex-col items-end mb-6">
        <h1 className="text-3xl font-bold mb-2 text-right">{t.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-right">{t.description}</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto dark:bg-gray-800">
        <CardContent className="p-8">
          <Accordion type="single" collapsible className="w-full">
            {t.faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
