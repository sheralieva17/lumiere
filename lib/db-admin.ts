import { normalizeBrandName } from "@/lib/brand-normalization"
import { prisma } from "@/lib/prisma"
import {
  getManagerDailyReportByDateFromDb,
  listManagerDailyReportsFromDb,
} from "@/lib/db-manager-reports"

type AdminCategory = "skincare" | "makeup" | "fragrance" | "haircare"

type AdminProductListParams = {
  page?: number
  pageSize?: number
  search?: string
  category?: AdminCategory | "all"
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "stock_desc" | "stock_asc"
}

type AdminProductInput = {
  name: string
  description: string
  price: number
  stock: number
  image: string
  gallery: string[]
  category: AdminCategory
  brand?: string
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function mapAdminProduct(product: {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
  gallery: string[]
  category: { slug: string }
  brand: { name: string }
}) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    image: product.image,
    gallery: product.gallery,
    category: product.category.slug as AdminCategory,
    brand: product.brand.name,
  }
}

async function ensureCategoryId(slug: AdminCategory) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!category) {
    throw new Error("Категория не найдена.")
  }

  return category.id
}

async function ensureBrandId(name?: string) {
  const normalizedName = normalizeBrandName(name)

  if (!normalizedName) {
    const fallback = await prisma.brand.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })

    if (!fallback) {
      throw new Error("В системе пока нет ни одного бренда.")
    }

    return fallback.id
  }

  const existing = await prisma.brand.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  if (existing) return existing.id

  const created = await prisma.brand.create({
    data: {
      name: normalizedName,
      slug: slugify(normalizedName),
    },
    select: { id: true },
  })

  return created.id
}

