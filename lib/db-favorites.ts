import { prisma } from "@/lib/prisma"
import { getProductsByIdsFromDb } from "@/lib/db-products"
import { getUserRecordById, type UserRecord } from "@/lib/mock-store"

async function ensureDbUserForFavorites(user: UserRecord) {
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

  return ensureDbUserForFavorites(legacyUser)
}

export async function getFavoriteProductsByUserId(userId: string) {
  const dbUserId = await resolveDbUserId(userId)
  if (!dbUserId) return []

  const favorites = await prisma.favorite.findMany({
    where: { userId: dbUserId },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      productId: true,
    },
  })

  return getProductsByIdsFromDb(favorites.map((favorite) => favorite.productId))
}

export async function toggleFavoriteInDb(input: {
  user: UserRecord
  productId: string
}) {
  const dbUserId = await ensureDbUserForFavorites(input.user)

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: dbUserId,
        productId: input.productId,
      },
    },
    select: { id: true },
  })

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    })
    return { isFavorite: false }
  }

  await prisma.favorite.create({
    data: {
      user: {
        connect: { id: dbUserId },
      },
      product: {
        connect: { id: input.productId },
      },
    },
  })

  return { isFavorite: true }
}

export async function clearFavoritesByUserId(userId: string) {
  const dbUserId = await resolveDbUserId(userId)
  if (!dbUserId) return

  await prisma.favorite.deleteMany({
    where: { userId: dbUserId },
  })
}
