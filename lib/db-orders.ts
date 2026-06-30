import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import {
  getUserRecordById,
  type OrderManagerStatus,
  type PaymentMethod,
  type PaymentStatus,
  type UserRecord,
} from "@/lib/mock-store"

type CancellationStatus = "none" | "requested" | "approved" | "rejected"
type ClientOrderStatus =
  | "processing"
  | "assembling"
  | "in_transit"
  | "delivered"
  | "cancelled"
type ManagerOrdersView = "active" | "delivered" | "cancelled"
type DbOrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
const SHIPPING_FEE = 200

function formatShippingAddress(input: {
  city: string
  street: string
  house: string
  apartment: string
}) {
  return [input.city.trim(), input.street.trim(), `дом ${input.house.trim()}`, `кв. ${input.apartment.trim()}`]
    .filter(Boolean)
    .join(", ")
}

function getClientStatusFromOrder(input: {
  status: DbOrderStatus
  cancellationStatus: CancellationStatus
}): ClientOrderStatus {
  return input.status === "cancelled" || input.cancellationStatus === "approved"
    ? "cancelled"
    : input.status === "confirmed"
      ? "assembling"
      : input.status === "shipped"
        ? "in_transit"
        : input.status === "delivered"
          ? "delivered"
          : "processing"
}

function assertOrderCanBeChanged(order: {
  status: DbOrderStatus
  cancellationStatus: CancellationStatus
}) {
  if (order.status === "delivered") {
    throw new Error("Доставленный заказ нельзя изменить.")
  }
  if (order.status === "cancelled" || order.cancellationStatus === "approved") {
    throw new Error("Отмененный заказ нельзя изменить.")
  }
}

async function ensureDbUserForOrder(user: UserRecord) {
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  })

  if (existing) return existing.id

  const existingByEmail = await prisma.user.findUnique({
    where: { email: user.email.trim().toLowerCase() },
    select: { id: true },
  })

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        phone: user.phone ?? "",
        avatarUrl: user.avatarDataUrl || null,
        role: user.role,
      },
    })
    return existingByEmail.id
  }

  const created = await prisma.user.create({
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email.trim().toLowerCase(),
      password: user.password,
      phone: user.phone ?? "",
      avatarUrl: user.avatarDataUrl || null,
      role: user.role,
    },
    select: { id: true },
  })

  return created.id
}

function mapOrderForClient(order: {
  id: string
  createdAt: Date
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingAddress: string
  subtotal: number
  shipping: number
  tax: number
  totalAmount: number
  managerStatus: OrderManagerStatus
  managerNote: string
  managerUpdatedAt: Date | null
  cancellationStatus: CancellationStatus
  cancellationReason: string
  cancellationRequestedAt: Date | null
  cancellationResolvedAt: Date | null
  items: Array<{
    productId: string
    quantity: number
    price: number
    product: {
      name: string
      image: string
    }
  }>
}) {
  const effectiveStatus = getClientStatusFromOrder({
    status: order.status,
    cancellationStatus: order.cancellationStatus,
  })

  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.totalAmount,
    managerStatus: order.managerStatus,
    managerNote: order.managerNote,
    managerUpdatedAt: order.managerUpdatedAt?.toISOString() ?? null,
    status: effectiveStatus,
    cancellationStatus: order.cancellationStatus,
    cancellationReason: order.cancellationReason,
    cancellationRequestedAt: order.cancellationRequestedAt?.toISOString() ?? null,
    cancellationResolvedAt: order.cancellationResolvedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      price: item.price,
    })),
  }
}

