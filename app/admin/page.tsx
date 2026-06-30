"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { clearAuthToken, getAuthToken } from "@/lib/client-auth"
import { formatSom } from "@/lib/format"

type AdminUser = {
  id: string
  role: "customer" | "manager" | "admin"
  firstName: string
  lastName: string
}

type AdminProduct = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
  gallery: string[]
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
}

type AdminProductListResponse = {
  products: AdminProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type AdminSummary = {
  totalOrders: number
  totalRevenue: number
  totalReviews: number
  totalProducts: number
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
  }>
}

type AdminManagerReport = {
  id: string
  reportDate: string
  deliveredOrdersCount: number
  cancelledOrdersCount: number
  deliveredRevenue: number
  comment: string
  managerId: string
  managerName: string
  createdAt: string
  updatedAt: string
}

type AdminReportsSummary = {
  reportsCount: number
  deliveredOrdersCount: number
  cancelledOrdersCount: number
  deliveredRevenue: number
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
}

const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  stock: "0",
  image: "/images/product-serum.jpg",
  category: "skincare" as AdminProduct["category"],
  brand: "",
}

const categoryOptions = [
  { value: "all", label: "Все категории" },
  { value: "makeup", label: "Макияж" },
  { value: "skincare", label: "Уход" },
  { value: "haircare", label: "Волосы" },
  { value: "fragrance", label: "Ароматы" },
] as const

const sortOptions = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "price_asc", label: "Цена: по возрастанию" },
  { value: "price_desc", label: "Цена: по убыванию" },
  { value: "stock_desc", label: "Остаток: больше сначала" },
  { value: "stock_asc", label: "Остаток: меньше сначала" },
] as const

function formatReportDateKey(dateString: string) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatPrettyDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatMoney(value: number) {
  return formatSom(value)
}

