"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/client-auth"
import type { RecommendationProfile } from "@/lib/products"
import { ArrowLeft } from "lucide-react"
import { formatSom } from "@/lib/format"

type AccountUser = {
  id: string
  role: "customer" | "manager" | "admin"
  firstName: string
  lastName: string
  email: string
  phone: string
  avatarDataUrl: string
  savedAddresses: string[]
  hasCompletedQuiz: boolean
  quizResult: RecommendationProfile | null
  quizCompletedAt: string | null
}

type AccountOrder = {
  id: string
  createdAt: string
  status: "processing" | "assembling" | "in_transit" | "delivered" | "cancelled"
  paymentMethod: "mock_card" | "cash_on_delivery"
  paymentStatus: "paid" | "pending"
  managerNote: string
  cancellationStatus: "none" | "requested" | "approved" | "rejected"
  cancellationReason: string
  cancellationRequestedAt: string | null
  cancellationResolvedAt: string | null
  shippingAddress: string
  total: number
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
}

type AuthFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

const orderStatusLabel: Record<AccountOrder["status"], string> = {
  processing: "В обработке",
  assembling: "В сборке",
  in_transit: "Заказ в пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
}

const paymentMethodLabel: Record<AccountOrder["paymentMethod"], string> = {
  mock_card: "Оплата картой",
  cash_on_delivery: "Оплата при получении",
}

const paymentStatusLabel: Record<AccountOrder["paymentStatus"], string> = {
  paid: "Оплачено",
  pending: "Ожидает подтверждения",
}

const skinTypeLabel: Record<NonNullable<RecommendationProfile["skinType"]>, string> = {
  oily: "жирная",
  dry: "сухая",
  combination: "комбинированная",
  sensitive: "чувствительная",
  normal: "нормальная",
}

const concernLabel: Record<RecommendationProfile["concerns"][number], string> = {
  acne: "акне и высыпания",
  aging: "возрастные изменения",
  dullness: "тусклость и неровный тон",
  dryness: "сухость и обезвоженность",
  sensitivity: "чувствительность и раздражение",
  hyperpigmentation: "пигментация",
  pores: "расширенные поры",
  redness: "покраснение",
}

const routineLabel: Record<RecommendationProfile["routine"], string> = {
  minimal: "минимальный",
  moderate: "умеренный",
  comprehensive: "полный",
}

const initialForm: AuthFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
}

