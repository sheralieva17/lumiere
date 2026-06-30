"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useSkinProfile } from "@/lib/skin-profile-context"
import { getAuthToken } from "@/lib/client-auth"
import type {
  AllergyTag,
  BudgetLevel,
  FragrancePreference,
  RoutineLevel,
  SensitivityLevel,
  SkinConcern,
  SkinType,
  TexturePreference,
} from "@/lib/products"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizStep {
  title: string
  subtitle: string
}

const steps: QuizStep[] = [
  {
    title: "Какой у вас тип кожи?",
    subtitle: "Выберите вариант, который чаще всего соответствует состоянию вашей кожи.",
  },
  {
    title: "Какие у вас основные проблемы кожи?",
    subtitle: "Выберите до 4 проблем, с которыми хотите работать в первую очередь.",
  },
  {
    title: "Насколько чувствительна ваша кожа?",
    subtitle: "Это поможет исключить слишком агрессивные формулы.",
  },
  {
    title: "Есть ли у вас аллергия на компоненты?",
    subtitle: "Выберите все подходящие варианты. Мы исключим эти триггеры.",
  },
  {
    title: "Какую текстуру вы предпочитаете?",
    subtitle: "Выберите то, что наиболее комфортно ощущается на коже.",
  },
  {
    title: "Как вы относитесь к отдушкам?",
    subtitle: "Мы можем отдавать приоритет средствам без запаха или с легким ароматом.",
  },
  {
    title: "Укажите ваш возрастной диапазон",
    subtitle: "Это нужно для более точного подбора ухода и профилактики возрастных изменений.",
  },
  {
    title: "Какой у вас бюджет?",
    subtitle: "Мы будем рекомендовать товары в рамках выбранного бюджета.",
  },
  {
    title: "Насколько подробным должен быть ваш уход?",
    subtitle: "Мы подберем количество средств с учетом вашего образа жизни.",
  },
]

const skinTypeOptions: { value: SkinType; label: string; description: string }[] = [
  {
    value: "oily",
    label: "Жирная",
    description: "Быстро появляется блеск, поры более заметны, высыпания случаются часто.",
  },
  {
    value: "dry",
    label: "Сухая",
    description: "После очищения кожа стягивается, может быть шероховатой или шелушиться.",
  },
  {
    value: "combination",
    label: "Комбинированная",
    description: "Т-зона более жирная, а щеки или линия челюсти суше.",
  },
  {
    value: "sensitive",
    label: "Чувствительная",
    description: "Кожа легко краснеет или реагирует на новые средства.",
  },
  {
    value: "normal",
    label: "Нормальная",
    description: "В целом сбалансированная кожа с редкими незначительными проблемами.",
  },
]

const concernOptions: { value: SkinConcern; label: string }[] = [
  { value: "acne", label: "Акне и высыпания" },
  { value: "aging", label: "Мелкие морщины и возрастные изменения" },
  { value: "dullness", label: "Тусклость и неровный тон" },
  { value: "dryness", label: "Сухость и обезвоженность" },
  { value: "sensitivity", label: "Чувствительность и раздражение" },
  { value: "hyperpigmentation", label: "Пигментация" },
  { value: "pores", label: "Расширенные поры" },
  { value: "redness", label: "Покраснение и розацеа" },
]

const sensitivityOptions: {
  value: SensitivityLevel
  label: string
  description: string
}[] = [
  { value: "low", label: "Низкая", description: "Кожа редко реагирует на средства." },
  { value: "medium", label: "Средняя", description: "Иногда появляется раздражение." },
  {
    value: "high",
    label: "Высокая",
    description: "Кожа часто реагирует и требует очень мягких формул.",
  },
]

const allergyOptions: { value: AllergyTag; label: string }[] = [
  { value: "none", label: "Нет известных аллергий" },
  { value: "fragrance", label: "Отдушки" },
  { value: "essential-oils", label: "Эфирные масла" },
  { value: "alcohol-denat", label: "Alcohol denat." },
  { value: "nuts", label: "Масла на основе орехов" },
]

