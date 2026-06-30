import { products } from "@/lib/products"
import type { RecommendationProfile } from "@/lib/products"

export type UserRole = "customer" | "manager" | "admin"
export type OrderStatus = "processing" | "shipped" | "delivered"
export type PaymentMethod = "mock_card" | "cash_on_delivery" | "bank_transfer"
export type PaymentStatus = "paid" | "pending"
export type OrderManagerStatus =
  | "pending_review"
  | "confirmed"
  | "needs_clarification"
  | "sent_to_fulfillment"
export type ReviewModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "escalated"

const SHIPPING_FEE = 200

export interface UserRecord {
  id: string
  role: UserRole
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  avatarDataUrl: string
  savedAddresses: string[]
  createdAt: string
  hasCompletedQuiz: boolean
  quizResult: RecommendationProfile | null
  quizCompletedAt: string | null
}

export interface OrderItemRecord {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
}

export interface OrderRecord {
  id: string
  userId: string
  createdAt: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingAddress: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  items: OrderItemRecord[]
  managerStatus: OrderManagerStatus
  managerNote: string
  managerUpdatedAt: string | null
}

export interface ReviewRecord {
  id: string
  productId: string
  userId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  moderationStatus: ReviewModerationStatus
  managerReply: string
  escalatedToAdmin: boolean
  managerUpdatedAt: string | null
}

interface StoreData {
  users: UserRecord[]
  sessions: Record<string, string>
  orders: OrderRecord[]
  reviews: ReviewRecord[]
}

const STORE_KEY = "__lumiere_mock_store__"

function getStore(): StoreData {
  const g = globalThis as typeof globalThis & {
    [STORE_KEY]?: StoreData
  }
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      users: [],
      sessions: {},
      orders: [],
      reviews: [],
    }
  }
  if (!Array.isArray(g[STORE_KEY]!.users)) g[STORE_KEY]!.users = []
  if (!g[STORE_KEY]!.sessions || typeof g[STORE_KEY]!.sessions !== "object") {
    g[STORE_KEY]!.sessions = {}
  }
  if (!Array.isArray(g[STORE_KEY]!.orders)) g[STORE_KEY]!.orders = []
  if (!Array.isArray(g[STORE_KEY]!.reviews)) g[STORE_KEY]!.reviews = []
  g[STORE_KEY]!.orders = g[STORE_KEY]!.orders.map((order) => ({
    ...order,
    paymentMethod: order.paymentMethod ?? "mock_card",
    paymentStatus: order.paymentStatus ?? "paid",
    managerStatus: order.managerStatus ?? "pending_review",
    managerNote: order.managerNote ?? "",
    managerUpdatedAt: order.managerUpdatedAt ?? null,
  }))
  g[STORE_KEY]!.reviews = g[STORE_KEY]!.reviews.map((review) => ({
    ...review,
    moderationStatus: review.moderationStatus ?? "pending",
    managerReply: review.managerReply ?? "",
    escalatedToAdmin: review.escalatedToAdmin ?? false,
    managerUpdatedAt: review.managerUpdatedAt ?? null,
  }))
  g[STORE_KEY]!.users = g[STORE_KEY]!.users.map((user) => ({
    ...user,
    role: user.role ?? "customer",
    avatarDataUrl: user.avatarDataUrl ?? "",
    hasCompletedQuiz: user.hasCompletedQuiz ?? false,
    quizResult: user.quizResult ?? null,
    quizCompletedAt: user.quizCompletedAt ?? null,
  }))
  ensureSystemUsers(g[STORE_KEY]!)
  return g[STORE_KEY]!
}

