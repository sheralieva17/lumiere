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

interface FavoritesContextType {
  items: Product[]
  addFavorite: (product: Product) => Promise<void>
  removeFavorite: (productId: string) => Promise<void>
  toggleFavorite: (product: Product) => Promise<void>
  isFavorite: (productId: string) => boolean
  clearFavorites: () => Promise<void>
  favoritesCount: number
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  const syncFavorites = useCallback(async () => {
    const token = getAuthToken()

    if (!token) {
      setItems([])
      return
    }

    try {
      const res = await fetch("/api/favorites", {
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
    void syncFavorites()

    const handleAuthChange = () => {
      void syncFavorites()
    }

    const handleWindowFocus = () => {
      void syncFavorites()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    window.addEventListener("focus", handleWindowFocus)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      window.removeEventListener("focus", handleWindowFocus)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [syncFavorites])

  const toggleFavorite = useCallback(async (product: Product) => {
    const token = getAuthToken()
    if (!token) return

    const optimisticExists = items.some((item) => item.id === product.id)

    setItems((prev) =>
      optimisticExists
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product]
    )

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      })

      const data = await res.json()
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items)
        return
      }
    } catch {}

    await syncFavorites()
  }, [items, syncFavorites])

  const addFavorite = useCallback(async (product: Product) => {
    if (items.some((item) => item.id === product.id)) return
    await toggleFavorite(product)
  }, [items, toggleFavorite])

  const removeFavorite = useCallback(async (productId: string) => {
    const product = items.find((item) => item.id === productId)
    if (!product) return
    await toggleFavorite(product)
  }, [items, toggleFavorite])

  const isFavorite = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  )

  const clearFavorites = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setItems([])
      return
    }

    setItems([])

    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      await syncFavorites()
    }
  }, [syncFavorites])

  return (
    <FavoritesContext.Provider
      value={{
        items,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        favoritesCount: items.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
