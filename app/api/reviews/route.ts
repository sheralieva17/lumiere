import { NextResponse } from "next/server"
import {
  getUserByToken,
} from "@/lib/mock-store"
import {
  createOrUpdateReviewInDb,
  getReviewsByProductFromDb,
} from "@/lib/db-reviews"
import { getBearerToken } from "@/lib/server-auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  if (!productId) {
    return NextResponse.json(
      { error: "Не указан идентификатор товара." },
      { status: 400 }
    )
  }

  const reviews = await getReviewsByProductFromDb(productId)
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return NextResponse.json({
    reviews,
    stats: {
      count: reviews.length,
      averageRating,
    },
  })
}

export async function POST(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = await req.json()
    const { productId, rating, comment } = body ?? {}

    if (!productId || typeof rating !== "number") {
      return NextResponse.json(
        { error: "Необходимо передать товар и оценку." },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Оценка должна быть от 1 до 5." },
        { status: 400 }
      )
    }

    const review = await createOrUpdateReviewInDb({
      user,
      productId,
      rating,
      comment: typeof comment === "string" ? comment : "",
    })

    return NextResponse.json({ review })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось отправить отзыв."
    const status =
      message.includes("purchased this product") || message.includes("Only customers")
        ? 403
        : 400
    return NextResponse.json({ error: message }, { status })
  }
}