function ensureSystemUsers(store: StoreData) {
  const systemUsers: Array<{
    id: string
    role: UserRole
    firstName: string
    lastName: string
    email: string
    password: string
  }> = [
    {
      id: "usr_admin_demo",
      role: "admin",
      firstName: "System",
      lastName: "Admin",
      email: "admin@lumiere.com",
      password: "admin123",
    },
    {
      id: "usr_manager_demo",
      role: "manager",
      firstName: "Store",
      lastName: "Manager",
      email: "manager@lumiere.com",
      password: "manager123",
    },
  ]

  systemUsers.forEach((systemUser) => {
    const existing = store.users.find((user) => user.email === systemUser.email)
    if (existing) {
      existing.role = systemUser.role
      return
    }
    store.users.push({
      id: systemUser.id,
      role: systemUser.role,
      firstName: systemUser.firstName,
      lastName: systemUser.lastName,
      email: systemUser.email,
      password: systemUser.password,
      phone: "",
      avatarDataUrl: "",
      savedAddresses: [],
      createdAt: new Date().toISOString(),
      hasCompletedQuiz: false,
      quizResult: null,
      quizCompletedAt: null,
    })
  })
}

function toPublicUser(user: UserRecord) {
  return {
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarDataUrl: user.avatarDataUrl,
    savedAddresses: user.savedAddresses,
    hasCompletedQuiz: user.hasCompletedQuiz,
    quizResult: user.quizResult,
    quizCompletedAt: user.quizCompletedAt,
  }
}

function makeToken() {
  return `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function getUserRecordById(userId: string) {
  const store = getStore()
  return store.users.find((user) => user.id === userId) ?? null
}

export function upsertMockUser(user: UserRecord) {
  const store = getStore()
  const existing =
    store.users.find((item) => item.id === user.id) ??
    store.users.find((item) => item.email === user.email)

  if (existing) {
    existing.role = user.role
    existing.firstName = user.firstName
    existing.lastName = user.lastName
    existing.email = user.email
    existing.password = user.password
    existing.phone = user.phone
    existing.avatarDataUrl = user.avatarDataUrl
    existing.savedAddresses = user.savedAddresses
    existing.createdAt = user.createdAt
    existing.hasCompletedQuiz = user.hasCompletedQuiz
    existing.quizResult = user.quizResult
    existing.quizCompletedAt = user.quizCompletedAt
    return existing
  }

  store.users.push(user)
  return user
}

export function createSessionForUser(user: UserRecord) {
  const store = getStore()
  upsertMockUser(user)
  const token = makeToken()
  store.sessions[token] = user.id
  return token
}

export function registerUser(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}) {
  const store = getStore()
  const email = input.email.trim().toLowerCase()

  if (store.users.some((u) => u.email === email)) {
    throw new Error("Этот e-mail уже зарегистрирован.")
  }

  const user: UserRecord = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    role: "customer",
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    password: input.password,
    phone: input.phone?.trim() ?? "",
    avatarDataUrl: "",
    savedAddresses: [],
    createdAt: new Date().toISOString(),
    hasCompletedQuiz: false,
    quizResult: null,
    quizCompletedAt: null,
  }

  store.users.push(user)
  const token = makeToken()
  store.sessions[token] = user.id

  return { token, user: toPublicUser(user) }
}

export function loginUser(input: { email: string; password: string }) {
  const store = getStore()
  const email = input.email.trim().toLowerCase()
  const user = store.users.find((u) => u.email === email)
  if (!user || user.password !== input.password) {
    throw new Error("Неверный e-mail или пароль.")
  }

  const token = makeToken()
  store.sessions[token] = user.id
  return { token, user: toPublicUser(user) }
}

export function getUserByToken(token: string | null) {
  if (!token) return null
  const store = getStore()
  const userId = store.sessions[token]
  if (!userId) return null
  const user = store.users.find((u) => u.id === userId)
  if (!user) return null
  return user
}

export function requireUserRole(user: UserRecord | null, roles: UserRole[]) {
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

export function updateUserProfile(
  userId: string,
  input: {
    firstName: string
    lastName: string
    phone: string
    email: string
    avatarDataUrl?: string
  }
) {
  const store = getStore()
  const user = store.users.find((u) => u.id === userId)
  if (!user) {
    throw new Error("Пользователь не найден.")
  }
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = store.users.find(
    (u) => u.email === normalizedEmail && u.id !== userId
  )
  if (existing) {
    throw new Error("Этот e-mail уже зарегистрирован.")
  }
  user.firstName = input.firstName.trim()
  user.lastName = input.lastName.trim()
  user.phone = input.phone.trim()
  user.email = normalizedEmail
  if (typeof input.avatarDataUrl === "string") {
    user.avatarDataUrl = input.avatarDataUrl
  }
  return toPublicUser(user)
}

export function resolveOrderStatus(createdAt: string): OrderStatus {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageMinutes = ageMs / 60000
  if (ageMinutes >= 4) return "delivered"
  if (ageMinutes >= 2) return "shipped"
  return "processing"
}

export function createOrder(input: {
  userId: string
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: string
  saveAddress: boolean
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
}) {
  const store = getStore()
  const user = store.users.find((u) => u.id === input.userId)
  if (!user) {
    throw new Error("Пользователь не найден.")
  }

  const normalized = input.items
    .map((i) => ({
      product: products.find((p) => p.id === i.productId),
      quantity: i.quantity,
    }))
    .filter((i) => i.product && i.quantity > 0)

  if (normalized.length === 0) {
    throw new Error("В заказе нет корректных товаров.")
  }

  const items: OrderItemRecord[] = normalized.map((i) => ({
    productId: i.product!.id,
    name: i.product!.name,
    image: i.product!.image,
    price: i.product!.price,
    quantity: i.quantity,
  }))

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shipping = SHIPPING_FEE
  const tax = 0
  const total = subtotal + shipping

  const order: OrderRecord = {
    id: `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    shippingAddress: input.shippingAddress.trim(),
    subtotal,
    shipping,
    tax,
    total,
    items,
    managerStatus: "pending_review",
    managerNote: "",
    managerUpdatedAt: null,
  }

  store.orders.unshift(order)

  if (input.saveAddress) {
    const address = input.shippingAddress.trim()
    if (address && !user.savedAddresses.includes(address)) {
      user.savedAddresses.unshift(address)
    }
  }

  return {
    order: {
      ...order,
      status: resolveOrderStatus(order.createdAt),
    },
    user: toPublicUser(user),
  }
}