export async function listProductsForAdminFromDb() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { slug: true } },
      brand: { select: { name: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return products.map(mapAdminProduct)
}

export async function listProductsForAdminPagedFromDb(
  input: AdminProductListParams = {}
) {
  const pageSize = Math.min(Math.max(input.pageSize ?? 10, 1), 20)
  const page = Math.max(input.page ?? 1, 1)
  const search = input.search?.trim() ?? ""
  const category = input.category ?? "all"
  const sort = input.sort ?? "newest"

  const where = {
    ...(category !== "all"
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  const orderBy =
    sort === "oldest"
      ? [{ createdAt: "asc" as const }]
      : sort === "price_asc"
        ? [{ price: "asc" as const }, { createdAt: "desc" as const }]
        : sort === "price_desc"
          ? [{ price: "desc" as const }, { createdAt: "desc" as const }]
          : sort === "stock_desc"
            ? [{ stock: "desc" as const }, { createdAt: "desc" as const }]
            : sort === "stock_asc"
              ? [{ stock: "asc" as const }, { createdAt: "desc" as const }]
              : [{ createdAt: "desc" as const }]

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: { select: { slug: true } },
        brand: { select: { name: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  if (safePage !== page) {
    return listProductsForAdminPagedFromDb({
      page: safePage,
      pageSize,
      search,
      category,
      sort,
    })
  }

  return {
    products: products.map(mapAdminProduct),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

export async function createProductByAdminInDb(input: AdminProductInput) {
  const categoryId = await ensureCategoryId(input.category)
  const brandId = await ensureBrandId(input.brand)
  const idBase = slugify(input.name)

  const created = await prisma.product.create({
    data: {
      id: `${idBase}-${Date.now().toString(36)}`,
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      stock: Math.max(0, Math.floor(input.stock)),
      image: input.image.trim(),
      gallery: input.gallery.map((item) => item.trim()).filter(Boolean),
      category: {
        connect: { id: categoryId },
      },
      brand: {
        connect: { id: brandId },
      },
    },
    include: {
      category: { select: { slug: true } },
      brand: { select: { name: true } },
    },
  })

  return mapAdminProduct(created)
}

export async function updateProductByAdminInDb(
  input: AdminProductInput & { id: string }
) {
  const categoryId = await ensureCategoryId(input.category)
  const brandId = await ensureBrandId(input.brand)

  const updated = await prisma.product.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      stock: Math.max(0, Math.floor(input.stock)),
      image: input.image.trim(),
      gallery: input.gallery.map((item) => item.trim()).filter(Boolean),
      category: {
        connect: { id: categoryId },
      },
      brand: {
        connect: { id: brandId },
      },
    },
    include: {
      category: { select: { slug: true } },
      brand: { select: { name: true } },
    },
  })

  return mapAdminProduct(updated)
}

export async function deleteProductByAdminInDb(id: string) {
  const usage = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
  })

  if (!usage) {
    throw new Error("Товар не найден.")
  }

  if (usage._count.orderItems > 0 || usage._count.reviews > 0) {
    throw new Error("Нельзя удалить товар, у которого уже есть заказы или отзывы.")
  }

  return prisma.product.delete({
    where: { id },
  })
}

export async function getAdminDashboardSummaryFromDb() {
  const [totalOrders, revenue, totalReviews, totalProducts, topOrderItems] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.review.count(),
      prisma.product.count(),
      prisma.orderItem.findMany({
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

  const productSales = new Map<string, { name: string; quantity: number }>()

  topOrderItems.forEach((item) => {
    const current = productSales.get(item.productId) ?? {
      name: item.product.name,
      quantity: 0,
    }
    current.quantity += item.quantity
    productSales.set(item.productId, current)
  })

  const topProducts = Array.from(productSales.entries())
    .map(([productId, value]) => ({
      productId,
      name: value.name,
      quantity: value.quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    totalOrders,
    totalRevenue: revenue._sum.totalAmount ?? 0,
    totalReviews,
    totalProducts,
    topProducts,
  }
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = startOfDay(date)
  next.setDate(next.getDate() + 1)
  return next
}

function parseReportDateKey(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim())
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
}

export async function getAdminReportsAnalyticsFromDb(input?: {
  from?: string | null
  to?: string | null
}) {
  const fromDate = input?.from ? parseReportDateKey(input.from) : null
  const toDate = input?.to ? parseReportDateKey(input.to) : null

  if (input?.from && !fromDate) {
    throw new Error("Неверный формат начальной даты.")
  }

  if (input?.to && !toDate) {
    throw new Error("Неверный формат конечной даты.")
  }

  const from = fromDate ? startOfDay(fromDate) : undefined
  const to = toDate ? endOfDay(toDate) : undefined

  if (from && to && from >= to) {
    throw new Error("Начальная дата не может быть позже конечной.")
  }

  const reportRange =
    from || to
      ? {
          reportDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
          },
        }
      : undefined

  const orderRange =
    from || to
      ? {
          managerUpdatedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
          },
        }
      : undefined

  const [reports, deliveredCount, cancelledCount, revenueAggregate, deliveredItems] =
    await Promise.all([
      listManagerDailyReportsFromDb(input),
      prisma.order.count({
        where: {
          status: "delivered",
          ...(orderRange ?? {}),
        },
      }),
      prisma.order.count({
        where: {
          status: "cancelled",
          ...(orderRange ?? {}),
        },
      }),
      prisma.order.aggregate({
        where: {
          status: "delivered",
          ...(orderRange ?? {}),
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            status: "delivered",
            ...(orderRange ?? {}),
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ])

  const productStatsMap = new Map<
    string,
    { productId: string; name: string; quantity: number; revenue: number }
  >()

  deliveredItems.forEach((item) => {
    const current = productStatsMap.get(item.productId) ?? {
      productId: item.productId,
      name: item.product.name,
      quantity: 0,
      revenue: 0,
    }

    current.quantity += item.quantity
    current.revenue += item.price * item.quantity
    productStatsMap.set(item.productId, current)
  })

  const topProducts = Array.from(productStatsMap.values())
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5)

  return {
    reports,
    summary: {
      reportsCount: reports.length,
      deliveredOrdersCount: deliveredCount,
      cancelledOrdersCount: cancelledCount,
      deliveredRevenue: revenueAggregate._sum.totalAmount ?? 0,
      topProducts,
    },
  }
}

export { listManagerDailyReportsFromDb, getManagerDailyReportByDateFromDb }
