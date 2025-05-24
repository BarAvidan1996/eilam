import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  })
  return response.data[0].embedding
}

async function addSampleDocuments() {
  const documents = [
    {
      title: "הוראות בזמן אזעקה",
      file_name: "alarm_instructions.html",
      plain_text: `כאשר נשמעת אזעקה יש להיכנס למקלט או לחדר המוגן הקרוב ביותר. 
      אם אין מקלט קרוב, יש להיכנס לחדר הכי פנימי בבניין, הרחק מחלונות ומרפסות. 
      יש לשכב על הרצפה ולכסות את הראש בידיים. 
      יש להמתין 10 דקות לפחות אחרי סיום האזעקה לפני היציאה.
      יש להקשיב להוראות נוספות מפיקוד העורף ברדיו או באפליקציה.`,
      language: "he",
      summary: "הוראות התנהגות בזמן אזעקה",
      keywords: ["אזעקה", "מקלט", "בטיחות", "חירום"],
    },
    {
      title: "ההבדל בין מקלט ציבורי לממ״ד",
      file_name: "shelter_types.html",
      plain_text: `מקלט ציבורי הוא מבנה ציבורי המיועד לכלל האוכלוסייה בעת חירום. 
      ממ״ד (מרחב מוגן דירתי) הוא חדר מוגן בתוך דירה פרטית. 
      מקלט ציבורי בדרך כלל גדול יותר ומיועד לאוכלוסייה רבה, בעוד ממ״ד מיועד למשפחה אחת או מספר קטן של אנשים.
      מקלט ציבורי מנוהל על ידי הרשות המקומית, בעוד ממ״ד מנוהל על ידי בעלי הדירה.`,
      language: "he",
      summary: "הסבר על סוגי מקלטים שונים",
      keywords: ["מקלט", "ממד", "מרחב מוגן", "מקלט ציבורי"],
    },
    {
      title: "בעלי חיים במקלטים",
      file_name: "pets_in_shelters.html",
      plain_text: `מותר להכניס בעלי חיים קטנים למקלט, כגון כלבים וחתולים, בתנאי שהם בכלוב או רתומים. 
      יש להביא מזון ומים לבעל החיים. 
      יש לשמור על שקט ולא לתת לבעל החיים לנבוח או לעשות רעש.
      בעלי חיים גדולים כמו סוסים לא מותרים במקלט הציבורי.
      במקלט ציבורי יש לבדוק עם האחראי על המקלט לפני הכנסת בעל החיים.`,
      language: "he",
      summary: "כללים להכנסת בעלי חיים למקלט",
      keywords: ["בעלי חיים", "מקלט", "כלבים", "חתולים", "חיות מחמד"],
    },
    {
      title: "זמני המתנה במקלט",
      file_name: "shelter_waiting_times.html",
      plain_text: `זמני המתנה במקלט משתנים לפי סוג האיום:
      אזעקה רגילה: 10 דקות לפחות אחרי סיום האזעקה.
      התקפה כימית: עד שיגיעו הוראות מפיקוד העורף לצאת.
      רעידת אדמה: עד שהרעידות נפסקות לחלוטין ויש הוראה לצאת.
      תמיד יש להקשיב לעדכונים ברדיו או באפליקציית פיקוד העורף.`,
      language: "he",
      summary: "זמני המתנה הנדרשים במקלט",
      keywords: ["זמן המתנה", "מקלט", "אזעקה", "רעידת אדמה"],
    },
  ]

  for (const doc of documents) {
    try {
      console.log(`Creating embedding for: ${doc.title}`)
      const embedding = await createEmbedding(doc.plain_text)

      const { data, error } = await supabase.from("rag_documents").insert({
        title: doc.title,
        file_name: doc.file_name,
        plain_text: doc.plain_text,
        embedding: embedding,
        language: doc.language,
        summary: doc.summary,
        keywords: doc.keywords,
        authors: ["פיקוד העורף"],
        date_published: "2024-01-01",
        storage_path: `/documents/${doc.file_name}`,
      })

      if (error) {
        console.error(`Error inserting ${doc.title}:`, error)
      } else {
        console.log(`Successfully added: ${doc.title}`)
      }
    } catch (error) {
      console.error(`Error processing ${doc.title}:`, error)
    }
  }
}

// הרצה של הסקריפט
addSampleDocuments()
  .then(() => console.log("Finished adding sample documents"))
  .catch((error) => console.error("Error:", error))
