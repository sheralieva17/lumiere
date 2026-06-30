"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingBag, Menu, X, Search, User, Heart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { CartDrawer } from "./cart-drawer"
import { SearchDialog } from "./search-dialog"
import { Separator } from "@/components/ui/separator"
import { AUTH_CHANGE_EVENT, getAuthToken } from "@/lib/client-auth"

type NavbarUser = {
  role: "customer" | "manager" | "admin"
}

export function Navbar() {
  const { itemCount, setIsCartOpen } = useCart()
  const { favoritesCount } = useFavorites()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<NavbarUser | null>(null)
  const isAuthenticated = user !== null
  const accountHref =
    user?.role === "manager"
      ? "/manager"
      : user?.role === "admin"
        ? "/admin"
        : "/account"

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const token = getAuthToken()
      if (!token) {
        if (!active) return
        setUser(null)
        return
      }

      try {
        const res = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!active) return
        if (res.ok && data.user?.role) {
          setUser({ role: data.user.role })
          return
        }
        setUser(null)
      } catch {
        if (!active) return
        setUser(null)
      }
    }

    void loadUser()

    const handleAuthChange = () => {
      void loadUser()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      active = false
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Открыть меню"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              <Link
                href="/shop"
                className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Магазин
              </Link>
              <Link
                href="/shop?category=skincare"
                className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Уход
              </Link>
              <Link
                href="/shop?category=makeup"
                className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Макияж
              </Link>
              <Link
                href="/shop?category=haircare"
                className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Волосы
              </Link>
            </nav>

            {/* Logo */}
            <Link
              href="/"
              className="font-serif text-[1.9rem] tracking-[0.22em] text-foreground lg:text-[2.2rem]"
            >
              LUMIERE
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <button
                className="hidden lg:block text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="Поиск"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href={accountHref}
                className="hidden lg:block text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Аккаунт"
              >
                <User className="h-5 w-5" />
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/favorites"
                    className="relative text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Избранное: ${favoritesCount}`}
                  >
                    <Heart className="h-5 w-5" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>
                  <button
                    className="relative text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsCartOpen(true)}
                    aria-label={`Корзина: ${itemCount}`}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav
            className="lg:hidden border-t border-border bg-background"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              <button
                className="text-sm tracking-wide uppercase text-foreground text-left flex items-center gap-2"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setSearchOpen(true)
                }}
              >
                <Search className="h-4 w-4" />
                Поиск
              </button>
              <Link
                href="/shop"
                className="text-sm tracking-wide uppercase text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Все товары
              </Link>
              <Link
                href="/shop?category=skincare"
                className="text-sm tracking-wide uppercase text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Уход
              </Link>
              <Link
                href="/shop?category=makeup"
                className="text-sm tracking-wide uppercase text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Макияж
              </Link>
              <Link
                href="/shop?category=haircare"
                className="text-sm tracking-wide uppercase text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Волосы
              </Link>
              <Link
                href="/shop?category=fragrance"
                className="text-sm tracking-wide uppercase text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ароматы
              </Link>
              {isAuthenticated && (
                <Link
                  href="/favorites"
                  className="text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  Избранное
                </Link>
              )}
              <Separator className="my-1" />
              <Link
                href={accountHref}
                className="text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Аккаунт
              </Link>
            </div>
          </nav>
        )}
      </header>
      <CartDrawer />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