const textureOptions: {
  value: TexturePreference
  label: string
  description: string
}[] = [
  {
    value: "lightweight",
    label: "Легкая",
    description: "Быстро впитывающиеся гели и флюиды.",
  },
  {
    value: "balanced",
    label: "Сбалансированная",
    description: "Средняя текстура, не слишком легкая и не слишком плотная.",
  },
  {
    value: "rich",
    label: "Насыщенная",
    description: "Питательные кремовые текстуры для максимального комфорта.",
  },
]

const fragranceOptions: {
  value: FragrancePreference
  label: string
  description: string
}[] = [
  {
    value: "fragrance-free",
    label: "Без отдушек",
    description: "По возможности исключаются добавленные ароматизаторы.",
  },
  {
    value: "light-fragrance",
    label: "Легкий аромат",
    description: "Нежный аромат допустим, но без резких запахов.",
  },
  {
    value: "no-preference",
    label: "Без предпочтений",
    description: "Наличие аромата не имеет значения.",
  },
]

const ageOptions = [
  { value: "18-24", label: "18 - 24" },
  { value: "25-34", label: "25 - 34" },
  { value: "35-44", label: "35 - 44" },
  { value: "45-54", label: "45 - 54" },
  { value: "55+", label: "55+" },
]

const budgetOptions: {
  value: BudgetLevel
  label: string
  description: string
}[] = [
  { value: "budget", label: "Бюджетный", description: "Практичные и доступные средства." },
  { value: "mid", label: "Средний", description: "Баланс цены и эффективности." },
  { value: "premium", label: "Премиум", description: "Средства более высокого сегмента." },
]

const routineOptions: {
  value: RoutineLevel
  label: string
  description: string
}[] = [
  {
    value: "minimal",
    label: "Минимальный",
    description: "До 3–4 шагов, просто и быстро.",
  },
  {
    value: "moderate",
    label: "Умеренный",
    description: "5–6 шагов с целевыми средствами.",
  },
  {
    value: "comprehensive",
    label: "Полный",
    description: "Полноценный многоступенчатый уход.",
  },
]

