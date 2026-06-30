"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Star, Minus, Plus, ArrowLeft, Truck, RefreshCcw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { getAuthToken } from "@/lib/client-auth"
import { formatSom } from "@/lib/format"
import type { Product } from "@/lib/products"

type ProductReview = {
  id: string
  reviewerName: string
  rating: number
  comment: string
  updatedAt: string
  verifiedPurchase: boolean
  managerReply?: string
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product
  relatedProducts: Product[]
}) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [reviewSuccess, setReviewSuccess] = useState("")
  const isOutOfStock = typeof product.stock === "number" && product.stock <= 0

  const handleAddToBag = () => {
    if (isOutOfStock) return
    for (let i = 0; i < quantity; i++) {
      void addItem(product)
    }
  }

  const loadReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await fetch(
        `/api/reviews?productId=${encodeURIComponent(product.id)}`
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось загрузить отзывы")
      }
      setReviews(data.reviews ?? [])
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [product.id])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError("")
    setReviewSuccess("")

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Пожалуйста, выберите оценку.")
      return
    }

    const token = getAuthToken()
    if (!token) {
      setReviewError("Сначала войдите в аккаунт. Отзыв могут оставлять только покупатели.")
      return
    }

    setReviewSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить отзыв")
      }

      setReviewSuccess("Отзыв успешно отправлен.")
      setReviewComment("")
      setReviewRating(0)
      await loadReviews()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить отзыв"
      setReviewError(message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  const displayedAverage =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : product.rating ?? 0
  const displayedCount = reviews.length > 0 ? reviews.length : product.reviews

  return (
    <main className="mx-auto max-w-7xl px-4 lg:px-8 py-8 lg:py-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Вернуться в магазин
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={`object-cover ${isOutOfStock ? "grayscale-[0.35]" : ""}`}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.tag && (
              <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-medium tracking-wider uppercase px-3 py-1.5 rounded-full">
                {product.tag}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs tracking-[0.2em] uppercase text-accent mb-2">
            {product.category}
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground leading-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(displayedAverage)
                      ? "fill-accent text-accent"
                      : "text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {displayedAverage.toFixed(1)} ({displayedCount} отзывов)
            </span>
          </div>

          <p className="mt-4 text-2xl font-medium text-foreground">
            {formatSom(product.price)}
          </p>
          {isOutOfStock && (
            <p className="mt-2 inline-flex w-fit rounded-full bg-foreground px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-background">
              Нет в наличии
            </p>
          )}

          <Separator className="my-6" />

          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock}
                className={`flex h-12 w-12 items-center justify-center rounded-l-lg transition-colors ${
                  isOutOfStock
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-foreground hover:bg-secondary"
                }`}
                aria-label="Уменьшить количество"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-12 w-12 items-center justify-center text-sm font-medium text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                disabled={isOutOfStock}
                className={`flex h-12 w-12 items-center justify-center rounded-r-lg transition-colors ${
                  isOutOfStock
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-foreground hover:bg-secondary"
                }`}
                aria-label="Увеличить количество"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground"
              onClick={handleAddToBag}
              disabled={isOutOfStock}
            >
              {isOutOfStock
                ? "Нет в наличии"
                : `Добавить в корзину — ${formatSom(product.price * quantity)}`}
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 flex-shrink-0" />
              Бесплатная доставка для заказов от 50 сом
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <RefreshCcw className="h-4 w-4 flex-shrink-0" />
              Поддержка по заказам и оплате
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 lg:mt-20">
        <h2 className="font-serif text-2xl lg:text-3xl tracking-tight text-foreground">
          Рейтинг и отзывы
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Оставлять отзыв могут только пользователи, купившие этот товар.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Средняя оценка</p>
            <p className="mt-2 text-3xl font-medium text-foreground">
              {displayedAverage.toFixed(1)}
            </p>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(displayedAverage)
                      ? "fill-accent text-accent"
                      : "text-border"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              На основе {displayedCount} отзывов
            </p>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Оставить отзыв
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  const active = value <= reviewRating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="p-1"
                      aria-label={`Поставить ${value} звезд`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          active ? "fill-accent text-accent" : "text-border"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              <Input
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Поделитесь впечатлением об этом товаре..."
              />

              {reviewError && (
                <p className="text-xs text-destructive">{reviewError}</p>
              )}
              {reviewSuccess && (
                <p className="text-xs text-accent">{reviewSuccess}</p>
              )}

              <Button type="submit" disabled={reviewSubmitting}>
                {reviewSubmitting ? "Отправка..." : "Отправить отзыв"}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {reviewsLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка отзывов...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет отзывов покупателей.
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.reviewerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.verifiedPurchase && (
                      <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-foreground">
                        Подтвержденная покупка
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-accent text-accent"
                              : "text-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
                {review.managerReply?.trim() && (
                  <div className="mt-4 rounded-lg border border-border bg-secondary/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
                      Ответ менеджера
                    </p>
                    <p className="mt-2 text-sm text-foreground leading-relaxed">
                      {review.managerReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-20 lg:mt-28">
          <h2 className="font-serif text-2xl lg:text-3xl tracking-tight text-foreground mb-8">
            Вам также может понравиться
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
