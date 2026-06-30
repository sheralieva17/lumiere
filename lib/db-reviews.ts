import { prisma } from "@/lib/prisma"
import {
  type ReviewModerationStatus,
  type UserRecord,
} from "@/lib/mock-store"
import { getProduct } from "@/lib/products"

async function ensureDbUser(user: UserRecord) {
  const displayEmail =
    user.email?.trim().toLowerCase() ||
    `${user.id}@lumiere.local`

  const existingById = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  })

  if (existingById) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: displayEmail,
        password: user.password,
        phone: user.phone || "",
        avatarUrl: user.avatarDataUrl || null,
        role: user.role,
      },
    })
    return user.id
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: displayEmail },
    select: { id: true },
  })

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        phone: user.phone || "",
        avatarUrl: user.avatarDataUrl || null,
        role: user.role,
      },
    })
    return existingByEmail.id
  }

  const createdUser = await prisma.user.create({
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: displayEmail,
      password: user.password,
      phone: user.phone || "",
      avatarUrl: user.avatarDataUrl || null,
      role: user.role,
    },
    select: { id: true },
  })

  return createdUser.id
}

async function hasPurchasedProductInDb(userId: string, productId: string) {
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
      },
    },
    select: { id: true },
  })

  return Boolean(orderItem)
}

export async function createOrUpdateReviewInDb(input: {
  user: UserRecord
  productId: string
  rating: number
  comment: string
}) {
  const dbUserId = await ensureDbUser(input.user)

  if (!(await hasPurchasedProductInDb(dbUserId, input.productId))) {
    throw new Error("Оставить отзыв может только пользователь, который действительно купил этот товар.")
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)))
  const now = new Date()

  return prisma.review.upsert({
    where: {
      userId_productId: {
        userId: dbUserId,
        productId: input.productId,
      },
    },
    update: {
      rating,
      comment: input.comment.trim(),
      updatedAt: now,
      moderationStatus: "pending",
      escalatedToAdmin: false,
      managerReply: "",
      managerUpdatedAt: null,
    },
    create: {
      userId: dbUserId,
      productId: input.productId,
      rating,
      comment: input.comment.trim(),
      createdAt: now,
      updatedAt: now,
      moderationStatus: "pending",
      escalatedToAdmin: false,
      managerReply: "",
      managerUpdatedAt: null,
    },
  })
}

export async function getReviewsByProductFromDb(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      moderationStatus: { not: "rejected" },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return reviews.map((review) => ({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    reviewerName: `${review.user.firstName} ${review.user.lastName}`.trim() || "Customer",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    verifiedPurchase: true,
    moderationStatus: review.moderationStatus,
    managerReply: review.managerReply,
    escalatedToAdmin: review.escalatedToAdmin,
  }))
}

export async function getAllReviewsForManagerFromDb() {
  const reviews = await prisma.review.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return reviews.map((review) => ({
    id: review.id,
    productId: review.productId,
    productName: review.product.name ?? getProduct(review.productId)?.name ?? review.productId,
    userId: review.userId,
    reviewerName: `${review.user.firstName} ${review.user.lastName}`.trim() || "Customer",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    verifiedPurchase: true,
    moderationStatus: review.moderationStatus,
    managerReply: review.managerReply,
    escalatedToAdmin: review.escalatedToAdmin,
  }))
}

export async function updateReviewByManagerInDb(input: {
  reviewId: string
  moderationStatus?: ReviewModerationStatus
  managerReply?: string
  escalatedToAdmin?: boolean
}) {
  return prisma.review.update({
    where: { id: input.reviewId },
    data: {
      ...(input.moderationStatus
        ? { moderationStatus: input.moderationStatus }
        : {}),
      ...(typeof input.managerReply === "string"
        ? { managerReply: input.managerReply.trim() }
        : {}),
      ...(typeof input.escalatedToAdmin === "boolean"
        ? { escalatedToAdmin: input.escalatedToAdmin }
        : {}),
      managerUpdatedAt: new Date(),
    },
  })
}
