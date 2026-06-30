"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { X, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { getAuthToken } from "@/lib/client-auth"
import { formatSom } from "@/lib/format"

type PaymentMethod = "mock_card" | "cash_on_delivery"
const SHIPPING_FEE = 200

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [city, setCity] = useState("")
  const [street, setStreet] = useState("")
  const [house, setHouse] = useState("")
  const [apartment, setApartment] = useState("")
  const [phone, setPhone] = useState("")
  const [saveAddress, setSaveAddress] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mock_card")
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")
  const [checkoutSuccess, setCheckoutSuccess] = useState("")

  const shipping = SHIPPING_FEE
  const grandTotal = total + shipping
  const formattedAddress = [
    city.trim(),
    street.trim(),
    house.trim() ? `дом ${house.trim()}` : "",
    apartment.trim() ? `кв. ${apartment.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ")

  async function handleCheckout() {
    const token = getAuthToken()
    if (!token) {
      setCheckoutError("Сначала войдите в аккаунт, чтобы оформить заказ.")
      return
    }

    if (!city.trim() || !street.trim() || !house.trim() || !apartment.trim() || !phone.trim()) {
      setCheckoutError("Пожалуйста, заполните город, улицу, дом, квартиру и номер телефона.")
      return
    }

    if (paymentMethod === "mock_card") {
      if (
        !cardName.trim() ||
        cardNumber.replace(/\s+/g, "").length < 12 ||
        !cardExpiry.trim() ||
        cardCvc.trim().length < 3
      ) {
        setCheckoutError("Пожалуйста, заполните данные карты.")
        return
      }
    }

    setCheckoutError("")
    setCheckoutSuccess("")
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress: {
            city,
            street,
            house,
            apartment,
            phone,
          },
          saveAddress,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось оформить заказ")
      }

      await clearCart()
      setCity("")
      setStreet("")
      setHouse("")
      setApartment("")
      setPhone("")
      setCardName("")
      setCardNumber("")
      setCardExpiry("")
      setCardCvc("")
      setCheckoutSuccess(
        paymentMethod === "mock_card"
          ? "Оплата подтверждена, заказ успешно оформлен. Он доступен в личном кабинете."
          : "Заказ успешно оформлен. Оплата будет подтверждена позже."
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось оформить заказ"
      setCheckoutError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 lg:px-8 py-16 lg:py-24">
          <div className="flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-6" />
            <h1 className="font-serif text-3xl tracking-tight text-foreground mb-2">
              Корзина пуста
            </h1>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Похоже, вы еще ничего не добавили. Откройте каталог и выберите товары.
            </p>
            {checkoutSuccess && (
              <p className="mb-6 text-sm text-accent">{checkoutSuccess}</p>
            )}
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/shop">Перейти к покупкам</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-8 lg:py-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Продолжить покупки
        </Link>

        <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground mb-8">
          Корзина
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] lg:gap-10">
          <div>
            <div className="flex flex-col">
              {items.map((item, index) => (
                <div key={item.product.id}>
                  <div className="flex gap-4 lg:gap-6 py-6">
                    <div className="relative h-28 w-24 lg:h-32 lg:w-28 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/product/${item.product.id}`}
                            className="text-sm lg:text-base font-medium text-foreground hover:underline leading-tight"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground capitalize">
                            {item.product.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Удалить ${item.product.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary transition-colors"
                            aria-label="Уменьшить количество"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium text-foreground min-w-[1.5ch] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary transition-colors"
                            aria-label="Увеличить количество"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {formatSom(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4 lg:p-5">
              <h2 className="mb-4 font-serif text-xl tracking-tight text-card-foreground">
                Оформление заказа
              </h2>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сумма товаров</span>
                  <span className="text-card-foreground">{formatSom(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="text-card-foreground">{formatSom(shipping)}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">
                  Итого
                </span>
                <span className="text-lg font-medium text-card-foreground">
                  {formatSom(grandTotal)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="mb-2 text-sm font-medium text-card-foreground">
                    Адрес доставки
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="delivery-city">Город</Label>
                      <Input
                        id="delivery-city"
                        placeholder="Например, Бишкек"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="delivery-street">Улица</Label>
                      <Input
                        id="delivery-street"
                        placeholder="Например, Чуй"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="delivery-house">Дом</Label>
                      <Input
                        id="delivery-house"
                        placeholder="15"
                        value={house}
                        onChange={(e) => setHouse(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="delivery-apartment">Квартира</Label>
                      <Input
                        id="delivery-apartment"
                        placeholder="21"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-1">
                      <Label htmlFor="delivery-phone">Телефон</Label>
                      <Input
                        id="delivery-phone"
                        placeholder="+996 555 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Сохранить адрес для будущих заказов</span>
                  </label>
                </div>

                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="mb-2 text-sm font-medium text-card-foreground">
                    Способ оплаты
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-2.5 text-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "mock_card"}
                        onChange={() => setPaymentMethod("mock_card")}
                        className="mt-1"
                      />
                      <span className="block font-medium text-foreground">
                        Оплата картой
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-2.5 text-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "cash_on_delivery"}
                        onChange={() => setPaymentMethod("cash_on_delivery")}
                        className="mt-1"
                      />
                      <span className="block font-medium text-foreground">
                        Оплата при получении
                      </span>
                    </label>
                  </div>
                </div>

                {paymentMethod === "mock_card" && (
                  <div className="space-y-3 rounded-xl border border-border bg-background p-3">
                    <p className="text-sm font-medium text-card-foreground">
                      Данные карты
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label htmlFor="card-name">Имя держателя карты</Label>
                        <Input
                          id="card-name"
                          placeholder="А. Клиент"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label htmlFor="card-number">Номер карты</Label>
                        <Input
                          id="card-number"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="card-expiry">Срок действия</Label>
                        <Input
                          id="card-expiry"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="card-cvc">CVC</Label>
                        <Input
                          id="card-cvc"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {checkoutError && (
                <p className="mt-2 text-xs text-destructive">{checkoutError}</p>
              )}
              {checkoutSuccess && (
                <p className="mt-2 text-xs text-accent">{checkoutSuccess}</p>
              )}

              <Button
                size="lg"
                className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? paymentMethod === "mock_card"
                    ? "Обработка оплаты..."
                    : "Оформление заказа..."
                  : paymentMethod === "mock_card"
                    ? "Оплатить и оформить"
                    : "Оформить заказ"}
              </Button>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                Перед оформлением заказа войдите через страницу «Аккаунт».
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
