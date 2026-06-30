import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken } from "@/lib/mock-store"
import {
  clearFavoritesByUserId,
  getFavoriteProductsByUserId,
  toggleFavoriteInDb,
} from "@/lib/db-favorites"

export async function GET() {
  const token = await getBearerToken()
  const user = getUserByToken(token)

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  const items = await getFavoriteProductsByUserId(user.id)
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)

    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = await req.json()
    const productId =
      typeof body?.productId === "string" ? body.productId.trim() : ""

    if (!productId) {
      return NextResponse.json(
        { error: "Не указан идентификатор товара." },
        { status: 400 }
      )
    }

    const result = await toggleFavoriteInDb({ user, productId })
    const items = await getFavoriteProductsByUserId(user.id)

    return NextResponse.json({
      ...result,
      items,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить избранное."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE() {
  const token = await getBearerToken()
  const user = getUserByToken(token)

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  await clearFavoritesByUserId(user.id)
  return NextResponse.json({ items: [] })
}