export async function createOrderInDb(input: {
  user: UserRecord
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: {
    city: string
    street: string
    house: string
    apartment: string
    phone: string
  }
  saveAddress: boolean
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
}) {
  const dbUserId = await ensureDbUserForOrder(input.user)

  const normalizedItems = input.items
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(0, Math.floor(item.quantity)),
    }))
    .filter((item) => item.quantity > 0)

  if (normalizedItems.length === 0) {
    throw new Error("В заказе нет корректных товаров.")
  }

  const dbProducts = await prisma.product.findMany({
    where: {
      id: { in: normalizedItems.map((item) => item.productId) },
    },
  })

  if (dbProducts.length === 0) {
    throw new Error("В заказе нет корректных товаров.")
  }

  const items = normalizedItems
    .map((item) => {
      const product = dbProducts.find((dbProduct) => dbProduct.id === item.productId)
      if (!product) return null
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      }
    })
    .filter((item): item is { productId: string; quantity: number; price: number } =>
      Boolean(item)
    )

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = SHIPPING_FEE
  const tax = 0
  const totalAmount = subtotal + shipping

  let addressId: string | undefined
  const addressPayload = {
    city: input.shippingAddress.city.trim(),
    street: input.shippingAddress.street.trim(),
    house: input.shippingAddress.house.trim(),
    apartment: input.shippingAddress.apartment.trim(),
    phone: input.shippingAddress.phone.trim(),
  }
  const formattedAddress = formatShippingAddress(addressPayload)

  if (input.saveAddress && formattedAddress) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: dbUserId,
        city: addressPayload.city,
        street: addressPayload.street,
        house: addressPayload.house,
        apartment: addressPayload.apartment,
      },
      select: { id: true },
    })

    if (existingAddress) {
      addressId = existingAddress.id
    } else {
      const createdAddress = await prisma.address.create({
        data: {
          userId: dbUserId,
          street: addressPayload.street,
          city: addressPayload.city,
          region: null,
          house: addressPayload.house,
          apartment: addressPayload.apartment,
          phone: addressPayload.phone,
          isDefault: false,
        },
        select: { id: true },
      })
      addressId = createdAddress.id
    }
  }

  const createdOrder = await prisma.order.create({
    data: {
      user: {
        connect: { id: dbUserId },
      },
      ...(addressId
        ? {
            address: {
              connect: { id: addressId },
            },
          }
        : {}),
      shippingAddress: formattedAddress,
      subtotal,
      shipping,
      tax,
      totalAmount,
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      items: {
        create: items,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  return {
    order: mapOrderForClient(createdOrder),
  }
}

export async function getOrdersByUserFromDb(userId: string) {
  const dbUserId =
    (await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }))?.id ??
    (await (async () => {
      const legacyUser = getUserRecordById(userId)
      if (!legacyUser) return null
      return ensureDbUserForOrder(legacyUser)
    })())

  if (!dbUserId) return []

  const orders = await prisma.order.findMany({
    where: { userId: dbUserId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return orders.map(mapOrderForClient)
}

export async function getAllOrdersForManagerFromDb(input?: {
  view?: ManagerOrdersView
  search?: string
}) {
  const view = input?.view ?? "active"
  const normalizedSearch = input?.search?.trim() ?? ""
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setHours(0, 0, 0, 0)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const whereClause: Prisma.OrderWhereInput =
    view === "active"
      ? {
          status: {
            notIn: ["delivered", "cancelled"],
          },
          ...(normalizedSearch
            ? {
                id: { contains: normalizedSearch, mode: "insensitive" },
              }
            : {}),
        }
      : {
          status: view === "delivered" ? "delivered" : "cancelled",
          ...(normalizedSearch
            ? {
                id: { contains: normalizedSearch, mode: "insensitive" },
              }
            : {
                managerUpdatedAt: {
                  gte: sevenDaysAgo,
                },
              }),
        }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return orders.map((order) => ({
    ...mapOrderForClient(order),
    customerName: `${order.user.firstName} ${order.user.lastName}`.trim() || "Unknown",
    customerEmail: order.user.email,
  }))
}

export async function requestOrderCancellationInDb(input: {
  userId: string
  orderId: string
  cancellationReason?: string
}) {
  const normalizedReason = (input.cancellationReason ?? "").trim()
  if (!normalizedReason) {
    throw new Error("Причина отмены обязательна.")
  }

  const dbUserId =
    (await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    }))?.id ??
    (await (async () => {
      const legacyUser = getUserRecordById(input.userId)
      if (!legacyUser) return null
      return ensureDbUserForOrder(legacyUser)
    })())

  if (!dbUserId) {
    throw new Error("Пользователь не найден.")
  }

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      userId: dbUserId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error("Заказ не найден.")
  }

  const effectiveStatus = getClientStatusFromOrder({
    status: order.status,
    cancellationStatus: order.cancellationStatus,
  })
  if (effectiveStatus === "in_transit" || effectiveStatus === "delivered") {
    throw new Error("Нельзя отменить заказ, который уже в пути или доставлен.")
  }
  if (effectiveStatus === "cancelled" || order.cancellationStatus === "approved") {
    throw new Error("Этот заказ уже отменен.")
  }
  if (order.cancellationStatus === "requested") {
    throw new Error("Запрос на отмену уже отправлен.")
  }

  const updated = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      cancellationStatus: "requested",
      cancellationReason: normalizedReason,
      cancellationRequestedAt: new Date(),
      cancellationResolvedAt: null,
      managerStatus: "pending_review",
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  return mapOrderForClient(updated)
}

export async function updateOrderByManagerInDb(input: {
  orderId: string
  managerStatus?: OrderManagerStatus
  status?: DbOrderStatus
  managerNote?: string
  paymentStatus?: PaymentStatus
  cancellationStatus?: CancellationStatus
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      managerStatus: true,
      paymentStatus: true,
      cancellationStatus: true,
    },
  })

  if (!order) {
    throw new Error("Order not found")
  }

  const hasCancellationDecision =
    input.cancellationStatus === "approved" || input.cancellationStatus === "rejected"

  if (hasCancellationDecision) {
    if (order.cancellationStatus !== "requested") {
      throw new Error("Запрос на отмену уже неактуален.")
    }

    if (input.cancellationStatus === "approved") {
      if (order.status === "shipped" || order.status === "delivered") {
        throw new Error("Нельзя одобрить отмену для заказа в пути или доставленного заказа.")
      }
    }

    const managerNote = typeof input.managerNote === "string" ? input.managerNote.trim() : ""
    if (input.cancellationStatus === "rejected" && !managerNote) {
      throw new Error("Укажите причину отказа в отмене.")
    }

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        cancellationStatus: input.cancellationStatus,
        cancellationResolvedAt: new Date(),
        ...(input.cancellationStatus === "approved"
          ? {
              status: "cancelled",
            }
          : {}),
        ...(input.cancellationStatus === "rejected"
          ? {
              managerNote,
            }
          : {}),
        managerUpdatedAt: new Date(),
      },
    })
  }

  assertOrderCanBeChanged(order)

  if (order.cancellationStatus === "requested") {
    throw new Error("Сначала обработайте запрос на отмену заказа.")
  }

  const managerNote = typeof input.managerNote === "string" ? input.managerNote.trim() : ""

  if (input.paymentStatus) {
    if (input.paymentStatus === "paid" && order.paymentStatus === "paid") {
      throw new Error("Оплата уже подтверждена.")
    }

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: input.paymentStatus,
        managerUpdatedAt: new Date(),
      },
    })
  }

  if (input.managerStatus === "confirmed" && input.status === undefined) {
    if (order.status !== "pending" || order.managerStatus !== "pending_review") {
      throw new Error("Подтвердить можно только новый заказ, ожидающий проверки.")
    }

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        managerStatus: "confirmed",
        ...(managerNote ? { managerNote } : {}),
        managerUpdatedAt: new Date(),
      },
    })
  }

  if (input.managerStatus === "sent_to_fulfillment" && input.status === "confirmed") {
    if (order.status !== "pending" || order.managerStatus !== "confirmed") {
      throw new Error("Передать в сборку можно только подтвержденный заказ.")
    }

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        status: "confirmed",
        managerStatus: "sent_to_fulfillment",
        ...(managerNote ? { managerNote } : {}),
        managerUpdatedAt: new Date(),
      },
    })
  }

  if (input.managerStatus === "sent_to_fulfillment" && input.status === "shipped") {
    if (order.status !== "confirmed" || order.managerStatus !== "sent_to_fulfillment") {
      throw new Error("Передать в доставку можно только заказ, который уже находится в сборке.")
    }

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        status: "shipped",
        managerStatus: "sent_to_fulfillment",
        ...(managerNote ? { managerNote } : {}),
        managerUpdatedAt: new Date(),
      },
    })
  }

  throw new Error("Недопустимый переход статуса заказа.")
}

export async function confirmOrderReceivedByCustomerInDb(input: {
  userId: string
  orderId: string
}) {
  const dbUserId =
    (await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    }))?.id ??
    (await (async () => {
      const legacyUser = getUserRecordById(input.userId)
      if (!legacyUser) return null
      return ensureDbUserForOrder(legacyUser)
    })())

  if (!dbUserId) {
    throw new Error("Пользователь не найден.")
  }

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      userId: dbUserId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error("Заказ не найден.")
  }

  if (order.status !== "shipped") {
    throw new Error("Только заказ в пути можно подтвердить как полученный.")
  }

  const updated = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      status: "delivered",
      managerUpdatedAt: new Date(),
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  return mapOrderForClient(updated)
}
