"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Heart, Star, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { getAuthToken } from "@/lib/client-auth"
import { useFavorites } from "@/lib/favorites-context"
import { formatSom } from "@/lib/format"
import type { Product } from "@/lib/products"

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const favorite = isFavorite(product.id)
  const isOutOfStock = typeof product.stock === "number" && product.stock <= 0

  useEffect(() => {
    setIsAuthenticated(Boolean(getAuthToken()))
  }, [])

  return (
    <div className={`group relative ${isOutOfStock ? "opacity-80" : ""}`}>
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${isOutOfStock ? "grayscale-[0.35]" : "group-hover:scale-105"}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.tag && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full">
              {product.tag}
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute bottom-3 left-3 rounded-full bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-background">
              Нет в наличии
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link href={`/product/${product.id}`}>
            <h3 className="text-sm font-medium text-foreground truncate leading-tight">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-xs text-muted-foreground">
                {product.rating}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatSom(product.price)}
          </p>
        </div>
        {isAuthenticated && (
          <div className="mt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite(product)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                favorite
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-border text-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500"
              }`}
              aria-label={
                favorite
                  ? `Убрать ${product.name} из избранного`
                  : `Добавить ${product.name} в избранное`
              }
            >
              <Heart className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => void addItem(product)}
              disabled={isOutOfStock}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                isOutOfStock
                  ? "cursor-not-allowed border-border/60 text-muted-foreground/60"
                  : "border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              }`}
              aria-label={
                isOutOfStock
                  ? `${product.name} отсутствует в наличии`
                  : `Добавить ${product.name} в корзину`
              }
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
