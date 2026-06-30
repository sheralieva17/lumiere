import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-16 lg:py-24">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4">
              Искусство красоты
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-foreground text-balance leading-[1.1]">
              Раскройте
              <br />
              естественное сияние
            </h1>
            <p className="mt-6 text-base lg:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Подобранные средства красоты с чистыми составами,
              приятными текстурами и заметным результатом. Найдите
              свой идеальный уход.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                asChild
              >
                <Link href="/shop">
                  Перейти в каталог
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero image */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary">
              <Image
                src="/images/hero-product.jpeg"
                alt="Премиальный продукт по уходу"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
