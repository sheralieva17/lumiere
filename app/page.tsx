import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { FeaturedProducts } from "@/components/featured-products"
import { TopBrandsCarousel } from "@/components/top-brands-carousel"
import { PromoSection } from "@/components/promo-section"
import { FeaturesBar } from "@/components/features-bar"
import { Footer } from "@/components/footer"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <TopBrandsCarousel />
        <FeaturedProducts />
        <PromoSection />
        <FeaturesBar />
      </main>
      <Footer />
    </div>
  )
}
