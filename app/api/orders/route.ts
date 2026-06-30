import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import {
  getUserByToken,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/mock-store"
import {
  confirmOrderReceivedByCustomerInDb,
  createOrderInDb,
  getOrdersByUserFromDb,
  requestOrderCancellationInDb,
} from "@/lib/db-orders"
import { getDbAccountUser } from "@/lib/db-users"

const PAYMENT_METHODS: PaymentMethod[] = [
  "mock_card",
  "cash_on_delivery",
]

export async function GET() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }

  const orders = await getOrdersByUserFromDb(user.id)
  return NextResponse.json({ orders })
}

export async function POST(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = await req.json()
    const { items, shippingAddress, saveAddress, paymentMethod } = body ?? {}
    const normalizedShippingAddress =
      shippingAddress &&
      typeof shippingAddress === "object" &&
      !Array.isArray(shippingAddress)
        ? {
            city:
              typeof shippingAddress.city === "string"
                ? shippingAddress.city.trim()
                : "",
            street:
              typeof shippingAddress.street === "string"
                ? shippingAddress.street.trim()
                : "",
            house:
              typeof shippingAddress.house === "string"
                ? shippingAddress.house.trim()
                : "",
            apartment:
              typeof shippingAddress.apartment === "string"
                ? shippingAddress.apartment.trim()
                : "",
            phone:
              typeof shippingAddress.phone === "string"
                ? shippingAddress.phone.trim()
                : "",
          }
        : null

    if (!Array.isArray(items) || items.length === 0 || !normalizedShippingAddress) {
      return NextResponse.json(
        { error: "Необходимо передать товары и адрес доставки." },
        { status: 400 }
      )
    }

    if (
      !normalizedShippingAddress.city ||
      !normalizedShippingAddress.street ||
      !normalizedShippingAddress.house ||
      !normalizedShippingAddress.apartment ||
      !normalizedShippingAddress.phone
    ) {
      return NextResponse.json(
        {
          error:
            "Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
        },
        { status: 400 }
      )
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Выберите корректный способ оплаты." },
        { status: 400 }
      )
    }

    const paymentStatus: PaymentStatus =
      paymentMethod === "mock_card" ? "paid" : "pending"

    const result = await createOrderInDb({
      user,
      items,
      shippingAddress: normalizedShippingAddress,
      saveAddress: Boolean(saveAddress),
      paymentMethod,
      paymentStatus,
    })

    const accountUser = await getDbAccountUser(user.id)

    return NextResponse.json({
      order: result.order,
      user: accountUser,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось оформить заказ."
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
    const { orderId, action, cancellationReason } = body ?? {}
    const normalizedReason =
      typeof cancellationReason === "string" ? cancellationReason.trim() : ""

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Не указан идентификатор заказа." }, { status: 400 })
    }

    if (action === "confirm_received") {
      const order = await confirmOrderReceivedByCustomerInDb({
        userId: user.id,
        orderId,
      })
      return NextResponse.json({ order })
    }

    if (!normalizedReason) {
      return NextResponse.json(
        { error: "Причина отмены обязательна." },
        { status: 400 }
      )
    }

    const order = await requestOrderCancellationInDb({
      userId: user.id,
      orderId,
      cancellationReason: normalizedReason,
    })

    return NextResponse.json({ order })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось отправить запрос на отмену."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
