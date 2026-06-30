import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PromoSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 lg:px-16 lg:py-24 text-center">
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-primary-foreground/50 mb-4">
              Limited Time
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl tracking-tight text-primary-foreground text-balance leading-tight">
              Your first order deserves something special
            </h2>
            <p className="mt-4 text-sm lg:text-base text-primary-foreground/70 leading-relaxed">
              Зарегистрируйтесь сегодня и получите скидку 15% на первый заказ,
              а также приятный бонус к покупке.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8"
              asChild
            >
              <Link href="/shop">
                Перейти к покупкам
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
