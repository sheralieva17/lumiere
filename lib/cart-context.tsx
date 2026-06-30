"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { AUTH_CHANGE_EVENT, getAuthToken } from "./client-auth"
import type { Product } from "./products"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  itemCount: number
  total: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const syncCart = useCallback(async () => {
    const token = getAuthToken()

    if (!token) {
      setItems([])
      return
    }

    try {
      const res = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()

      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items)
        return
      }

      setItems([])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    void syncCart()

    const handleAuthChange = () => {
      void syncCart()
    }

    const handleWindowFocus = () => {
      void syncCart()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    window.addEventListener("focus", handleWindowFocus)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      window.removeEventListener("focus", handleWindowFocus)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [syncCart])

  const addItem = useCallback(async (product: Product) => {
    const token = getAuthToken()
    if (!token) return

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setIsCartOpen(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      })
      const data = await res.json()

      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items)
        return
      }
    } catch {}

    await syncCart()
  }, [syncCart])

  const removeItem = useCallback(async (productId: string) => {
    const token = getAuthToken()
    if (!token) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
      return
    }

    setItems((prev) => prev.filter((item) => item.product.id !== productId))

    try {
      const res = await fetch(
        `/api/cart?productId=${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await res.json()

      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items)
        return
      }
    } catch {}

    await syncCart()
  }, [syncCart])

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const token = getAuthToken()

      if (quantity <= 0) {
        await removeItem(productId)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )

      if (!token) return

      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            quantity,
          }),
        })
        const data = await res.json()

        if (res.ok && Array.isArray(data.items)) {
          setItems(data.items)
          return
        }
      } catch {}

      await syncCart()
    },
    [removeItem, syncCart]
  )

  const clearCart = useCallback(async () => {
    const token = getAuthToken()
    setItems([])

    if (!token) return

    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      await syncCart()
    }
  }, [syncCart])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
