import {
  type OrderManagerStatus,
  type PaymentStatus,
  type ReviewModerationStatus,
} from "@/lib/mock-store"
import {
  getAllOrdersForManagerFromDb,
  updateOrderByManagerInDb,
} from "@/lib/db-orders"
import {
  getAllReviewsForManagerFromDb,
  updateReviewByManagerInDb,
} from "@/lib/db-reviews"

export async function listManagerOrders() {
  return getAllOrdersForManagerFromDb()
}

export async function listManagerOrdersByView(input?: {
  view?: "active" | "delivered" | "cancelled"
  search?: string
}) {
  return getAllOrdersForManagerFromDb(input)
}

export async function changeOrderManagerStatus(input: {
  orderId: string
  managerStatus?: OrderManagerStatus
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  managerNote?: string
  paymentStatus?: PaymentStatus
  cancellationStatus?: "none" | "requested" | "approved" | "rejected"
}) {
  return updateOrderByManagerInDb(input)
}

export async function listManagerReviews() {
  return getAllReviewsForManagerFromDb()
}

export async function moderateReview(input: {
  reviewId: string
  moderationStatus?: ReviewModerationStatus
  managerReply?: string
  escalatedToAdmin?: boolean
}) {
  return updateReviewByManagerInDb(input)
}
