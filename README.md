# 🚨 עיל"ם - מערכת עזרה ייעודית למצבי חירום

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/baravidan1996s-projects/v0-eilam-em)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/zCfY3Lv9wCs)

## 📋 תיאור המערכת

**עיל"ם** (Emergency Intelligence & Logistics Assistant Management) היא מערכת מתקדמת לניהול מצבי חירום, שפותחה כדי לסייע לאזרחים בישראל בהכנה ובהתמודדות עם מצבי חירום שונים. המערכת משלבת בינה מלאכותית, מפות אינטראקטיביות וכלי ניהול מתקדמים ליצירת פתרון מקיף ונגיש.

## 🎯 פונקציונליות מרכזית

### 🤖 **עוזר AI חכם**
- מענה מיידי לשאלות בנושאי חירום וביטחון
- המלצות מותאמות אישית לפי מצב המשתמש
- גישה למידע עדכני מהרשת באמצעות חיפוש בזמן אמת
- שמירת היסטוריית שיחות ומעקב אחר נושאים

### 🗺️ **איתור מקלטים מתקדם**
- חיפוש מקלטים לפי מיקום נוכחי או כתובת
- הצגה על מפה אינטראקטיבית עם מידע מפורט
- חישוב זמני הליכה ומסלולי הגעה
- שמירת מקלטים מועדפים לגישה מהירה
- סינון לפי רדיוס חיפוש וזמן הגעה

### 📦 **ניהול ציוד חירום**
- יצירת רשימות ציוד מותאמות אישית
- המלצות AI לציוד לפי הרכב המשפחה
- מעקב אחר תאריכי תפוגה עם תזכורות SMS
- קטגוריזציה וסינון פריטים
- מעקב מצב רכישה והכנות כללית

### 🤖 **סוכן AI אוטונומי**
- תכנון וביצוע משימות מורכבות באופן אוטומטי
- ניתוח צרכים והמלצות פעולה
- מעקב בזמן אמת אחר התקדמות משימות
- התאמה אישית לצרכים ספציפיים

### 👤 **ניהול פרופיל אישי**
- רישום והתחברות מאובטחת
- ניהול פרטים אישיים והעדפות
- אימות דו-שלבי ואבטחה מתקדמת
- תמיכה במצב כהה/בהיר

## 🛠️ טכנולוגיות ופלטפורמות

### **Frontend**
- **Next.js 15** - React framework עם App Router
- **TypeScript** - פיתוח type-safe
- **Tailwind CSS** - עיצוב מודרני ורספונסיבי
- **shadcn/ui** - ספריית קומפוננטים מתקדמת

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - בסיס נתונים יחסי
- **Row Level Security (RLS)** - אבטחה ברמת השורה
- **Real-time subscriptions** - עדכונים בזמן אמת

### **AI & Machine Learning**
- **OpenAI GPT-4** - עוזר AI ויצירת תוכן
- **OpenAI Functions** - סוכן AI אוטונומי
- **Tavily Search API** - חיפוש מידע ברשת
- **RAG (Retrieval Augmented Generation)** - שיפור תשובות AI

### **מפות ומיקום**
- **Google Maps JavaScript API** - מפות אינטראקטיביות
- **Google Geocoding API** - המרת כתובות
- **Google Places API** - חיפוש מקלטים
- **Google Directions API** - חישוב מסלולים

### **תקשורת ואינטגרציות**
- **Twilio SMS API** - תזכורות והתראות
- **Vercel** - פלטפורמת hosting ופריסה
- **Vercel Cron Jobs** - משימות מתוזמנות

## 🏗️ ארכיטקטורת המערכת

### **שכבת הלקוח (Client Layer)**
\`\`\`
📱 Mobile/Tablet/Desktop
├── React Components (UI)
├── State Management (Hooks)
├── API Client Layer
└── Real-time Updates (WebSocket)
\`\`\`

### **שכבת השרת (Server Layer)**
\`\`\`
⚙️ Next.js API Routes
├── Authentication (JWT)
├── Business Logic
├── Database Operations
└── External API Integration
\`\`\`

### **שכבת הנתונים (Data Layer)**
\`\`\`
🗄️ Supabase Backend
├── PostgreSQL Database
├── Authentication Service
├── Real-time Engine
└── Row Level Security
\`\`\`

### **APIs חיצוניים**
\`\`\`
🌐 External Services
├── OpenAI (AI & ML)
├── Google Maps (Location)
├── Twilio (SMS)
└── Tavily (Web Search)
\`\`\`

## 📱 רספונסיביות ותמיכה

### **פלטפורמות נתמכות**
- 📱 **מובייל:** iOS, Android (כל הדפדפנים)
- 📱 **טאבלט:** iPad, Android tablets
- 💻 **דסקטופ:** Windows, macOS, Linux
- 🌐 **דפדפנים:** Chrome, Safari, Firefox, Edge

### **Breakpoints**
- 📱 **Mobile:** 320px - 767px
- 📱 **Tablet:** 768px - 1023px
- 💻 **Desktop:** 1024px - 1439px
- 🖥️ **Large Desktop:** 1440px+

## 🔐 אבטחה ופרטיות

- 🔒 **HTTPS/TLS** - הצפנת תעבורה
- 🎫 **JWT Authentication** - אימות מאובטח
- 🛡️ **Row Level Security** - הגנה ברמת הנתונים
- 🔑 **Environment Variables** - הגנה על מפתחות API
- ✅ **Input Validation** - אימות נתונים
- 📧 **Email Verification** - אימות חשבון

## 🚀 תכונות מתקדמות

- ⚡ **Performance Optimization** - טעינה מהירה
- 📡 **Real-time Updates** - עדכונים בזמן אמת
- 🌙 **Dark/Light Mode** - מצבי תצוגה
- 🌍 **RTL Support** - תמיכה בעברית
- 📱 **PWA Ready** - תכונות אפליקציה
- 🔄 **Offline Support** - עבודה ללא אינטרנט

## 🎯 יעדי המערכת

1. **נגישות** - ממשק פשוט ונגיש לכל הגילאים
2. **מהירות** - מענה מיידי במצבי חירום
3. **דיוק** - מידע מדויק ועדכני
4. **אמינות** - זמינות גבוהה ויציבות
5. **אבטחה** - הגנה מקסימלית על נתוני המשתמשים

## 📞 תמיכה וקשר

לתמיכה טכנית או שאלות נוספות, ניתן לפנות דרך:
- 🌐 **אתר הפרויקט:** [v0.dev/chat/projects/zCfY3Lv9wCs](https://v0.dev/chat/projects/zCfY3Lv9wCs)
- 🚀 **פריסה חיה:** [vercel.com/baravidan1996s-projects/v0-eilam-em](https://vercel.com/baravidan1996s-projects/v0-eilam-em)

---

**עיל"ם - כי הכנה טובה מצילה חיים** 🇮🇱
