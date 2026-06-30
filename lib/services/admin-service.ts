import {
  createProductByAdminInDb,
  deleteProductByAdminInDb,
  getAdminReportsAnalyticsFromDb,
  getAdminDashboardSummaryFromDb,
  getManagerDailyReportByDateFromDb,
  listProductsForAdminPagedFromDb,
  listManagerDailyReportsFromDb,
  updateProductByAdminInDb,
} from "@/lib/db-admin"

export async function listProductsForAdmin(input?: {
  page?: number
  pageSize?: number
  search?: string
  category?: "skincare" | "makeup" | "fragrance" | "haircare" | "all"
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "stock_desc" | "stock_asc"
}) {
  return listProductsForAdminPagedFromDb(input)
}

export async function createAdminProduct(input: {
  name: string
  description: string
  price: number
  stock: number
  image: string
  gallery: string[]
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
}) {
  return createProductByAdminInDb(input)
}

export async function updateAdminProduct(input: {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
  gallery: string[]
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
}) {
  return updateProductByAdminInDb(input)
}

export async function deleteAdminProduct(id: string) {
  return deleteProductByAdminInDb(id)
}

export async function getAdminDashboardSummary() {
  return getAdminDashboardSummaryFromDb()
}

export async function listAdminReports(input?: {
  from?: string | null
  to?: string | null
}) {
  return listManagerDailyReportsFromDb(input)
}

export async function getAdminReportByDate(date: string) {
  return getManagerDailyReportByDateFromDb(date)
}

export async function getAdminReportsAnalytics(input?: {
  from?: string | null
  to?: string | null
}) {
  return getAdminReportsAnalyticsFromDb(input)
}
