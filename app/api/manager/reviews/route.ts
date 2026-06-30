import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"
import { listManagerReviews, moderateReview } from "@/lib/services/manager-service"
import type { ReviewModerationStatus } from "@/lib/mock-store"

const REVIEW_STATUSES: ReviewModerationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "escalated",
]

async function ensureManagerAccess() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  requireUserRole(user, ["manager", "admin"])
}

export async function GET() {
  try {
    await ensureManagerAccess()
    const reviews = await listManagerReviews()
    return NextResponse.json({ reviews })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unauthorized"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : 401
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureManagerAccess()
    const body = await req.json()
    const { reviewId, moderationStatus, managerReply, escalatedToAdmin } = body ?? {}

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json({ error: "Не указан идентификатор отзыва." }, { status: 400 })
    }

    if (
      moderationStatus !== undefined &&
      !REVIEW_STATUSES.includes(moderationStatus)
    ) {
      return NextResponse.json(
        { error: "Передан некорректный статус модерации." },
        { status: 400 }
      )
    }

    const review = await moderateReview({
      reviewId,
      moderationStatus,
      managerReply: typeof managerReply === "string" ? managerReply : undefined,
      escalatedToAdmin:
        typeof escalatedToAdmin === "boolean" ? escalatedToAdmin : undefined,
    })

    return NextResponse.json({ review })
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Could not update review"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not update review"
            ? "Не удалось обновить отзыв."
            : rawMessage
    const status =
      rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
