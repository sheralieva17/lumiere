import { prisma } from "@/lib/prisma"
import { getProductsByIdsFromDb } from "@/lib/db-products"
import { getUserRecordById, type UserRecord } from "@/lib/mock-store"

async function ensureDbUserForCart(user: UserRecord) {
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

async function resolveDbUserId(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (existing) return existing.id

  const legacyUser = getUserRecordById(userId)
  if (!legacyUser) return null

  return ensureDbUserForCart(legacyUser)
}

async function ensureCartId(dbUserId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId: dbUserId },
    select: { id: true },
  })

  if (existing) return existing.id

  const created = await prisma.cart.create({
    data: {
      user: {
        connect: { id: dbUserId },
      },
    },
    select: { id: true },
  })

  return created.id
}

export async function getCartItemsByUserId(userId: string) {
  const dbUserId = await resolveDbUserId(userId)
  if (!dbUserId) return []

  const cart = await prisma.cart.findUnique({
    where: { userId: dbUserId },
    include: {
      items: {
        select: {
          productId: true,
          quantity: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) return []

  const products = await getProductsByIdsFromDb(
    cart.items.map((item) => item.productId)
  )
  const productMap = new Map(products.map((product) => [product.id, product]))

  return cart.items
    .map((item) => {
      const product = productMap.get(item.productId)
      if (!product) return null
      return {
        product,
        quantity: item.quantity,
      }
    })
    .filter(
      (item): item is { product: (typeof products)[number]; quantity: number } =>
        Boolean(item)
    )
}

export async function addCartItemInDb(input: {
  user: UserRecord
  productId: string
  quantity?: number
}) {
  const dbUserId = await ensureDbUserForCart(input.user)
  const cartId = await ensureCartId(dbUserId)
  const quantityToAdd = Math.max(1, Math.floor(input.quantity ?? 1))

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId: input.productId,
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  })

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantityToAdd,
      },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cart: {
          connect: { id: cartId },
        },
        product: {
          connect: { id: input.productId },
        },
        quantity: quantityToAdd,
      },
    })
  }
}

export async function updateCartItemQuantityInDb(input: {
  user: UserRecord
  productId: string
  quantity: number
}) {
  const dbUserId = await ensureDbUserForCart(input.user)
  const cartId = await ensureCartId(dbUserId)
  const normalizedQuantity = Math.max(0, Math.floor(input.quantity))

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId: input.productId,
      },
    },
    select: { id: true },
  })

  if (!existing) return

  if (normalizedQuantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: existing.id },
    })
    return
  }

  await prisma.cartItem.update({
    where: { id: existing.id },
    data: {
      quantity: normalizedQuantity,
    },
  })
}

export async function removeCartItemInDb(input: {
  user: UserRecord
  productId: string
}) {
  const dbUserId = await ensureDbUserForCart(input.user)
  const cartId = await ensureCartId(dbUserId)

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId: input.productId,
      },
    },
    select: { id: true },
  })

  if (!existing) return

  await prisma.cartItem.delete({
    where: { id: existing.id },
  })
}

export async function clearCartByUserId(userId: string) {
  const dbUserId = await resolveDbUserId(userId)
  if (!dbUserId) return

  const cart = await prisma.cart.findUnique({
    where: { userId: dbUserId },
    select: { id: true },
  })

  if (!cart) return

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  })
}