export default function AccountPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [authForm, setAuthForm] = useState<AuthFormState>(initialForm)
  const [user, setUser] = useState<AccountUser | null>(null)
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [cancellationDrafts, setCancellationDrafts] = useState<Record<string, string>>({})
  const [cancellingOrderId, setCancellingOrderId] = useState("")
  const [orderActionLoading, setOrderActionLoading] = useState("")
  const [profileForm, setProfileForm] = useState({
    login: "",
    email: "",
    phone: "",
    avatarDataUrl: "",
  })

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders]
  )

  const historyOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered"),
    [orders]
  )

  async function confirmReceived(orderId: string) {
    const token = getAuthToken()
    if (!token) {
      setError("Войдите в аккаунт, чтобы подтвердить получение заказа.")
      return
    }

    setOrderActionLoading(orderId)
    setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          action: "confirm_received",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось подтвердить получение заказа.")
      }
      await loadAccount(token)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось подтвердить получение заказа."
      )
    } finally {
      setOrderActionLoading("")
    }
  }

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    void loadAccount(token)
  }, [])

  async function loadAccount(token: string) {
    try {
      const accountRes = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (accountRes.status === 401) {
        clearAuthToken()
        setUser(null)
        setOrders([])
        setLoading(false)
        return
      }

      const accountData = await accountRes.json()

      if (!accountRes.ok) {
        throw new Error(accountData.error || "Не удалось загрузить аккаунт")
      }

      const loadedUser = accountData.user as AccountUser
      if (loadedUser.role === "manager") {
        router.replace("/manager")
        return
      }
      if (loadedUser.role === "admin") {
        router.replace("/admin")
        return
      }

      const ordersRes = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const ordersData = await ordersRes.json()

      setUser(loadedUser)
      setProfileForm({
        login: `${loadedUser.firstName} ${loadedUser.lastName}`.trim(),
        email: loadedUser.email,
        phone: loadedUser.phone,
        avatarDataUrl: loadedUser.avatarDataUrl ?? "",
      })
      setOrders(ordersRes.ok ? (ordersData.orders as AccountOrder[]) : [])
    } catch (e) {
      const message = e instanceof Error ? e.message : "Что-то пошло не так"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
    const payload = isLogin
      ? { email: authForm.email, password: authForm.password }
      : {
          firstName: authForm.firstName,
          lastName: authForm.lastName,
          email: authForm.email,
          phone: authForm.phone,
          password: authForm.password,
        }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Ошибка авторизации")
      }

      setAuthToken(data.token)
      await loadAccount(data.token)
      setAuthForm(initialForm)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка авторизации"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    const token = getAuthToken()
    if (!token || !user) return

    setSubmitting(true)
    setError("")
    try {
      const loginParts = profileForm.login.trim().split(/\s+/).filter(Boolean)
      const firstName = loginParts[0] ?? ""
      const lastName = loginParts.slice(1).join(" ")
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: profileForm.email,
          phone: profileForm.phone,
          avatarDataUrl: profileForm.avatarDataUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось сохранить профиль")
      }
      const updatedUser = data.user as AccountUser
      setUser(updatedUser)
      setProfileForm({
        login: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarDataUrl: updatedUser.avatarDataUrl ?? "",
      })
      setIsEditingProfile(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось сохранить профиль"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function requestCancellation(orderId: string) {
    const token = getAuthToken()
    if (!token) {
      setError("Сначала войдите в аккаунт.")
      return
    }

    const reason = (cancellationDrafts[orderId] ?? "").trim()
    if (!reason) {
      setError("Укажите причину отмены заказа.")
      return
    }

    setCancellingOrderId(orderId)
    setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          cancellationReason: reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить запрос на отмену")
      }

      await loadAccount(token)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось отправить запрос на отмену"
      )
    } finally {
      setCancellingOrderId("")
    }
  }

  function handleLogout() {
    clearAuthToken()
    setUser(null)
    setOrders([])
    setProfileForm({
      login: "",
      email: "",
      phone: "",
      avatarDataUrl: "",
    })
  }

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setProfileForm((prev) => ({ ...prev, avatarDataUrl: result }))
      setError("")
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-16">Загрузка аккаунта...</main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 lg:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
        Вернуться в магазин
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl tracking-tight text-foreground">
              {isLogin ? "С возвращением" : "Создать аккаунт"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin
                ? "Войдите, чтобы открыть аккаунт, адреса и заказы"
                : "Создайте аккаунт и отслеживайте свои заказы"}
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={authForm.firstName}
                      onChange={(e) =>
                        setAuthForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={authForm.lastName}
                      onChange={(e) =>
                        setAuthForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555 123 4567"
                    value={authForm.phone}
                    onChange={(e) =>
                      setAuthForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              disabled={submitting}
            >
              {submitting
                  ? "Пожалуйста, подождите..."
                : isLogin
                  ? "Войти"
                  : "Создать аккаунт"}
            </Button>
          </form>

          <Separator className="my-8" />

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("")
                setIsLogin(!isLogin)
              }}
              className="text-foreground font-medium underline underline-offset-2 hover:text-accent transition-colors"
            >
              {isLogin ? "Создать" : "Войти"}
            </button>
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-8 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-accent mb-2">
              Мой аккаунт
            </p>
            <h1 className="text-lg md:text-xl tracking-[0.2em] uppercase text-accent">
              {user.firstName} {user.lastName}
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        {error && (
          <p className="mb-6 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-1 rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl tracking-tight text-card-foreground mb-4">
              Профиль
            </h2>
            {!isEditingProfile ? (
              <div className="flex min-h-[320px] flex-col">
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  {user.avatarDataUrl ? (
                    <img
                      src={user.avatarDataUrl}
                      alt="Профиль"
                      className="h-48 w-48 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="h-48 w-48 rounded-md border border-border bg-secondary flex items-center justify-center text-4xl text-muted-foreground">
                      {user.firstName?.[0] ?? ""}
                      {user.lastName?.[0] ?? ""}
                    </div>
                  )}
                  <p className="font-serif text-3xl tracking-tight text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Редактировать профиль
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <div className="flex items-center gap-4">
                  {profileForm.avatarDataUrl ? (
                    <img
                      src={profileForm.avatarDataUrl}
                      alt="Профиль"
                      className="h-20 w-20 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full border border-border bg-secondary flex items-center justify-center text-lg text-muted-foreground">
                      {profileForm.login?.[0] ?? ""}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="profileAvatar">Фото профиля</Label>
                    <input
                      id="profileAvatar"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        handleAvatarUpload(file)
                      }}
                    />
                    <Label
                      htmlFor="profileAvatar"
                      className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground cursor-pointer transition-colors hover:bg-accent/10"
                      onClick={() => setError("")}
                    >
                      Выберите файл
                    </Label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="profileLogin">Имя пользователя</Label>
                  <Input
                    id="profileLogin"
                    value={profileForm.login}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        login: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="profileEmail">E-mail</Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="profilePhone">Телефон</Label>
                  <Input
                    id="profilePhone"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="cursor-pointer">
                    Сохранить профиль
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      setIsEditingProfile(false)
                      if (user) {
                        setProfileForm({
                          login: `${user.firstName} ${user.lastName}`.trim(),
                          email: user.email,
                          phone: user.phone,
                          avatarDataUrl: user.avatarDataUrl ?? "",
                        })
                      }
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </section>

          <section className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl tracking-tight text-card-foreground mb-4">
              Результат теста кожи
            </h2>
            {user.hasCompletedQuiz && user.quizResult ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Пройден{" "}
                  {user.quizCompletedAt
                    ? new Date(user.quizCompletedAt).toLocaleString()
                    : "дата неизвестна"}
                </p>
                <div className="rounded-lg border border-border bg-background p-3 text-sm text-foreground">
                  Тип кожи: {skinTypeLabel[user.quizResult.skinType] ?? user.quizResult.skinType}
                </div>
                <div className="rounded-lg border border-border bg-background p-3 text-sm text-foreground">
                  Проблемы: {user.quizResult.concerns.map((concern) => concernLabel[concern] ?? concern).join(", ")}
                </div>
                <div className="rounded-lg border border-border bg-background p-3 text-sm text-foreground">
                  Уход: {routineLabel[user.quizResult.routine] ?? user.quizResult.routine}
                </div>
                <Button asChild variant="outline">
                  <Link href="/recommendations">Посмотреть рекомендации</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Вы еще не проходили тест кожи.
                </p>
                <Button asChild>
                  <Link href="/quiz">Пройти тест</Link>
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl tracking-tight text-card-foreground mb-4">
            Сохраненные адреса доставки
          </h2>
          {user.savedAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет сохраненных адресов. Сохраните адрес при оформлении заказа.
            </p>
          ) : (
            <div className="space-y-3">
              {user.savedAddresses.map((address, i) => (
                <div
                  key={`${address}-${i}`}
                  className="rounded-lg border border-border bg-background p-3 text-sm text-foreground"
                >
                  {address}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl tracking-tight text-card-foreground mb-4">
              Текущие заказы
            </h2>
            {activeOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сейчас нет активных заказов.
              </p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        Заказ {order.id}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs capitalize text-foreground">
                          {orderStatusLabel[order.status]}
                        </span>
                        {order.status === "in_transit" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={orderActionLoading === order.id}
                            onClick={() => void confirmReceived(order.id)}
                          >
                            Получил заказ
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Позиций: {order.items.length} • {formatSom(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      Оплата: {paymentMethodLabel[order.paymentMethod]} • {paymentStatusLabel[order.paymentStatus]}
                    </p>
                    {order.cancellationStatus === "requested" ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Запрос на отмену отправлен. Ожидается проверка менеджером.
                      </p>
                    ) : null}
                    {order.cancellationStatus === "rejected" ? (
                      <p className="mt-2 text-xs text-destructive">
                        Отмена отклонена: {order.managerNote || order.cancellationReason || "Причина не указана."}
                      </p>
                    ) : null}
                    {(order.status === "processing" || order.status === "assembling") &&
                    order.cancellationStatus !== "requested" &&
                    order.cancellationStatus !== "approved" ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <Input
                          value={cancellationDrafts[order.id] ?? ""}
                          onChange={(e) =>
                            setCancellationDrafts((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          placeholder="Укажите причину отмены заказа"
                        />
                        <Button
                          variant="outline"
                          onClick={() => void requestCancellation(order.id)}
                          disabled={
                            cancellingOrderId === order.id ||
                            !(cancellationDrafts[order.id] ?? "").trim()
                          }
                        >
                          {cancellingOrderId === order.id
                            ? "Отправка запроса..."
                            : "Запросить отмену"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl tracking-tight text-card-foreground mb-4">
              История заказов
            </h2>
            {historyOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Полученных заказов пока нет.
              </p>
            ) : (
              <div className="space-y-4">
                {historyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <span className="text-sm font-medium text-foreground">
                        {formatSom(order.total)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {order.items
                        .map((i) => `${i.name} x${i.quantity}`)
                        .join(", ")}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground capitalize">
                      Статус: {orderStatusLabel[order.status]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      Оплата: {paymentMethodLabel[order.paymentMethod]} • {paymentStatusLabel[order.paymentStatus]}
                    </p>
                    {order.cancellationStatus === "approved" || order.status === "cancelled" ? (
                      <p className="mt-1 text-xs text-accent">Отмена подтверждена.</p>
                    ) : null}
                    {order.cancellationStatus === "rejected" ? (
                      <p className="mt-1 text-xs text-destructive">
                        Отмена отклонена: {order.managerNote || order.cancellationReason || "Причина не указана."}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
