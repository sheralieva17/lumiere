import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import {
  changeOrderManagerStatus,
  listManagerOrders,
  listManagerOrdersByView,
} from "@/lib/services/manager-service"
import {
  getUserByToken,
  requireUserRole,
  type OrderManagerStatus,
  type PaymentStatus,
} from "@/lib/mock-store"

const ORDER_STATUSES: OrderManagerStatus[] = [
  "pending_review",
  "confirmed",
  "needs_clarification",
  "sent_to_fulfillment",
]
const DELIVERY_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const

const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "pending"]
const CANCELLATION_STATUSES = ["none", "requested", "approved", "rejected"] as const

async function ensureManagerAccess() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  requireUserRole(user, ["manager", "admin"])
}

export async function GET(req: Request) {
  try {
    await ensureManagerAccess()
    const { searchParams } = new URL(req.url)
    const viewParam = searchParams.get("view")
    const search = searchParams.get("search") ?? ""
    const view =
      viewParam === "delivered" || viewParam === "cancelled" || viewParam === "active"
        ? viewParam
        : undefined

    const orders =
      view || search
        ? await listManagerOrdersByView({ view: view ?? "active", search })
        : await listManagerOrders()
    return NextResponse.json({ orders })
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
    const { orderId, managerStatus, status, managerNote, paymentStatus, cancellationStatus } = body ?? {}

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Не указан идентификатор заказа." }, { status: 400 })
    }

    if (
      managerStatus !== undefined &&
      !ORDER_STATUSES.includes(managerStatus as OrderManagerStatus)
    ) {
      return NextResponse.json(
        { error: "Передан некорректный внутренний статус заказа." },
        { status: 400 }
      )
    }

    if (
      status !== undefined &&
      !DELIVERY_STATUSES.includes(
        status as (typeof DELIVERY_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Передан некорректный статус доставки." },
        { status: 400 }
      )
    }

    if (
      paymentStatus !== undefined &&
      !PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)
    ) {
      return NextResponse.json(
        { error: "Передан некорректный статус оплаты." },
        { status: 400 }
      )
    }

    if (
      cancellationStatus !== undefined &&
      !CANCELLATION_STATUSES.includes(
        cancellationStatus as (typeof CANCELLATION_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Передан некорректный статус отмены." },
        { status: 400 }
      )
    }

    if (
      managerStatus === undefined &&
      status === undefined &&
      paymentStatus === undefined &&
      cancellationStatus === undefined &&
      typeof managerNote !== "string"
    ) {
      return NextResponse.json(
        { error: "Не переданы корректные данные для обновления заказа." },
        { status: 400 }
      )
    }

    const order = await changeOrderManagerStatus({
      orderId,
      managerStatus:
        typeof managerStatus === "string"
          ? (managerStatus as OrderManagerStatus)
          : undefined,
      status:
        typeof status === "string"
          ? (status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")
          : undefined,
      managerNote: typeof managerNote === "string" ? managerNote : "",
      paymentStatus:
        typeof paymentStatus === "string" ? (paymentStatus as PaymentStatus) : undefined,
      cancellationStatus:
        typeof cancellationStatus === "string"
          ? (cancellationStatus as "none" | "requested" | "approved" | "rejected")
          : undefined,
    })
    return NextResponse.json({ order })
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Could not update order"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not update order"
            ? "Не удалось обновить заказ."
            : rawMessage
    const status =
      rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
