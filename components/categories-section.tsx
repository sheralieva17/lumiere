import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCategoriesFromDb } from "@/lib/db-products"

export async function CategoriesSection() {
  const categories = await getCategoriesFromDb()

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">
            Выберите раздел
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground text-balance">
            Категории товаров
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/30 transition-colors duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                <span className="text-xs tracking-widest uppercase text-card/70 mb-1">
                  {category.count} товаров
                </span>
                <h3 className="font-serif text-2xl text-card tracking-tight">
                  {category.name}
                </h3>
                <div className="mt-3 flex items-center gap-1.5 text-card text-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Смотреть
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
