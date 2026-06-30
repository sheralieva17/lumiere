"use client"

import Link from "next/link"
import { Heart, ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/favorites-context"

export default function FavoritesPage() {
  const { items, clearFavorites } = useFavorites()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">
              Ваш выбор
            </p>
            <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground">
              Избранное
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {items.length} товар{items.length !== 1 ? "а" : ""} в избранном
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" onClick={clearFavorites}>
              Очистить избранное
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl tracking-tight text-foreground">
              Избранное пока пусто
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Нажмите на сердечко в карточке товара, чтобы сохранить его здесь.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться в магазин
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
