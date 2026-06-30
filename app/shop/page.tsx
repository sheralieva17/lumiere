import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { getShopProductsFromDb } from "@/lib/db-products"

export const dynamic = "force-dynamic"

function getShopUrl(category: string, brand: string) {
  const params = new URLSearchParams()
  if (category && category !== "all") params.set("category", category)
  if (brand) params.set("brand", brand)
  const query = params.toString()
  return query ? `/shop?${query}` : "/shop"
}

function ShopFilters({
  activeCategory,
  activeBrand,
}: {
  activeCategory: string
  activeBrand: string
}) {
  const categoryOptions = [
    { label: "Все", value: "all" },
    { label: "Уход", value: "skincare" },
    { label: "Макияж", value: "makeup" },
    { label: "Ароматы", value: "fragrance" },
    { label: "Волосы", value: "haircare" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((cat) => (
          <Link
            key={cat.value}
            href={getShopUrl(cat.value, activeBrand)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>
      {activeBrand ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Бренд:</span>
          <span className="rounded-full border border-border px-3 py-1 text-foreground">
            {activeBrand}
          </span>
          <Link
            href={getShopUrl(activeCategory, "")}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Сбросить
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; brand?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const categoryParam = resolvedSearchParams.category || "all"
  const brandParam = resolvedSearchParams.brand || ""
  const filteredProducts = await getShopProductsFromDb({
    category: categoryParam,
    brand: brandParam,
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">
            Наша коллекция
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground">
            Все товары
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <ShopFilters
            activeCategory={categoryParam}
            activeBrand={brandParam}
          />
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} товар
            {filteredProducts.length !== 1 ? "а" : ""}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            По этому фильтру товары не найдены. Попробуйте другой бренд или категорию.
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
