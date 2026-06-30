"use client"

import { useState } from "react"
import Link from "next/link"

export function Footer() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<{
    type: "success" | "error" | ""
    message: string
  }>({ type: "", message: "" })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setStatus({ type: "", message: "" })

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Не удалось оформить подписку.")
      }

      setStatus({ type: "success", message: data.message || "Подписка оформлена." })
      setEmail("")
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Не удалось оформить подписку.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-serif text-[2rem] tracking-[0.22em] text-primary-foreground"
            >
              LUMIERE
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70 max-w-xs">
              Подобранные средства красоты с продуманными составами,
              приятными текстурами и заметным результатом.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs tracking-widest uppercase mb-4 text-primary-foreground/50">
              Магазин
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Все товары
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=skincare"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Уход
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=makeup"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Макияж
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=fragrance"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Ароматы
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=haircare"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Волосы
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs tracking-widest uppercase mb-4 text-primary-foreground/50">
              Компания
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <span className="text-sm text-primary-foreground/70">
                  О нас
                </span>
              </li>
              <li>
                <span className="text-sm text-primary-foreground/70">
                  Устойчивое развитие
                </span>
              </li>
              <li>
                <span className="text-sm text-primary-foreground/70">
                  Составы
                </span>
              </li>
              <li>
                <span className="text-sm text-primary-foreground/70">
                  Карьера
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs tracking-widest uppercase mb-4 text-primary-foreground/50">
              Оставайтесь на связи
            </h3>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Получите скидку 10% на первый заказ, эксклюзивные новости и идеи.
            </p>
            <form
              className="flex gap-2"
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                placeholder="Ваш e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border border-primary-foreground/20 bg-transparent px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary-foreground/50 rounded-md"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-foreground text-primary px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/90 transition-colors"
              >
                {submitting ? "Отправка..." : "Подписаться"}
              </button>
            </form>
            {status.message ? (
              <p
                className={`mt-3 text-xs ${
                  status.type === "error"
                    ? "text-red-300"
                    : "text-emerald-300"
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row">
          <p className="text-xs text-primary-foreground/40">
            2026 LUMIERE. Все права защищены.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-primary-foreground/40">
              Политика конфиденциальности
            </span>
            <span className="text-xs text-primary-foreground/40">
              Условия использования
            </span>
            <span className="text-xs text-primary-foreground/40">
              Доставка и возврат
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
