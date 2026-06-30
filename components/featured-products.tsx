import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeaturedProductsFromDb } from "@/lib/db-products"
import { ProductCard } from "@/components/product-card"

export async function FeaturedProducts() {
  const featured = await getFeaturedProductsFromDb()

  return (
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">
              Выбор покупателей
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground text-balance">
              Bestsellers
            </h2>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            Смотреть все товары
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
