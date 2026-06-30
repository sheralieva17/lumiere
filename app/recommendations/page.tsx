"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useSkinProfile } from "@/lib/skin-profile-context"
import { getAuthToken } from "@/lib/client-auth"
import { getRecommendations, type Product } from "@/lib/products"
import {
  Sparkles,
  Droplets,
  Sun,
  Moon,
  Shield,
  ChevronRight,
} from "lucide-react"

const skinTypeInfo: Record<
  string,
  { label: string; tip: string; icon: typeof Droplets }
> = {
  oily: {
    label: "Жирная кожа",
    tip: "Сделайте акцент на легких балансирующих слоях и некомедогенном увлажнении.",
    icon: Sun,
  },
  dry: {
    label: "Сухая кожа",
    tip: "Отдавайте приоритет восстанавливающим кремам и увлажняющим слоям для длительного комфорта.",
    icon: Droplets,
  },
  combination: {
    label: "Комбинированная кожа",
    tip: "Сочетайте легкие и более насыщенные формулы, чтобы сбалансировать разные зоны лица.",
    icon: Moon,
  },
  sensitive: {
    label: "Чувствительная кожа",
    tip: "Используйте мягкие средства без отдушек и избегайте известных раздражителей.",
    icon: Shield,
  },
  normal: {
    label: "Нормальная кожа",
    tip: "Поддерживайте стабильный уход и делайте акцент на профилактике с помощью SPF и антиоксидантов.",
    icon: Sparkles,
  },
}

const concernLabels: Record<string, string> = {
  acne: "Акне и высыпания",
  aging: "Мелкие морщины и возрастные изменения",
  dullness: "Тусклость и неровный тон",
  dryness: "Сухость и обезвоженность",
  sensitivity: "Чувствительность и раздражение",
  hyperpigmentation: "Пигментация",
  pores: "Расширенные поры",
  redness: "Покраснение и розацеа",
}

const routineLabel: Record<string, string> = {
  minimal: "Минимальный",
  moderate: "Умеренный",
  comprehensive: "Полный",
}

const budgetLabel: Record<string, string> = {
  budget: "Бюджетный",
  mid: "Средний",
  premium: "Премиум",
}

const fragranceLabel: Record<string, string> = {
  "fragrance-free": "Без отдушек",
  "light-fragrance": "Легкий аромат",
  "no-preference": "Без предпочтений",
}

const sensitivityLabel: Record<string, string> = {
  low: "низкая",
  medium: "средняя",
  high: "высокая",
}

const textureLabel: Record<string, string> = {
  lightweight: "легкая",
  balanced: "сбалансированная",
  rich: "насыщенная",
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { profile, hasCompletedQuiz, setProfile } = useSkinProfile()
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      setMounted(true)
      if (profile) {
        setRecommendations(getRecommendations(profile))
        return
      }

      const token = getAuthToken()
      if (!token) return

      try {
        const res = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data?.user?.hasCompletedQuiz && data?.user?.quizResult) {
          setProfile(data.user.quizResult)
          setRecommendations(getRecommendations(data.user.quizResult))
        }
      } catch {
        // ignore and use fallback UI
      }
    }
    void loadProfile()
  }, [profile, setProfile])

  const mustHave = useMemo(() => recommendations.slice(0, 5), [recommendations])
  const goodMatch = useMemo(() => recommendations.slice(5, 12), [recommendations])
  const optional = useMemo(() => recommendations.slice(12, 18), [recommendations])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">
            Загрузка вашего профиля...
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!hasCompletedQuiz || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-2xl tracking-tight text-foreground">
              Сначала пройдите skin quiz
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Пройдите тест, чтобы мы могли подобрать персональные рекомендации по товарам.
            </p>
            <Button
              onClick={() => router.push("/quiz")}
              size="lg"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Начать тест
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const typeInfo = skinTypeInfo[profile.skinType]
  const TypeIcon = typeInfo.icon

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-secondary/50 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 py-10 lg:py-14">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1">
                <p className="text-xs tracking-wider uppercase text-accent font-medium mb-2">
                  Ваш профиль кожи
                </p>
                <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground text-balance">
                  Персональные рекомендации для типа: {typeInfo.label}
                </h1>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {typeInfo.tip}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.concerns.map((concern) => (
                    <span
                      key={concern}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-background border border-border text-foreground"
                    >
                      {concernLabels[concern] || concern}
                    </span>
                  ))}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-background border border-border text-muted-foreground">
                    Возраст {profile.ageRange}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-background border border-border text-muted-foreground">
                    {routineLabel[profile.routine]} routine
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-background border border-border text-muted-foreground">
                    Budget: {budgetLabel[profile.budget]}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-background border border-border text-muted-foreground">
                    {fragranceLabel[profile.fragrancePreference]}
                  </span>
                </div>

                <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  Тест можно пройти один раз для каждого аккаунта.
                </p>
              </div>

              <div className="flex-shrink-0 bg-card rounded-xl border border-border p-6 w-full lg:w-72 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <TypeIcon className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">{typeInfo.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Чувствительность: {sensitivityLabel[profile.sensitivityLevel]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Текстура: {textureLabel[profile.texturePreference]}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-foreground">
                Ваши персональные рекомендации
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Найдено товаров по вашему профилю: {recommendations.length}
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Смотреть все товары
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {mustHave.length > 0 && (
            <section className="mb-12">
              <h3 className="font-serif text-xl text-foreground mb-2">Основные рекомендации</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Наиболее подходящие товары под ваши задачи ухода.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                {mustHave.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {goodMatch.length > 0 && (
            <section className="mb-12">
              <h3 className="font-serif text-xl text-foreground mb-2">Хорошее совпадение</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Подходящие альтернативы для расширения ухода.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {goodMatch.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {optional.length > 0 && (
            <section>
              <h3 className="font-serif text-xl text-foreground mb-2">Дополнительные средства</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Дополнительные товары, которые можно добавить позже.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6">
                {optional.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {recommendations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">
                Пока не удалось найти достаточно точные совпадения. Попробуйте пройти тест еще раз с меньшими ограничениями.
              </p>
              <Button
                onClick={() => router.push("/quiz")}
                variant="outline"
                className="mt-4"
              >
                Пройти тест заново
              </Button>
            </div>
          )}

          <div className="sm:hidden mt-6">
            <Link
              href="/shop"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Смотреть все товары
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
