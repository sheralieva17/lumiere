import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductDetailClient } from "@/components/product-detail-client"
import {
  getProductByIdFromDb,
  getRelatedProductsFromDb,
} from "@/lib/db-products"

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductByIdFromDb(id)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProductsFromDb(
    product.category,
    product.id
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
      <Footer />
    </div>
  )
}