export default function QuizPage() {
  const router = useRouter()
  const { setProfile } = useSkinProfile()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [skinType, setSkinType] = useState<SkinType | null>(null)
  const [concerns, setConcerns] = useState<SkinConcern[]>([])
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel | null>(
    null
  )
  const [allergies, setAllergies] = useState<AllergyTag[]>(["none"])
  const [texturePreference, setTexturePreference] = useState<TexturePreference | null>(
    null
  )
  const [fragrancePreference, setFragrancePreference] =
    useState<FragrancePreference | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [budget, setBudget] = useState<BudgetLevel | null>(null)
  const [routine, setRoutine] = useState<RoutineLevel | null>(null)

  useEffect(() => {
    const checkQuizAccess = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push("/account")
        return
      }

      try {
        const res = await fetch("/api/quiz", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.status === 401) {
          router.push("/account")
          return
        }
        if (!res.ok) {
          throw new Error(data.error || "Не удалось проверить статус теста.")
        }
        if (data.hasCompletedQuiz && data.quizResult) {
          setProfile(data.quizResult)
          router.push("/recommendations")
          return
        }
      } catch {
        router.push("/account")
        return
      } finally {
        setIsCheckingAccess(false)
      }
    }

    void checkQuizAccess()
  }, [router, setProfile])

  const toggleConcern = (concern: SkinConcern) => {
    setConcerns((prev) => {
      if (prev.includes(concern)) return prev.filter((c) => c !== concern)
      if (prev.length >= 4) return prev
      return [...prev, concern]
    })
  }

  const toggleAllergy = (tag: AllergyTag) => {
    setAllergies((prev) => {
      if (tag === "none") return ["none"]
      const withoutNone = prev.filter((item) => item !== "none")
      if (withoutNone.includes(tag)) {
        const next = withoutNone.filter((item) => item !== tag)
        return next.length > 0 ? next : ["none"]
      }
      return [...withoutNone, tag]
    })
  }

  const canProceed =
    (currentStep === 0 && skinType !== null) ||
    (currentStep === 1 && concerns.length > 0) ||
    (currentStep === 2 && sensitivityLevel !== null) ||
    (currentStep === 3 && allergies.length > 0) ||
    (currentStep === 4 && texturePreference !== null) ||
    (currentStep === 5 && fragrancePreference !== null) ||
    (currentStep === 6 && ageRange !== null) ||
    (currentStep === 7 && budget !== null) ||
    (currentStep === 8 && routine !== null)

  const handleNext = async () => {
    setSubmitError("")
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      return
    }

    if (
      skinType &&
      concerns.length > 0 &&
      ageRange &&
      routine &&
      sensitivityLevel &&
      texturePreference &&
      fragrancePreference &&
      budget
    ) {
      const profile = {
        skinType,
        concerns,
        ageRange,
        routine,
        sensitivityLevel,
        allergies,
        texturePreference,
        fragrancePreference,
        budget,
      }

      const token = getAuthToken()
      if (!token) {
        router.push("/account")
        return
      }

      setIsSubmitting(true)
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 409) {
            setProfile(profile)
            router.push("/recommendations")
            return
          }
          throw new Error(data.error || "Не удалось сохранить результаты теста")
        }

        setProfile(profile)
        router.push("/recommendations")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Не удалось сохранить результаты теста"
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Проверка доступа к тесту...</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-xl">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-wider uppercase text-muted-foreground">
                Шаг {currentStep + 1} из {steps.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-serif text-2xl lg:text-3xl tracking-tight text-foreground text-balance">
              {steps[currentStep].title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto text-pretty">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {currentStep === 0 && (
            <div className="flex flex-col gap-3">
              {skinTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSkinType(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    skinType === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      skinType === option.value ? "text-accent" : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <div className="flex flex-wrap gap-3 justify-center">
                {concernOptions.map((option) => {
                  const isSelected = concerns.includes(option.value)
                  const isDisabled = !isSelected && concerns.length >= 4
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleConcern(option.value)}
                      disabled={isDisabled}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm border transition-all duration-200",
                        isSelected
                          ? "bg-accent text-accent-foreground border-accent"
                          : isDisabled
                            ? "border-border text-muted-foreground/40 bg-secondary/50 cursor-not-allowed"
                            : "border-border text-foreground bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {concerns.length > 0 && (
                <p className="text-center mt-4 text-xs text-muted-foreground">
                  Выбрано: {concerns.length}/4
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-3">
              {sensitivityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSensitivityLevel(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    sensitivityLevel === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      sensitivityLevel === option.value
                        ? "text-accent"
                        : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {allergyOptions.map((option) => {
                const selected = allergies.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleAllergy(option.value)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm border transition-all duration-200",
                      selected
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-foreground bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-3">
              {textureOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTexturePreference(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    texturePreference === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      texturePreference === option.value
                        ? "text-accent"
                        : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex flex-col gap-3">
              {fragranceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFragrancePreference(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    fragrancePreference === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      fragrancePreference === option.value
                        ? "text-accent"
                        : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 6 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {ageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAgeRange(option.value)}
                  className={cn(
                    "px-6 py-3 rounded-lg border text-sm font-medium transition-all duration-200",
                    ageRange === option.value
                      ? "border-accent bg-accent/5 text-accent ring-1 ring-accent/20"
                      : "border-border text-foreground bg-card hover:border-muted-foreground/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {currentStep === 7 && (
            <div className="flex flex-col gap-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    budget === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      budget === option.value ? "text-accent" : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 8 && (
            <div className="flex flex-col gap-3">
              {routineOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRoutine(option.value)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200",
                    routine === option.value
                      ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      routine === option.value ? "text-accent" : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                currentStep === 0
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Сохранение..." : "Смотреть рекомендации"}
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          {submitError && (
            <p className="mt-4 text-sm text-destructive text-center">
              {submitError}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
