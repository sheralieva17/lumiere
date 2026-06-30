"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { clearAuthToken, getAuthToken } from "@/lib/client-auth"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatSom } from "@/lib/format"

type ManagerOrder = {
  id: string
  createdAt: string
  managerUpdatedAt: string | null
  customerName: string
  customerEmail: string
  paymentMethod: "mock_card" | "cash_on_delivery"
  paymentStatus: "paid" | "pending"
  total: number
  shippingAddress: string
  status: "processing" | "assembling" | "in_transit" | "delivered" | "cancelled"
  managerStatus:
    | "pending_review"
    | "confirmed"
    | "needs_clarification"
    | "sent_to_fulfillment"
  cancellationStatus: "none" | "requested" | "approved" | "rejected"
  cancellationReason: string
  cancellationRequestedAt: string | null
  cancellationResolvedAt: string | null
  managerNote: string
  items: Array<{ productId: string; name: string; quantity: number }>
}

type ManagerReview = {
  id: string
  productName: string
  reviewerName: string
  rating: number
  comment: string
  updatedAt: string
  moderationStatus: "pending" | "approved" | "rejected" | "escalated"
  managerReply: string
  escalatedToAdmin: boolean
}

type ManagerDailyReport = {
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

type ManagerReportSnapshot = {
  reportDate: string
  deliveredOrdersCount: number
  cancelledOrdersCount: number
  deliveredRevenue: number
  existingReport: ManagerDailyReport | null
}

type Tab = "orders" | "reviews"
type OrderView = "active" | "delivered" | "cancelled"

const orderStatusLabel: Record<ManagerOrder["managerStatus"], string> = {
  pending_review: "Ожидает проверки",
  confirmed: "Подтвержден",
  needs_clarification: "Нужно уточнение",
  sent_to_fulfillment: "В сборке",
}

const deliveryStatusLabel: Record<ManagerOrder["status"], string> = {
  processing: "В обработке",
  assembling: "В сборке",
  in_transit: "Заказ в пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
}

const paymentMethodLabel: Record<ManagerOrder["paymentMethod"], string> = {
  mock_card: "Оплата картой",
  cash_on_delivery: "Оплата при получении",
}

const paymentStatusLabel: Record<ManagerOrder["paymentStatus"], string> = {
  paid: "Оплачено",
  pending: "Ожидает подтверждения",
}

const moderationStatusLabel: Record<ManagerReview["moderationStatus"], string> = {
  pending: "На проверке",
  approved: "Одобрен",
  rejected: "Отклонен",
  escalated: "Передан администратору",
}

function formatManagerErrorMessage(message: string) {
  if (message === "Forbidden") {
    return "Недостаточно прав доступа. Войдите как менеджер или администратор."
  }
  if (message === "Unauthorized") {
    return "Сессия недействительна. Пожалуйста, войдите снова как менеджер."
  }
  return message
}

function canConfirmOrder(order: ManagerOrder) {
  return (
    order.status === "processing" &&
    order.managerStatus === "pending_review" &&
    order.cancellationStatus !== "requested"
  )
}

function canMoveToAssembly(order: ManagerOrder) {
  return (
    order.status === "processing" &&
    order.managerStatus === "confirmed" &&
    order.cancellationStatus !== "requested"
  )
}

function canMoveToDelivery(order: ManagerOrder) {
  return (
    order.status === "assembling" &&
    order.managerStatus === "sent_to_fulfillment" &&
    order.cancellationStatus !== "requested"
  )
}

export default function ManagerPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("orders")
  const [orderView, setOrderView] = useState<OrderView>("active")
  const [orders, setOrders] = useState<ManagerOrder[]>([])
  const [reviews, setReviews] = useState<ManagerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState("")
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({})
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [orderSearchInput, setOrderSearchInput] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [reportSnapshot, setReportSnapshot] = useState<ManagerReportSnapshot | null>(null)
  const [reportComment, setReportComment] = useState("")
  const [reportSaving, setReportSaving] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "low" | "pending" | "unanswered"
  >("all")

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "low") return reviews.filter((r) => r.rating <= 2)
    if (reviewFilter === "pending") {
      return reviews.filter((r) => r.moderationStatus === "pending")
    }
    if (reviewFilter === "unanswered") {
      return reviews.filter((r) => !r.managerReply?.trim())
    }
    return reviews
  }, [reviewFilter, reviews])

  const loadData = async () => {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как менеджер или администратор, чтобы открыть эту страницу.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const requests: Promise<Response>[] = []

      if (tab === "orders") {
        const ordersUrl = new URL("/api/manager/orders", window.location.origin)
        ordersUrl.searchParams.set("view", orderView)
        if (orderSearch.trim()) {
          ordersUrl.searchParams.set("search", orderSearch.trim())
        }

        requests.push(
          fetch(ordersUrl.toString(), {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
        requests.push(
          fetch("/api/manager/reports", {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      } else {
        requests.push(Promise.resolve(new Response(JSON.stringify({ orders: [] }), { status: 200 })))
        requests.push(Promise.resolve(new Response(JSON.stringify(null), { status: 200 })))
      }

      requests.push(
        fetch("/api/manager/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )

      const [ordersRes, reportRes, reviewsRes] = await Promise.all(requests)
      const ordersData = await ordersRes.json()
      const reportData = await reportRes.json()
      const reviewsData = await reviewsRes.json()

      if (!ordersRes.ok) throw new Error(ordersData.error || "Не удалось загрузить заказы")
      if (tab === "orders" && !reportRes.ok) {
        throw new Error(reportData.error || "Не удалось загрузить отчет менеджера")
      }
      if (!reviewsRes.ok) throw new Error(reviewsData.error || "Не удалось загрузить отзывы")

      setOrders(ordersData.orders ?? [])
      setReviews(reviewsData.reviews ?? [])

      if (tab === "orders") {
        setReportSnapshot(reportData)
        setReportComment(reportData?.existingReport?.comment ?? "")
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? formatManagerErrorMessage(e.message)
          : "Не удалось загрузить данные менеджера"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [tab, orderView, orderSearch])

  const updateOrderStatus = async (
    orderId: string,
    options: {
      managerStatus?: ManagerOrder["managerStatus"]
      status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
      paymentStatus?: ManagerOrder["paymentStatus"]
      cancellationStatus?: ManagerOrder["cancellationStatus"]
    }
  ) => {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как менеджер или администратор, чтобы обновить заказ.")
      return
    }

    setSavingId(orderId)
    setError("")
    try {
      const res = await fetch("/api/manager/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          managerStatus: options.managerStatus,
          status: options.status,
          managerNote: orderNotes[orderId] ?? "",
          paymentStatus: options.paymentStatus,
          cancellationStatus: options.cancellationStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось обновить заказ")
      await loadData()
    } catch (e) {
      setError(
        e instanceof Error
          ? formatManagerErrorMessage(e.message)
          : "Не удалось обновить заказ"
      )
    } finally {
      setSavingId("")
    }
  }

  const updateReview = async (
    reviewId: string,
    payload: {
      moderationStatus?: ManagerReview["moderationStatus"]
      managerReply?: string
      escalatedToAdmin?: boolean
    }
  ) => {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как менеджер или администратор, чтобы обновить отзыв.")
      return
    }

    setSavingId(reviewId)
    setError("")
    try {
      const res = await fetch("/api/manager/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewId, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось обновить отзыв")
      await loadData()
    } catch (e) {
      setError(
        e instanceof Error
          ? formatManagerErrorMessage(e.message)
          : "Не удалось обновить отзыв"
      )
    } finally {
      setSavingId("")
    }
  }

  const saveDailyReport = async () => {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите как менеджер или администратор, чтобы отправить отчет.")
      return
    }

    setReportSaving(true)
    setError("")
    try {
      const res = await fetch("/api/manager/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: reportComment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить отчет")
      await loadData()
      setReportDialogOpen(false)
    } catch (e) {
      setError(
        e instanceof Error
          ? formatManagerErrorMessage(e.message)
          : "Не удалось сохранить отчет"
      )
    } finally {
      setReportSaving(false)
    }
  }

  function handleLogout() {
    clearAuthToken()
    router.push("/account")
  }

  const ordersHeading =
    orderView === "active"
      ? "Активные заказы"
      : orderView === "delivered"
        ? "Доставленные заказы"
        : "Отмененные заказы"

  const emptyOrdersMessage =
    orderView === "active"
      ? "Сейчас нет активных заказов."
      : orderView === "delivered"
        ? orderSearch
          ? "По этому ID доставленные заказы не найдены."
          : "За последние 7 дней доставленных заказов пока нет."
        : orderSearch
          ? "По этому ID отмененные заказы не найдены."
          : "За последние 7 дней отмененных заказов пока нет."

  const reportDateLabel = reportSnapshot
    ? new Date(reportSnapshot.reportDate).toLocaleDateString("ru-RU")
    : new Date().toLocaleDateString("ru-RU")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">
              Рабочая панель
            </p>
            <h1 className="font-serif text-3xl tracking-tight text-foreground lg:text-4xl">
              Панель менеджера
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Обрабатывайте заказы, отзывы и запросы клиентов.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={tab === "orders" ? "default" : "outline"}
            onClick={() => setTab("orders")}
          >
            Заказы
          </Button>
          <Button
            variant={tab === "reviews" ? "default" : "outline"}
            onClick={() => setTab("reviews")}
          >
            Отзывы
          </Button>
        </div>

        {error ? (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка данных менеджера...</p>
        ) : tab === "orders" ? (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button
                  variant={orderView === "active" ? "default" : "outline"}
                  onClick={() => {
                    setOrderView("active")
                    setOrderSearchInput("")
                    setOrderSearch("")
                  }}
                >
                  Активные
                </Button>
                <Button
                  variant={orderView === "delivered" ? "default" : "outline"}
                  onClick={() => setOrderView("delivered")}
                >
                  Доставленные
                </Button>
                <Button
                  variant={orderView === "cancelled" ? "default" : "outline"}
                  onClick={() => setOrderView("cancelled")}
                >
                  Отмененные
                </Button>
              </div>

              {orderView !== "active" ? (
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={orderSearchInput}
                    onChange={(e) => setOrderSearchInput(e.target.value)}
                    placeholder="Поиск по ID заказа"
                    className="sm:max-w-sm"
                  />
                  <Button variant="outline" onClick={() => setOrderSearch(orderSearchInput.trim())}>
                    Найти
                  </Button>
                  {orderSearch ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setOrderSearchInput("")
                        setOrderSearch("")
                      }}
                    >
                      Сбросить поиск
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <h2 className="mb-4 font-serif text-2xl tracking-tight text-foreground">
                {ordersHeading}
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyOrdersMessage}</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Заказ {order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerName} • {order.customerEmail}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {formatSom(order.total)}
                          </p>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">
                            Статус доставки: {deliveryStatusLabel[order.status]}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Менеджер: {orderStatusLabel[order.managerStatus]}
                          </p>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">
                            Оплата: {paymentMethodLabel[order.paymentMethod]} • {paymentStatusLabel[order.paymentStatus]}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">Адрес: {order.shippingAddress}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Товары: {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                      </p>

                      {orderView === "cancelled" ? (
                        <p className="mt-2 text-xs text-destructive">
                          Причина отмены: {order.cancellationReason || "Причина не указана."}
                        </p>
                      ) : null}

                      {orderView === "active" && order.cancellationStatus === "requested" ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <p className="font-medium">Запрос на отмену ожидает решения</p>
                          <p className="mt-1">
                            Причина: {order.cancellationReason || "Клиент не указал причину."}
                          </p>
                        </div>
                      ) : null}

                      {orderView === "active" && order.cancellationStatus === "rejected" ? (
                        <p className="mt-3 text-xs text-destructive">
                          Отмена отклонена. Причина для клиента: {order.managerNote || "Причина не указана."}
                        </p>
                      ) : null}

                      {orderView === "active" && order.cancellationStatus === "requested" ? (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor={`order-note-${order.id}`} className="text-xs">
                            Комментарий по отмене
                          </Label>
                          <Input
                            id={`order-note-${order.id}`}
                            value={orderNotes[order.id] ?? order.managerNote ?? ""}
                            onChange={(e) =>
                              setOrderNotes((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            placeholder="Укажите причину отказа или пояснение клиенту..."
                          />
                        </div>
                      ) : null}

                      {orderView === "active" ? (
                        <div className="mt-4 flex flex-wrap items-end gap-2">
                          {canConfirmOrder(order) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === order.id}
                              onClick={() =>
                                updateOrderStatus(order.id, {
                                  managerStatus: "confirmed",
                                })
                              }
                            >
                              Подтвердить
                            </Button>
                          ) : null}
                          {canMoveToAssembly(order) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === order.id}
                              onClick={() =>
                                updateOrderStatus(order.id, {
                                  managerStatus: "sent_to_fulfillment",
                                  status: "confirmed",
                                })
                              }
                            >
                              В сборке
                            </Button>
                          ) : null}
                          {canMoveToDelivery(order) ? (
                            <Button
                              size="sm"
                              disabled={savingId === order.id}
                              onClick={() =>
                                updateOrderStatus(order.id, {
                                  managerStatus: "sent_to_fulfillment",
                                  status: "shipped",
                                })
                              }
                            >
                              Передать в доставку
                            </Button>
                          ) : null}
                          {order.cancellationStatus === "requested" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingId === order.id}
                                onClick={() =>
                                  updateOrderStatus(order.id, {
                                    managerStatus: order.managerStatus,
                                    paymentStatus: order.paymentStatus,
                                    cancellationStatus: "approved",
                                  })
                                }
                              >
                                Одобрить отмену
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  savingId === order.id ||
                                  !(orderNotes[order.id] ?? order.managerNote ?? "").trim()
                                }
                                onClick={() =>
                                  updateOrderStatus(order.id, {
                                    managerStatus: order.managerStatus,
                                    paymentStatus: order.paymentStatus,
                                    cancellationStatus: "rejected",
                                  })
                                }
                              >
                                Отклонить отмену
                              </Button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-serif text-2xl tracking-tight text-foreground">
                    Сделать отчет за сегодняшний день
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Откройте окно отчета, проверьте автоматически посчитанные данные и отправьте их админу.
                  </p>
                  {reportSnapshot?.existingReport ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Последний сохраненный отчет за сегодня:{" "}
                      {new Date(reportSnapshot.existingReport.updatedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Button onClick={() => setReportDialogOpen(true)}>
                  Сделать отчет за сегодняшний день
                </Button>
              </div>
            </section>

            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Отчет за сегодняшний день</DialogTitle>
                  <DialogDescription>
                    Система сама посчитала показатели за смену. При необходимости добавьте комментарий и отправьте готовый отчет админу.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Дата</span>
                    <span className="font-medium text-foreground">{reportDateLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Выполнено заказов</span>
                    <span className="font-medium text-foreground">
                      {reportSnapshot?.deliveredOrdersCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Отменено</span>
                    <span className="font-medium text-foreground">
                      {reportSnapshot?.cancelledOrdersCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Итоговая выручка</span>
                    <span className="font-medium text-foreground">
                      {formatSom(reportSnapshot?.deliveredRevenue ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager-daily-report-comment">
                    Комментарий к смене (необязательно)
                  </Label>
                  <Textarea
                    id="manager-daily-report-comment"
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Например: Всё отлично, один заказ отменили по просьбе клиента."
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setReportDialogOpen(false)}
                    disabled={reportSaving}
                  >
                    Закрыть
                  </Button>
                  <Button onClick={() => void saveDailyReport()} disabled={reportSaving}>
                    {reportSaving ? "Отправка..." : "Отправить админу"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={reviewFilter === "all" ? "default" : "outline"}
                onClick={() => setReviewFilter("all")}
              >
                Все
              </Button>
              <Button
                size="sm"
                variant={reviewFilter === "low" ? "default" : "outline"}
                onClick={() => setReviewFilter("low")}
              >
                1–2 звезды
              </Button>
              <Button
                size="sm"
                variant={reviewFilter === "pending" ? "default" : "outline"}
                onClick={() => setReviewFilter("pending")}
              >
                На проверке
              </Button>
              <Button
                size="sm"
                variant={reviewFilter === "unanswered" ? "default" : "outline"}
                onClick={() => setReviewFilter("unanswered")}
              >
                Без ответа
              </Button>
            </div>

            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Для выбранного фильтра отзывов нет.</p>
              ) : (
                filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {review.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.reviewerName} • {new Date(review.updatedAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Оценка: {review.rating}/5
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground capitalize">
                          Статус: {moderationStatusLabel[review.moderationStatus]}
                        </p>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    {review.managerReply && (
                      <p className="mt-2 text-xs text-foreground">
                        Ответ менеджера: {review.managerReply}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`reply-${review.id}`} className="text-xs">
                          Ответ клиенту
                        </Label>
                        <Input
                          id={`reply-${review.id}`}
                          value={replyDrafts[review.id] ?? review.managerReply ?? ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          placeholder="Напишите пояснение или ответ..."
                        />
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === review.id}
                          onClick={() =>
                            updateReview(review.id, {
                              moderationStatus: "approved",
                              escalatedToAdmin: false,
                            })
                          }
                        >
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === review.id}
                          onClick={() =>
                            updateReview(review.id, {
                              moderationStatus: "rejected",
                              escalatedToAdmin: false,
                            })
                          }
                        >
                          Отклонить
                        </Button>
                        <Button
                          size="sm"
                          disabled={savingId === review.id}
                          onClick={() =>
                            updateReview(review.id, {
                              managerReply: replyDrafts[review.id] ?? "",
                            })
                          }
                        >
                          Сохранить ответ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