function truncateText(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productsPage, setProductsPage] = useState(1)
  const [productsTotalPages, setProductsTotalPages] = useState(1)
  const [productsTotal, setProductsTotal] = useState(0)
  const [productsSearchInput, setProductsSearchInput] = useState("")
  const [productsSearch, setProductsSearch] = useState("")
  const [productsCategory, setProductsCategory] = useState<
    "all" | AdminProduct["category"]
  >("all")
  const [productsSort, setProductsSort] = useState<
    "newest" | "oldest" | "price_asc" | "price_desc" | "stock_desc" | "stock_asc"
  >("newest")
  const [productsLoading, setProductsLoading] = useState(false)
  const [reports, setReports] = useState<AdminManagerReport[]>([])
  const [selectedReport, setSelectedReport] = useState<AdminManagerReport | null>(null)
  const [selectedReportDate, setSelectedReportDate] = useState("")
  const [reportsSummary, setReportsSummary] = useState<AdminReportsSummary | null>(null)
  const [reportsDateFrom, setReportsDateFrom] = useState("")
  const [reportsDateTo, setReportsDateTo] = useState("")
  const [showReports, setShowReports] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsExporting, setReportsExporting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [error, setError] = useState("")
  const mainImageInputRef = useRef<HTMLInputElement | null>(null)

  async function loadProducts(params?: {
    page?: number
    search?: string
    category?: "all" | AdminProduct["category"]
    sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "stock_desc" | "stock_asc"
  }) {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Войдите как администратор, чтобы загрузить каталог.")
    }

    const page = params?.page ?? productsPage
    const search = params?.search ?? productsSearch
    const category = params?.category ?? productsCategory
    const sort = params?.sort ?? productsSort

    setProductsLoading(true)
    try {
      const url = new URL("/api/admin/products", window.location.origin)
      url.searchParams.set("page", String(page))
      if (search) {
        url.searchParams.set("search", search)
      }
      if (category !== "all") {
        url.searchParams.set("category", category)
      }
      url.searchParams.set("sort", sort)

      const productsRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const productsData = (await productsRes.json()) as Partial<AdminProductListResponse> & {
        error?: string
      }

      if (!productsRes.ok) {
        throw new Error(productsData.error || "Не удалось загрузить товары")
      }

      setProducts(productsData.products ?? [])
      setProductsPage(productsData.page ?? 1)
      setProductsTotalPages(productsData.totalPages ?? 1)
      setProductsTotal(productsData.total ?? 0)
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadAdminData() {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      setError("Войдите как администратор, чтобы открыть эту страницу.")
      return
    }

    try {
      const [accountRes, summaryRes] = await Promise.all([
        fetch("/api/account", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const accountData = await accountRes.json()
      const summaryData = await summaryRes.json()

      if (accountRes.status === 401) {
        clearAuthToken()
        throw new Error("Войдите как администратор, чтобы открыть эту страницу.")
      }
      if (!accountRes.ok) throw new Error(accountData.error || "Не удалось загрузить аккаунт")

      if (accountData.user.role !== "admin") {
        throw new Error("Эта страница доступна только администратору.")
      }

      if (!summaryRes.ok) throw new Error(summaryData.error || "Не удалось загрузить сводку")

      setUser(accountData.user)
      setSummary(summaryData.summary)
      await loadProducts({ page: 1, search: "", category: "all", sort: "newest" })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить админ-панель")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
  }, [])

  useEffect(() => {
    if (!loading && user?.role === "admin") {
      void loadProducts({
        page: productsPage,
        search: productsSearch,
        category: productsCategory,
        sort: productsSort,
      }).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить товары")
      })
    }
  }, [productsPage, productsSearch, productsCategory, productsSort])

  useEffect(() => {
    if (loading || !user || productsSearchInput === productsSearch) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setProductsPage(1)
      setProductsSearch(productsSearchInput.trim())
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [productsSearchInput, productsSearch, loading, user])

  async function loadReports(
    date?: string,
    range?: {
      from?: string
      to?: string
    }
  ) {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как администратор, чтобы просматривать отчеты.")
      return
    }

    setReportsLoading(true)
    setError("")
    try {
      const url = new URL("/api/admin/reports", window.location.origin)
      const from = range?.from ?? reportsDateFrom
      const to = range?.to ?? reportsDateTo

      if (date) {
        url.searchParams.set("date", date)
      }
      if (from) {
        url.searchParams.set("from", from)
      }
      if (to) {
        url.searchParams.set("to", to)
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as {
        reports?: AdminManagerReport[]
        report?: AdminManagerReport | null
        summary?: AdminReportsSummary
        error?: string
      }
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить отчеты")

      const nextReports = data.reports ?? []
      setReports(nextReports)
      setReportsSummary(
        data.summary ?? {
          reportsCount: 0,
          deliveredOrdersCount: 0,
          cancelledOrdersCount: 0,
          deliveredRevenue: 0,
          topProducts: [],
        }
      )

      if (date) {
        setSelectedReportDate(date)
        setSelectedReport(data.report ?? null)
      } else if (nextReports[0]) {
        const firstReport = nextReports[0]
        setSelectedReportDate(formatReportDateKey(String(firstReport.reportDate)))
        setSelectedReport(firstReport)
      } else {
        setSelectedReportDate("")
        setSelectedReport(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить отчеты")
    } finally {
      setReportsLoading(false)
    }
  }

  async function exportReportsCsv() {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как администратор, чтобы экспортировать отчеты.")
      return
    }

    setReportsExporting(true)
    setError("")
    try {
      const url = new URL("/api/admin/reports", window.location.origin)
      url.searchParams.set("export", "csv")
      if (reportsDateFrom) {
        url.searchParams.set("from", reportsDateFrom)
      }
      if (reportsDateTo) {
        url.searchParams.set("to", reportsDateTo)
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Не удалось выгрузить отчеты")
      }

      const blob = await res.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = reportsDateFrom || reportsDateTo
        ? `manager-reports-${reportsDateFrom || "start"}-${reportsDateTo || "end"}.csv`
        : "manager-reports.csv"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Не удалось выгрузить отчеты")
    } finally {
      setReportsExporting(false)
    }
  }

  async function exportReportsExcel() {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как администратор, чтобы экспортировать отчеты.")
      return
    }

    setReportsExporting(true)
    setError("")
    try {
      const url = new URL("/api/admin/reports", window.location.origin)
      url.searchParams.set("export", "xls")
      if (reportsDateFrom) {
        url.searchParams.set("from", reportsDateFrom)
      }
      if (reportsDateTo) {
        url.searchParams.set("to", reportsDateTo)
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Не удалось выгрузить Excel-файл")
      }

      const blob = await res.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = reportsDateFrom || reportsDateTo
        ? `manager-reports-${reportsDateFrom || "start"}-${reportsDateTo || "end"}.xls`
        : "manager-reports.xls"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Не удалось выгрузить Excel-файл"
      )
    } finally {
      setReportsExporting(false)
    }
  }

  function printSelectedReport() {
    if (!selectedReport) return

    const reportDate = formatPrettyDate(String(selectedReport.reportDate))
    const printedAt = new Date(selectedReport.updatedAt).toLocaleString("ru-RU")
    const printWindow = window.open("", "_blank", "width=900,height=700")

    if (!printWindow) {
      setError("Не удалось открыть окно печати. Разрешите всплывающие окна в браузере.")
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Отчет менеджера за ${reportDate}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #222; }
      h1 { font-size: 28px; margin-bottom: 8px; }
      .muted { color: #666; font-size: 14px; margin-bottom: 24px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
      .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #777; }
      .value { margin-top: 10px; font-size: 24px; font-weight: 700; }
      .comment { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-top: 20px; }
      .comment p { white-space: pre-wrap; line-height: 1.5; }
    </style>
  </head>
  <body>
    <h1>Отчет менеджера за ${reportDate}</h1>
    <div class="muted">
      <div>Менеджер: ${selectedReport.managerName}</div>
      <div>Отправлен: ${printedAt}</div>
    </div>
    <div class="grid">
      <div class="card">
        <div class="label">Доставлено</div>
        <div class="value">${selectedReport.deliveredOrdersCount}</div>
      </div>
      <div class="card">
        <div class="label">Отменено</div>
        <div class="value">${selectedReport.cancelledOrdersCount}</div>
      </div>
      <div class="card">
        <div class="label">Выручка</div>
        <div class="value">${formatMoney(selectedReport.deliveredRevenue)}</div>
      </div>
    </div>
    <div class="comment">
      <div class="label">Комментарий к смене</div>
      <p>${(selectedReport.comment || "Комментарий не был указан.").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    </div>
  </body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  function startEdit(product: AdminProduct) {
    setForm({
      id: product.id ?? "",
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      image: product.image ?? "",
      category: product.category ?? "skincare",
      brand: product.brand ?? "",
    })
    setError("")
  }

  async function uploadFiles(files: FileList | null) {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Войдите как администратор, чтобы загружать изображения.")
    }

    if (!files || files.length === 0) {
      throw new Error("Выберите хотя бы одно изображение.")
    }

    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append("files", file))

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Не удалось загрузить изображения")
    }

    return (data.paths ?? []) as string[]
  }

  async function handleMainImageUpload(files: FileList | null) {
    setError("")
    setUploadingMainImage(true)
    try {
      const paths = await uploadFiles(files)
      if (paths[0]) {
        setForm((prev) => ({ ...prev, image: paths[0] }))
      }
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = ""
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить изображение")
    } finally {
      setUploadingMainImage(false)
    }
  }

  async function saveProduct() {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как администратор, чтобы сохранить изменения.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          image: form.image,
          gallery: [],
          category: form.category,
          brand: form.brand,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить товар")

      setForm(emptyForm)
      await loadAdminData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить товар")
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(id: string) {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как администратор, чтобы удалить товар.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось удалить товар")

      if (form.id === id) {
        setForm(emptyForm)
      }
      await loadAdminData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить товар")
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    clearAuthToken()
    router.push("/account")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">Панель управления</p>
            <h1 className="font-serif text-3xl tracking-tight text-foreground lg:text-4xl">
              Панель администратора
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Управляйте товарами и просматривайте сводную статистику магазина.
            </p>
            {user ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Выполнен вход: {user.firstName} {user.lastName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const nextValue = !showReports
                setShowReports(nextValue)
                if (nextValue) {
                  void loadReports(selectedReportDate || undefined)
                }
              }}
            >
              {showReports ? "Скрыть отчеты" : "Смотреть отчеты"}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mb-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка панели администратора...</p>
        ) : (
          <>
            {showReports ? (
              <section className="mb-8 rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl tracking-tight text-foreground">
                      Отчеты менеджера
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Просматривайте отчеты по дням, фильтруйте диапазон дат и выгружайте сводку в CSV или Excel.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {reportsLoading ? (
                      <p className="text-sm text-muted-foreground">Загрузка отчетов...</p>
                    ) : null}
                    <Button
                      variant="outline"
                      onClick={() => void exportReportsCsv()}
                      disabled={reportsExporting || reportsLoading}
                    >
                      {reportsExporting ? "Подготовка CSV..." : "Экспорт CSV"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void exportReportsExcel()}
                      disabled={reportsExporting || reportsLoading}
                    >
                      {reportsExporting ? "Подготовка Excel..." : "Экспорт Excel"}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-xl border border-border bg-background p-4 lg:grid-cols-[1fr_1fr_auto_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="reports-date-from">Дата от</Label>
                    <Input
                      id="reports-date-from"
                      type="date"
                      value={reportsDateFrom}
                      onChange={(e) => setReportsDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reports-date-to">Дата до</Label>
                    <Input
                      id="reports-date-to"
                      type="date"
                      value={reportsDateTo}
                      onChange={(e) => setReportsDateTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto"
                      onClick={() => {
                        setSelectedReport(null)
                        setSelectedReportDate("")
                        void loadReports(undefined)
                      }}
                    >
                      Показать
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto"
                      onClick={() => {
                        setReportsDateFrom("")
                        setReportsDateTo("")
                        setSelectedReport(null)
                        setSelectedReportDate("")
                        void loadReports(undefined, { from: "", to: "" })
                      }}
                    >
                      Сбросить период
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Отчетов в периоде
                    </p>
                    <p className="mt-3 font-serif text-3xl text-foreground">
                      {reportsSummary?.reportsCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Доставлено
                    </p>
                    <p className="mt-3 font-serif text-3xl text-foreground">
                      {reportsSummary?.deliveredOrdersCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Отменено
                    </p>
                    <p className="mt-3 font-serif text-3xl text-foreground">
                      {reportsSummary?.cancelledOrdersCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Выручка периода
                    </p>
                    <p className="mt-3 font-serif text-3xl text-foreground">
                      {formatMoney(reportsSummary?.deliveredRevenue ?? 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Выручка по дням</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Небольшой график по сохраненным отчетам в выбранном периоде.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    {reports.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {(() => {
                          const maxRevenue = Math.max(
                            ...reports.map((report) => report.deliveredRevenue),
                            1
                          )

                          return reports.map((report) => {
                            const revenue = report.deliveredRevenue
                            const heightPercent = Math.max(
                              10,
                              Math.round((revenue / maxRevenue) * 100)
                            )

                            return (
                              <div
                                key={`chart-${report.id}`}
                                className="rounded-lg border border-border bg-card p-4"
                              >
                                <div className="flex items-end gap-4">
                                  <div className="flex h-28 w-12 items-end rounded-md bg-muted/30 p-1">
                                    <div
                                      className="w-full rounded bg-emerald-500 transition-all"
                                      style={{ height: `${heightPercent}%` }}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                      {formatPrettyDate(String(report.reportDate))}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Доставлено: {report.deliveredOrdersCount}
                                    </p>
                                    <p className="mt-2 text-sm text-foreground">
                                      {formatMoney(revenue)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Нет данных для построения графика за выбранный период.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Отмены по дням</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        График показывает, сколько заказов было отменено в каждый день.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    {reports.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {(() => {
                          const maxCancelled = Math.max(
                            ...reports.map((report) => report.cancelledOrdersCount),
                            1
                          )

                          return reports.map((report) => {
                            const cancelled = report.cancelledOrdersCount
                            const heightPercent = Math.max(
                              cancelled > 0 ? 14 : 10,
                              Math.round((cancelled / maxCancelled) * 100)
                            )

                            return (
                              <div
                                key={`cancel-chart-${report.id}`}
                                className="rounded-lg border border-border bg-card p-4"
                              >
                                <div className="flex items-end gap-4">
                                  <div className="flex h-28 w-12 items-end rounded-md bg-muted/30 p-1">
                                    <div
                                      className="w-full rounded bg-rose-500 transition-all"
                                      style={{ height: `${heightPercent}%` }}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                      {formatPrettyDate(String(report.reportDate))}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Отменено: {cancelled}
                                    </p>
                                    <p className="mt-2 text-sm text-foreground">
                                      Выручка: {formatMoney(report.deliveredRevenue)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Нет данных по отменам за выбранный период.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">Отчеты по датам</p>
                      <span className="text-xs text-muted-foreground">
                        {reports.length} шт.
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {reports.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Отчетов за выбранный период пока нет.</p>
                      ) : (
                        reports.map((report) => {
                          const dateLabel = formatReportDateKey(String(report.reportDate))
                          const isActive = selectedReportDate === dateLabel
                          return (
                            <button
                              key={report.id}
                              type="button"
                              onClick={() => void loadReports(dateLabel)}
                              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                isActive
                                  ? "border-foreground bg-card"
                                  : "border-border bg-card hover:border-foreground/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {formatPrettyDate(String(report.reportDate))}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Менеджер: {report.managerName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-foreground">
                                    {formatMoney(report.deliveredRevenue)}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Доставлено: {report.deliveredOrdersCount}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {selectedReport ? (
                      <div className="rounded-xl border border-border bg-background p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Отчет за {formatPrettyDate(String(selectedReport.reportDate))}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Менеджер: {selectedReport.managerName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Отправлен: {new Date(selectedReport.updatedAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                          <div className="grid gap-2 text-right sm:grid-cols-3 sm:text-left">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Доставлено
                              </p>
                              <p className="mt-2 text-xl font-semibold text-foreground">
                                {selectedReport.deliveredOrdersCount}
                              </p>
                            </div>
                            <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Отменено
                              </p>
                              <p className="mt-2 text-xl font-semibold text-foreground">
                                {selectedReport.cancelledOrdersCount}
                              </p>
                            </div>
                            <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Выручка
                              </p>
                              <p className="mt-2 text-xl font-semibold text-foreground">
                                {formatMoney(selectedReport.deliveredRevenue)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" onClick={printSelectedReport}>
                            Печать отчета
                          </Button>
                        </div>
                        <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Комментарий к смене
                          </p>
                          <p className="mt-2 text-sm text-foreground">
                            {selectedReport.comment || "Комментарий не был указан."}
                          </p>
                        </div>
                      </div>
                    ) : reports.length > 0 && !reportsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Выберите дату слева, чтобы открыть сохраненный отчет.
                      </p>
                    ) : null}

                    <div className="rounded-xl border border-border bg-background p-5">
                      <p className="text-sm font-medium text-foreground">
                        Статистика по товарам за выбранный период
                      </p>
                      <div className="mt-4 space-y-3">
                        {reportsSummary?.topProducts?.length ? (
                          reportsSummary.topProducts.map((product, index) => (
                            <div
                              key={product.productId}
                              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  Топ {index + 1}
                                </p>
                                <p className="mt-1 truncate text-sm font-medium text-foreground">
                                  {product.name}
                                </p>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <p>Продано: {product.quantity}</p>
                                <p className="mt-1 text-foreground">
                                  {formatMoney(product.revenue)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            За выбранный период еще нет доставленных товаров для статистики.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Всего заказов
                </p>
                <p className="mt-3 font-serif text-3xl text-foreground">
                  {summary?.totalOrders ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Выручка
                </p>
                <p className="mt-3 font-serif text-3xl text-foreground">
                  {formatMoney(summary?.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Отзывы
                </p>
                <p className="mt-3 font-serif text-3xl text-foreground">
                  {summary?.totalReviews ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Товары
                </p>
                <p className="mt-3 font-serif text-3xl text-foreground">
                  {summary?.totalProducts ?? 0}
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl tracking-tight text-foreground">
                  {form.id ? "Редактировать товар" : "Добавить товар"}
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-name">Название</Label>
                    <Input
                      id="admin-product-name"
                      value={form.name ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-brand">Бренд</Label>
                    <Input
                      id="admin-product-brand"
                      value={form.brand ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-price">Цена</Label>
                    <Input
                      id="admin-product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-stock">Остаток</Label>
                    <Input
                      id="admin-product-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock ?? "0"}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-image">Путь к изображению</Label>
                    <Input
                      id="admin-product-image"
                      value={form.image ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        ref={mainImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="max-w-sm cursor-pointer"
                        onChange={(e) => void handleMainImageUpload(e.target.files)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {uploadingMainImage ? "Загрузка главного изображения..." : "Загрузите главное изображение с компьютера."}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-category">Категория</Label>
                    <select
                      id="admin-product-category"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                      value={form.category ?? "skincare"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value as AdminProduct["category"],
                        }))
                      }
                    >
                      <option value="skincare">Уход за кожей</option>
                      <option value="makeup">Макияж</option>
                      <option value="fragrance">Ароматы</option>
                      <option value="haircare">Уход за волосами</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-product-description">Описание</Label>
                    <Textarea
                      id="admin-product-description"
                      value={form.description ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void saveProduct()} disabled={saving}>
                      {saving ? "Сохранение..." : form.id ? "Обновить товар" : "Добавить товар"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setForm(emptyForm)}
                      disabled={saving}
                    >
                      Сбросить
                    </Button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl tracking-tight text-foreground">
                      Управление каталогом
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Редактируйте существующие товары или удаляйте устаревшие позиции.
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-background p-4 lg:flex-row lg:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="admin-catalog-search">Поиск по названию или бренду</Label>
                    <div className="flex gap-2">
                      <Input
                        id="admin-catalog-search"
                        value={productsSearchInput}
                        onChange={(e) => setProductsSearchInput(e.target.value)}
                        placeholder="Например, MAC или Bronzer"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setProductsPage(1)
                            setProductsSearch(productsSearchInput.trim())
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 lg:w-64">
                    <Label htmlFor="admin-catalog-category">Фильтр по категории</Label>
                    <select
                      id="admin-catalog-category"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                      value={productsCategory}
                      onChange={(e) => {
                        setProductsPage(1)
                        setProductsCategory(e.target.value as "all" | AdminProduct["category"])
                      }}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 lg:w-72">
                    <Label htmlFor="admin-catalog-sort">Сортировка</Label>
                    <select
                      id="admin-catalog-sort"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                      value={productsSort}
                      onChange={(e) => {
                        setProductsPage(1)
                        setProductsSort(
                          e.target.value as
                            | "newest"
                            | "oldest"
                            | "price_asc"
                            | "price_desc"
                            | "stock_desc"
                            | "stock_asc"
                        )
                      }}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductsSearchInput("")
                        setProductsSearch("")
                        setProductsCategory("all")
                        setProductsSort("newest")
                        setProductsPage(1)
                      }}
                    >
                      Сбросить фильтры
                    </Button>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">Топ товаров по заказам</p>
                  <div className="mt-3 space-y-2">
                    {summary?.topProducts?.length ? (
                      summary.topProducts.map((product) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{product.name}</span>
                          <span className="text-muted-foreground">Продано: {product.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Данных о продажах пока нет.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>Найдено товаров: {productsTotal}</p>
                    {productsLoading ? <p>Загрузка списка...</p> : null}
                  </div>

                  {products.length === 0 && !productsLoading ? (
                    <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                      По вашему запросу товары не найдены.
                    </div>
                  ) : null}

                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {product.category} {product.brand ? `• ${product.brand}` : ""}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {truncateText(product.description)}
                          </p>
                          <p className="mt-2 text-sm text-foreground">
                            {formatSom(product.price)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Остаток: {product.stock}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{product.image}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => startEdit(product)}
                            disabled={saving}
                          >
                            Редактировать
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => void removeProduct(product.id)}
                            disabled={saving}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {productsTotalPages > 1 ? (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setProductsPage((prev) => Math.max(1, prev - 1))}
                      disabled={productsPage === 1}
                    >
                      Назад
                    </Button>
                    {Array.from({ length: productsTotalPages }, (_, index) => index + 1).map(
                      (pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === productsPage ? "default" : "outline"}
                          onClick={() => setProductsPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setProductsPage((prev) => Math.min(productsTotalPages, prev + 1))
                      }
                      disabled={productsPage === productsTotalPages}
                    >
                      Вперед
                    </Button>
                  </div>
                ) : null}
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
