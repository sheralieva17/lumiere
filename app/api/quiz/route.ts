import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import {
  getUserByToken,
} from "@/lib/mock-store"
import type { RecommendationProfile } from "@/lib/products"
import { getDbAccountUser, saveDbUserQuizResult } from "@/lib/db-users"

export async function GET() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  const accountUser = await getDbAccountUser(user.id)
  if (!accountUser) {
    return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 })
  }

  return NextResponse.json({
    hasCompletedQuiz: accountUser.hasCompletedQuiz,
    quizResult: accountUser.quizResult,
    quizCompletedAt: accountUser.quizCompletedAt,
  })
}

export async function POST(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = (await req.json()) as { profile?: RecommendationProfile }
    if (!body.profile) {
      return NextResponse.json(
        { error: "Не переданы данные теста." },
        { status: 400 }
      )
    }

    const updatedUser = await saveDbUserQuizResult(user.id, body.profile)
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить результат теста."
    const status = message.includes("only be completed once") ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