export function getOrdersByUser(userId: string) {
  const store = getStore()
  return store.orders
    .filter((o) => o.userId === userId)
    .map((o) => ({
      ...o,
      status: resolveOrderStatus(o.createdAt),
    }))
}

export function getPublicUser(user: UserRecord) {
  return toPublicUser(user)
}

export function saveUserQuizResult(
  userId: string,
  profile: RecommendationProfile
) {
  const store = getStore()
  const user = store.users.find((u) => u.id === userId)
  if (!user) throw new Error("Пользователь не найден.")
  if (user.hasCompletedQuiz) {
    throw new Error("Quiz can only be completed once")
  }

  user.quizResult = profile
  user.hasCompletedQuiz = true
  user.quizCompletedAt = new Date().toISOString()
  return toPublicUser(user)
}

function getPublicReviewer(userId: string) {
  const store = getStore()
  const user = store.users.find((u) => u.id === userId)
  if (!user) return "Customer"
  return `${user.firstName} ${user.lastName}`.trim()
}

export function hasPurchasedProduct(userId: string, productId: string) {
  const store = getStore()
  return store.orders.some(
    (order) =>
      order.userId === userId &&
      order.items.some((item) => item.productId === productId)
  )
}

export function createOrUpdateReview(input: {
  userId: string
  productId: string
  rating: number
  comment: string
}) {
  const store = getStore()

  if (!hasPurchasedProduct(input.userId, input.productId)) {
    throw new Error("Оставить отзыв может только пользователь, который действительно купил этот товар.")
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)))
  const now = new Date().toISOString()
  const existing = store.reviews.find(
    (r) => r.userId === input.userId && r.productId === input.productId
  )

  if (existing) {
    existing.rating = rating
    existing.comment = input.comment.trim()
    existing.updatedAt = now
    existing.moderationStatus = "pending"
    existing.escalatedToAdmin = false
    existing.managerReply = ""
    existing.managerUpdatedAt = null
    return existing
  }

  const review: ReviewRecord = {
    id: `rev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    productId: input.productId,
    userId: input.userId,
    rating,
    comment: input.comment.trim(),
    createdAt: now,
    updatedAt: now,
    moderationStatus: "pending",
    managerReply: "",
    escalatedToAdmin: false,
    managerUpdatedAt: null,
  }
  store.reviews.unshift(review)
  return review
}

export function getReviewsByProduct(productId: string) {
  const store = getStore()
  return store.reviews
    .filter((r) => r.productId === productId && r.moderationStatus !== "rejected")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .map((review) => ({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      reviewerName: getPublicReviewer(review.userId),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      verifiedPurchase: true,
      moderationStatus: review.moderationStatus,
      managerReply: review.managerReply,
      escalatedToAdmin: review.escalatedToAdmin,
    }))
}

export function getAllOrdersForManager() {
  const store = getStore()
  return store.orders.map((order) => {
    const user = store.users.find((u) => u.id === order.userId)
    return {
      ...order,
      customerName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
      customerEmail: user?.email ?? "",
      status: resolveOrderStatus(order.createdAt),
    }
  })
}

export function updateOrderByManager(input: {
  orderId: string
  managerStatus: OrderManagerStatus
  managerNote?: string
}) {
  const store = getStore()
  const order = store.orders.find((o) => o.id === input.orderId)
  if (!order) throw new Error("Order not found")
  order.managerStatus = input.managerStatus
  order.managerNote = (input.managerNote ?? "").trim()
  order.managerUpdatedAt = new Date().toISOString()
  return order
}

export function getAllReviewsForManager() {
  const store = getStore()
  return store.reviews
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .map((review) => {
      const user = store.users.find((u) => u.id === review.userId)
      const product = products.find((p) => p.id === review.productId)
      return {
        id: review.id,
        productId: review.productId,
        productName: product?.name ?? review.productId,
        userId: review.userId,
        reviewerName: user
          ? `${user.firstName} ${user.lastName}`.trim()
          : "Customer",
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        verifiedPurchase: true,
        moderationStatus: review.moderationStatus,
        managerReply: review.managerReply,
        escalatedToAdmin: review.escalatedToAdmin,
      }
    })
}

export function updateReviewByManager(input: {
  reviewId: string
  moderationStatus?: ReviewModerationStatus
  managerReply?: string
  escalatedToAdmin?: boolean
}) {
  const store = getStore()
  const review = store.reviews.find((r) => r.id === input.reviewId)
  if (!review) throw new Error("Review not found")

  if (input.moderationStatus) review.moderationStatus = input.moderationStatus
  if (typeof input.managerReply === "string") review.managerReply = input.managerReply.trim()
  if (typeof input.escalatedToAdmin === "boolean") {
    review.escalatedToAdmin = input.escalatedToAdmin
  }
  review.managerUpdatedAt = new Date().toISOString()
  return review
}

export function listAdminProducts() {
  return products.map((product) => ({ ...product }))
}

export function createProductByAdmin(input: {
  name: string
  description: string
  price: number
  image: string
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
}) {
  const id = `${input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${Date.now().toString(36)}`

  const product = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    image: input.image.trim(),
    category: input.category,
    brand: input.brand?.trim() || undefined,
    rating: 0,
    reviews: 0,
  }

  products.unshift(product)
  return product
}

export function updateProductByAdmin(input: {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
}) {
  const product = products.find((item) => item.id === input.id)
  if (!product) throw new Error("Товар не найден.")

  product.name = input.name.trim()
  product.description = input.description.trim()
  product.price = input.price
  product.image = input.image.trim()
  product.category = input.category
  product.brand = input.brand?.trim() || undefined

  return product
}

export function deleteProductByAdmin(id: string) {
  const index = products.findIndex((product) => product.id === id)
  if (index === -1) throw new Error("Товар не найден.")
  const [deleted] = products.splice(index, 1)
  return deleted
}

export function getAdminSalesSummary() {
  const store = getStore()
  const totalOrders = store.orders.length
  const totalRevenue = store.orders.reduce((sum, order) => sum + order.total, 0)
  const totalReviews = store.reviews.length

  const productSales = new Map<string, { name: string; quantity: number }>()
  store.orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSales.get(item.productId) ?? {
        name: item.name,
        quantity: 0,
      }
      current.quantity += item.quantity
      productSales.set(item.productId, current)
    })
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
    totalRevenue,
    totalReviews,
    totalProducts: products.length,
    topProducts,
  }
}
