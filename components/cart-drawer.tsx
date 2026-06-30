"use client"

import Image from "next/image"
import Link from "next/link"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { formatSom } from "@/lib/format"

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    itemCount,
    total,
    isCartOpen,
    setIsCartOpen,
  } = useCart()

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex flex-col bg-card w-full sm:max-w-md">
        <SheetHeader className="px-1">
          <SheetTitle className="font-serif text-xl tracking-tight text-card-foreground">
            Корзина ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Корзина пуста
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Добавьте товары, чтобы начать покупки
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsCartOpen(false)}
              asChild
            >
              <Link href="/shop">Продолжить покупки</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium text-card-foreground leading-tight">
                            {item.product.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {formatSom(item.product.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-muted-foreground hover:text-card-foreground transition-colors"
                          aria-label={`Удалить ${item.product.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-card-foreground hover:bg-secondary transition-colors"
                          aria-label="Уменьшить количество"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium text-card-foreground min-w-[1ch] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-card-foreground hover:bg-secondary transition-colors"
                          aria-label="Увеличить количество"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Сумма товаров</span>
                <span className="text-lg font-medium text-card-foreground">
                  {formatSom(total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Доставка и налог рассчитываются при оформлении
              </p>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                asChild
              >
                <Link href="/cart" onClick={() => setIsCartOpen(false)}>
                  Перейти к оформлению
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
