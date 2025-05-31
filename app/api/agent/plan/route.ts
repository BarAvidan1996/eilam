import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createAgent } from "@/lib/agent"
import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs"

const bodySchema = z.object({
  prompt: z.string(),
  conversationId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, conversationId } = bodySchema.parse(body)

    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          name: prompt.substring(0, 50),
        },
      })
    }

    const agent = createAgent({
      conversationId: conversation.id,
    })

    const plan = await analyzePromptAndCreatePlan(prompt)

    return NextResponse.json({
      plan,
      conversationId: conversation.id,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(e.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

type Tool = {
  id: string
  name: string
  priority: number
  reasoning: string
  parameters: Record<string, string | number | boolean>
}

async function analyzePromptAndCreatePlan(prompt: string) {
  // const tools: Tool[] = [
  //   {
  //     id: "rag_chat",
  //     name: "RAG Chat",
  //     priority: 1,
  //     reasoning: "The user is asking a question that can be answered by RAG.",
  //     parameters: {
  //       query: prompt,
  //     },
  //   },
  //   {
  //     id: "find_shelters",
  //     name: "Find Shelters",
  //     priority: 2,
  //     reasoning: "The user is asking to find shelters.",
  //     parameters: {
  //       address: "Tel Aviv",
  //       radius: 1500,
  //       maxDuration: 15,
  //     },
  //   },
  // ]

  const tools: Tool[] = []

  // זיהוי צורך ב-RAG Chat
  if (
    prompt.includes("מה עושים") ||
    prompt.includes("איך") ||
    prompt.includes("נהלים") ||
    prompt.includes("הוראות") ||
    prompt.includes("מדריך") ||
    prompt.includes("רעידת אדמה") ||
    prompt.includes("אזעקה") ||
    prompt.includes("חירום")
  ) {
    tools.push({
      id: "rag_chat",
      name: "חיפוש מידע וההוראות",
      priority: 1,
      reasoning: "מחפש מידע רלוונטי ונהלים מפיקוד העורף",
      parameters: {
        query: prompt,
      },
    })
  }

  // זיהוי צורך בחיפוש מקלטים
  if (
    prompt.includes("מקלט") ||
    prompt.includes("איפה") ||
    prompt.includes("קרוב") ||
    prompt.includes("מיקום") ||
    prompt.includes("כתובת") ||
    /תל אביב|ירושלים|חיפה|באר שבע|פתח תקווה|נתניה|אשדוד|ראשון לציון/.test(prompt)
  ) {
    // ניסיון לחלץ כתובת או עיר מהפרומפט
    const locationMatch =
      prompt.match(/ב([א-ת\s]+)/) || prompt.match(/(תל אביב|ירושלים|חיפה|באר שבע|פתח תקווה|נתניה|אשדוד|ראשון לציון)/)
    const location = locationMatch ? locationMatch[1] || locationMatch[0] : ""

    tools.push({
      id: "find_shelters",
      name: "חיפוש מקלטים קרובים",
      priority: 2,
      reasoning: "מחפש מקלטים ומרחבים מוגנים באזור המבוקש",
      parameters: {
        address: location || "תל אביב", // ברירת מחדל
        radius: 1500,
        maxDuration: 15,
      },
    })
  }

  // זיהוי צורך בהמלצות ציוד
  if (
    prompt.includes("ציוד") ||
    prompt.includes("מה צריך") ||
    prompt.includes("להכין") ||
    prompt.includes("משפחה") ||
    prompt.includes("ילדים") ||
    prompt.includes("תיק חירום")
  ) {
    // ניסיון לחלץ פרטי משפחה
    const familyInfo = prompt.match(/(\d+)\s*(ילדים?|בנים?|בנות?)/)
    const familyProfile = familyInfo ? `משפחה עם ${familyInfo[1]} ${familyInfo[2]}` : "משפחה"

    tools.push({
      id: "recommend_equipment",
      name: "המלצות ציוד חירום",
      priority: 3,
      reasoning: "ממליץ על ציוד חירום מותאם לפרופיל המשפחה",
      parameters: {
        familyProfile: `${familyProfile} - ${prompt}`,
        duration: 72,
      },
    })
  }

  return tools.sort((a, b) => a.priority - b.priority)
}
