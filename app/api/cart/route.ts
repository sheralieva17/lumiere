import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken } from "@/lib/mock-store"
import {
  addCartItemInDb,
  clearCartByUserId,
  getCartItemsByUserId,
  removeCartItemInDb,
  updateCartItemQuantityInDb,
} from "@/lib/db-cart"

export async function GET() {
  const token = await getBearerToken()
  const user = getUserByToken(token)

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  const items = await getCartItemsByUserId(user.id)
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
    const quantity =
      typeof body?.quantity === "number" ? body.quantity : undefined

    if (!productId) {
      return NextResponse.json(
        { error: "Не указан идентификатор товара." },
        { status: 400 }
      )
    }

    await addCartItemInDb({ user, productId, quantity })
    const items = await getCartItemsByUserId(user.id)

    return NextResponse.json({ items })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось добавить товар в корзину."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)

    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = await req.json()
    const productId =
      typeof body?.productId === "string" ? body.productId.trim() : ""
    const quantity =
      typeof body?.quantity === "number" ? body.quantity : Number.NaN

    if (!productId || !Number.isFinite(quantity)) {
      return NextResponse.json(
        { error: "Необходимо передать идентификатор товара и количество." },
        { status: 400 }
      )
    }

    await updateCartItemQuantityInDb({ user, productId, quantity })
    const items = await getCartItemsByUserId(user.id)

    return NextResponse.json({ items })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить корзину."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const token = await getBearerToken()
  const user = getUserByToken(token)

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  const url = new URL(req.url)
  const productId = url.searchParams.get("productId")?.trim()

  if (productId) {
    await removeCartItemInDb({ user, productId })
  } else {
    await clearCartByUserId(user.id)
  }

  const items = await getCartItemsByUserId(user.id)
  return NextResponse.json({ items })
}
