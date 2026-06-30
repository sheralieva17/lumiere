import { Truck, Leaf, Sparkles, RefreshCcw } from "lucide-react"

const features = [
  {
    icon: Leaf,
    title: "Чистые составы",
    description: "Продуманные формулы с ингредиентами, которым можно доверять",
  },
  {
    icon: Sparkles,
    title: "Заметный результат",
    description: "Проверенные формулы с реальным видимым эффектом",
  },
  {
    icon: Truck,
    title: "Бесплатная доставка",
    description: "Фиксированная доставка по городу — 200 сом",
  },
  {
    icon: RefreshCcw,
    title: "Легкий возврат",
    description: "Возврат любых товаров в течение 30 дней",
  },
]

export function FeaturesBar() {
  return (
    <section className="py-16 lg:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-foreground tracking-wide">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
