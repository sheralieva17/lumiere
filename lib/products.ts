export type SkinType = "oily" | "dry" | "combination" | "sensitive" | "normal"
export type SkinConcern =
  | "acne"
  | "aging"
  | "dullness"
  | "dryness"
  | "sensitivity"
  | "hyperpigmentation"
  | "pores"
  | "redness"

export type SensitivityLevel = "low" | "medium" | "high"
export type RoutineLevel = "minimal" | "moderate" | "comprehensive"
export type BudgetLevel = "budget" | "mid" | "premium"
export type TexturePreference = "lightweight" | "balanced" | "rich"
export type FragrancePreference =
  | "fragrance-free"
  | "light-fragrance"
  | "no-preference"
export type AllergyTag =
  | "none"
  | "fragrance"
  | "essential-oils"
  | "alcohol-denat"
  | "nuts"

export interface RecommendationProfile {
  skinType: SkinType
  concerns: SkinConcern[]
  ageRange: string
  routine: RoutineLevel
  sensitivityLevel: SensitivityLevel
  allergies: AllergyTag[]
  texturePreference: TexturePreference
  fragrancePreference: FragrancePreference
  budget: BudgetLevel
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock?: number
  image: string
  gallery?: string[]
  category: "skincare" | "makeup" | "fragrance" | "haircare"
  brand?: string
  tag?: string
  rating: number
  reviews: number
  skinTypes?: SkinType[]
  concerns?: SkinConcern[]
  routineStep?:
    | "cleanser"
    | "toner"
    | "serum"
    | "moisturizer"
    | "treatment"
    | "sunscreen"
    | "mask"
    | "eye-care"
    | "makeup"
    | "fragrance"
  texture?: TexturePreference
  fragranceLevel?: "fragrance-free" | "light-fragrance" | "fragranced"
  priceTier?: BudgetLevel
  sensitiveFriendly?: boolean
  avoidForAllergies?: Exclude<AllergyTag, "none">[]
}

const baseProducts: Product[] = [
  {
    id: "radiance-serum",
    name: "Radiance Vitamin C Serum",
    description:
      "A brightening serum with 15% vitamin C complex to boost glow and improve uneven tone.",
    price: 78,
    image: "/images/product-serum.jpg",
    category: "skincare",
    tag: "Bestseller",
    rating: 4.9,
    reviews: 342,
    skinTypes: ["normal", "oily", "combination"],
    concerns: ["dullness", "hyperpigmentation", "aging"],
    routineStep: "serum",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "premium",
    sensitiveFriendly: true,
  },
  {
    id: "hydra-moisturizer",
    name: "Hydra-Glow Moisturizer",
    description:
      "Deep hydration with hyaluronic acid and squalane in a silky daily cream.",
    price: 64,
    image: "/images/product-moisturizer.jpg",
    category: "skincare",
    tag: "New",
    rating: 4.8,
    reviews: 218,
    skinTypes: ["dry", "normal", "sensitive"],
    concerns: ["dryness", "dullness", "redness"],
    routineStep: "moisturizer",
    texture: "rich",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "clarity-gel-cleanser",
    name: "Clarity Balance Gel Cleanser",
    description:
      "Low-foam gel cleanser that removes excess oil without stripping skin.",
    price: 32,
    image: "/images/product-clarity-cleanser.jpg",
    category: "skincare",
    rating: 4.7,
    reviews: 201,
    skinTypes: ["oily", "combination", "normal"],
    concerns: ["acne", "pores"],
    routineStep: "cleanser",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "barrier-milk-cleanser",
    name: "Barrier Milk Cleanser",
    description:
      "Cream-milk cleanser designed for fragile, sensitized, and dry skin barriers.",
    price: 34,
    image: "/images/product-barrier-cleanser.jpg",
    category: "skincare",
    rating: 4.8,
    reviews: 167,
    skinTypes: ["dry", "sensitive", "normal"],
    concerns: ["dryness", "sensitivity", "redness"],
    routineStep: "cleanser",
    texture: "rich",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "pore-refine-toner",
    name: "Pore Refine Toner",
    description:
      "Alcohol-free toner with niacinamide to refine pores and smooth texture.",
    price: 29,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.6,
    reviews: 145,
    skinTypes: ["oily", "combination", "normal"],
    concerns: ["pores", "acne", "dullness"],
    routineStep: "toner",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "soothing-cica-toner",
    name: "Soothing Cica Essence Toner",
    description:
      "Hydrating essence-toner with cica and panthenol to calm redness and irritation.",
    price: 41,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.8,
    reviews: 189,
    skinTypes: ["sensitive", "dry", "normal", "combination"],
    concerns: ["redness", "sensitivity", "dryness"],
    routineStep: "toner",
    texture: "balanced",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "blemish-niacinamide-serum",
    name: "Blemish Control Niacinamide Serum",
    description:
      "Niacinamide and zinc serum to reduce visible pores and control congestion.",
    price: 39,
    image: "/images/product-serum.jpg",
    category: "skincare",
    rating: 4.7,
    reviews: 322,
    skinTypes: ["oily", "combination", "normal"],
    concerns: ["acne", "pores", "redness"],
    routineStep: "serum",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "deep-hyaluronic-serum",
    name: "Deep Hydration Hyaluronic Serum",
    description:
      "Layerable hyaluronic serum for dehydrated skin with immediate plumping feel.",
    price: 46,
    image: "/images/product-serum.jpg",
    category: "skincare",
    rating: 4.8,
    reviews: 276,
    skinTypes: ["dry", "normal", "sensitive", "combination"],
    concerns: ["dryness", "dullness", "sensitivity"],
    routineStep: "serum",
    texture: "balanced",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "retinol-night-treatment",
    name: "Retinol Night Treatment",
    description:
      "Encapsulated retinol treatment to improve firmness and smooth fine lines.",
    price: 72,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.6,
    reviews: 163,
    skinTypes: ["normal", "combination", "oily"],
    concerns: ["aging", "dullness", "pores"],
    routineStep: "treatment",
    texture: "balanced",
    fragranceLevel: "light-fragrance",
    priceTier: "premium",
    avoidForAllergies: ["fragrance"],
  },
  {
    id: "azelaic-redness-treatment",
    name: "Azelaic Calm Treatment",
    description:
      "Azelaic treatment that targets redness and uneven tone in reactive skin.",
    price: 49,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.8,
    reviews: 142,
    skinTypes: ["sensitive", "normal", "combination"],
    concerns: ["redness", "sensitivity", "hyperpigmentation"],
    routineStep: "treatment",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "hydra-gel-cream",
    name: "Hydra Gel-Cream",
    description:
      "Oil-free gel moisturizer that hydrates while keeping shine under control.",
    price: 38,
    image: "/images/product-moisturizer.jpg",
    category: "skincare",
    rating: 4.7,
    reviews: 211,
    skinTypes: ["oily", "combination", "normal"],
    concerns: ["dryness", "pores", "acne"],
    routineStep: "moisturizer",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "ceramide-rich-cream",
    name: "Ceramide Rich Repair Cream",
    description:
      "Barrier-focused ceramide cream for dry patches and overnight recovery.",
    price: 58,
    image: "/images/product-moisturizer.jpg",
    category: "skincare",
    rating: 4.9,
    reviews: 304,
    skinTypes: ["dry", "sensitive", "normal"],
    concerns: ["dryness", "sensitivity", "aging"],
    routineStep: "moisturizer",
    texture: "rich",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "daily-mineral-spf50",
    name: "Daily Mineral SPF 50",
    description:
      "Mineral sunscreen with sheer finish and strong UVA/UVB protection.",
    price: 37,
    image: "/images/product-moisturizer.jpg",
    category: "skincare",
    tag: "Bestseller",
    rating: 4.8,
    reviews: 418,
    skinTypes: ["sensitive", "dry", "normal", "combination", "oily"],
    concerns: ["redness", "hyperpigmentation", "aging"],
    routineStep: "sunscreen",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "dewy-spf-essence",
    name: "Dewy SPF Essence 40",
    description:
      "Hydrating sunscreen essence that leaves a fresh radiant finish.",
    price: 52,
    image: "/images/product-moisturizer.jpg",
    category: "skincare",
    rating: 4.7,
    reviews: 233,
    skinTypes: ["dry", "normal", "combination"],
    concerns: ["dryness", "dullness", "hyperpigmentation"],
    routineStep: "sunscreen",
    texture: "balanced",
    fragranceLevel: "light-fragrance",
    priceTier: "mid",
    avoidForAllergies: ["fragrance"],
  },
  {
    id: "revital-eyecream",
    name: "Revitalizing Eye Cream",
    description:
      "Targets fine lines, dark circles, and puffiness with peptides.",
    price: 56,
    image: "/images/product-eyecream.jpg",
    category: "skincare",
    tag: "Bestseller",
    rating: 4.8,
    reviews: 295,
    skinTypes: ["normal", "dry", "combination", "sensitive"],
    concerns: ["aging", "dullness", "dryness"],
    routineStep: "eye-care",
    texture: "rich",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "caffeine-eye-gel",
    name: "Caffeine Depuff Eye Gel",
    description:
      "Cooling eye gel that helps reduce morning puffiness and tired look.",
    price: 33,
    image: "/images/product-eyecream.jpg",
    category: "skincare",
    rating: 4.6,
    reviews: 174,
    skinTypes: ["oily", "combination", "normal", "sensitive"],
    concerns: ["dullness", "redness"],
    routineStep: "eye-care",
    texture: "lightweight",
    fragranceLevel: "fragrance-free",
    priceTier: "budget",
    sensitiveFriendly: true,
  },
  {
    id: "renewal-mask",
    name: "Overnight Renewal Mask",
    description:
      "Intensive overnight treatment with retinol and niacinamide.",
    price: 52,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.5,
    reviews: 156,
    skinTypes: ["normal", "combination", "oily"],
    concerns: ["aging", "pores", "dullness", "acne"],
    routineStep: "mask",
    texture: "balanced",
    fragranceLevel: "light-fragrance",
    priceTier: "mid",
    avoidForAllergies: ["fragrance"],
  },
  {
    id: "soothing-oat-mask",
    name: "Soothing Oat Recovery Mask",
    description:
      "Weekly calming mask that reduces redness and restores comfort.",
    price: 44,
    image: "/images/product-mask.jpg",
    category: "skincare",
    rating: 4.8,
    reviews: 208,
    skinTypes: ["sensitive", "dry", "normal"],
    concerns: ["redness", "sensitivity", "dryness"],
    routineStep: "mask",
    texture: "rich",
    fragranceLevel: "fragrance-free",
    priceTier: "mid",
    sensitiveFriendly: true,
  },
  {
    id: "velvet-lipstick",
    name: "Velvet Matte Lipstick",
    description:
      "Rich full-coverage matte lipstick with a comfortable vitamin E base.",
    price: 36,
    image: "/images/product-lipstick.jpg",
    category: "makeup",
    rating: 4.7,
    reviews: 567,
    routineStep: "makeup",
    priceTier: "budget",
  },
  {
    id: "silk-powder",
    name: "Silk Finish Setting Powder",
    description:
      "Ultra-fine setting powder for long wear and pore-blurring finish.",
    price: 44,
    image: "/images/product-powder.jpg",
    category: "makeup",
    tag: "New",
    rating: 4.7,
    reviews: 412,
    skinTypes: ["oily", "combination"],
    concerns: ["pores"],
    routineStep: "makeup",
    texture: "lightweight",
    priceTier: "mid",
  },
  {
    id: "essence-perfume",
    name: "Essence No. 5 Eau de Parfum",
    description:
      "A floral-woody fragrance with jasmine, bergamot, and sandalwood.",
    price: 120,
    image: "/images/product-perfume.jpg",
    category: "fragrance",
    tag: "Bestseller",
    rating: 4.9,
    reviews: 431,
    routineStep: "fragrance",
    fragranceLevel: "fragranced",
    priceTier: "premium",
    avoidForAllergies: ["fragrance", "essential-oils"],
  },
  {
    id: "scalp-balance-shampoo",
    name: "Scalp Balance Shampoo",
    description:
      "Gentle clarifying shampoo that removes buildup while keeping scalp comfort.",
    price: 34,
    image: "/images/product-cleanser.jpg",
    category: "haircare",
    rating: 4.7,
    reviews: 184,
    priceTier: "budget",
  },
  {
    id: "silk-repair-conditioner",
    name: "Silk Repair Conditioner",
    description:
      "Nourishing conditioner with lightweight proteins for softness and shine.",
    price: 39,
    image: "/images/product-moisturizer.jpg",
    category: "haircare",
    tag: "New",
    rating: 4.8,
    reviews: 139,
    priceTier: "mid",
  },
  {
    id: "argan-heat-protect-spray",
    name: "Argan Heat Protect Spray",
    description:
      "Daily leave-in spray that protects from heat and reduces frizz.",
    price: 29,
    image: "/images/product-serum.jpg",
    category: "haircare",
    rating: 4.6,
    reviews: 207,
    priceTier: "budget",
  },
  {
    id: "double-wear-concealer",
    name: "Double Wear Radiant Concealer",
    description:
      "Long-wear concealer with a natural finish that smooths and brightens.",
    price: 42,
    image: "/images/product-powder.jpg",
    category: "makeup",
    rating: 4.7,
    reviews: 259,
    routineStep: "makeup",
    priceTier: "mid",
  },
  {
    id: "huda-obsession-palette",
    name: "Obsession Nude Eye Palette",
    description:
      "Highly blendable everyday tones with matte and satin textures.",
    price: 48,
    image: "/images/product-lipstick.jpg",
    category: "makeup",
    rating: 4.8,
    reviews: 317,
    routineStep: "makeup",
    priceTier: "mid",
  },
  {
    id: "nyx-soft-gloss",
    name: "Soft Shine Lip Gloss",
    description:
      "Lightweight non-sticky gloss for hydrated lips and glossy finish.",
    price: 18,
    image: "/images/product-lipstick.jpg",
    category: "makeup",
    rating: 4.6,
    reviews: 402,
    routineStep: "makeup",
    priceTier: "budget",
  },
  {
    id: "dior-rose-eau",
    name: "Rose Atelier Eau de Parfum",
    description:
      "Elegant rose-amber composition with soft musk trail.",
    price: 128,
    image: "/images/product-perfume.jpg",
    category: "fragrance",
    rating: 4.8,
    reviews: 286,
    routineStep: "fragrance",
    fragranceLevel: "fragranced",
    priceTier: "premium",
    avoidForAllergies: ["fragrance", "essential-oils"],
  },
  {
    id: "gucci-amber-eau",
    name: "Amber Bloom Eau de Parfum",
    description:
      "Warm amber-floral fragrance with subtle woody depth.",
    price: 132,
    image: "/images/product-perfume.jpg",
    category: "fragrance",
    rating: 4.7,
    reviews: 198,
    routineStep: "fragrance",
    fragranceLevel: "fragranced",
    priceTier: "premium",
    avoidForAllergies: ["fragrance", "essential-oils"],
  },
  {
    id: "ysl-velvet-noir",
    name: "Velvet Noir Eau de Parfum",
    description:
      "Bold floral-oriental scent with evening wear character.",
    price: 136,
    image: "/images/product-perfume.jpg",
    category: "fragrance",
    rating: 4.8,
    reviews: 245,
    routineStep: "fragrance",
    fragranceLevel: "fragranced",
    priceTier: "premium",
    avoidForAllergies: ["fragrance", "essential-oils"],
  },
  {
    id: "valentino-roma",
    name: "Roma Night Eau de Parfum",
    description:
      "Modern sweet-woody profile with vanilla and jasmine notes.",
    price: 124,
    image: "/images/product-perfume.jpg",
    category: "fragrance",
    rating: 4.7,
    reviews: 223,
    routineStep: "fragrance",
    fragranceLevel: "fragranced",
    priceTier: "premium",
    avoidForAllergies: ["fragrance", "essential-oils"],
  },
  {
    id: "semi-dilino-diamond-mask",
    name: "Diamond Hair Mask",
    description:
      "Rich recovery mask for dull, damaged strands and instant shine.",
    price: 45,
    image: "/images/product-mask.jpg",
    category: "haircare",
    rating: 4.7,
    reviews: 176,
    priceTier: "mid",
  },
  {
    id: "odele-air-dry-styler",
    name: "Air Dry Styler Cream",
    description:
      "Defines natural texture and controls frizz without heaviness.",
    price: 26,
    image: "/images/product-moisturizer.jpg",
    category: "haircare",
    rating: 4.6,
    reviews: 211,
    priceTier: "budget",
  },
]

const BRAND_BY_PRODUCT_ID: Record<string, string> = {
  "radiance-serum": "The Ordinary",
  "hydra-moisturizer": "Ma:nyo",
  "clarity-gel-cleanser": "COSRX",
  "barrier-milk-cleanser": "Round Lab",
  "pore-refine-toner": "Anua",
  "soothing-cica-toner": "The Ordinary",
  "blemish-niacinamide-serum": "COSRX",
  "deep-hyaluronic-serum": "Round Lab",
  "retinol-night-treatment": "The Ordinary",
  "azelaic-redness-treatment": "Anua",
  "hydra-gel-cream": "Ma:nyo",
  "ceramide-rich-cream": "Round Lab",
  "daily-mineral-spf50": "Anua",
  "dewy-spf-essence": "COSRX",
  "revital-eyecream": "Ma:nyo",
  "caffeine-eye-gel": "The Ordinary",
  "renewal-mask": "COSRX",
  "soothing-oat-mask": "Round Lab",
  "velvet-lipstick": "NARS",
  "silk-powder": "MAC Cosmetics",
  "double-wear-concealer": "Estee Lauder",
  "huda-obsession-palette": "Huda Beauty",
  "nyx-soft-gloss": "NYX",
  "essence-perfume": "Chanel",
  "dior-rose-eau": "Dior",
  "gucci-amber-eau": "Gucci",
  "ysl-velvet-noir": "Yves Saint Laurent",
  "valentino-roma": "Valentino",
  "scalp-balance-shampoo": "Kerastase",
  "silk-repair-conditioner": "Olaplex",
  "argan-heat-protect-spray": "Living Proof",
  "semi-dilino-diamond-mask": "Semi dilino",
  "odele-air-dry-styler": "Odele",
}

export const products: Product[] = baseProducts.map((product) => ({
  ...product,
  brand: BRAND_BY_PRODUCT_ID[product.id] ?? product.brand,
}))

export const categories = [
  {
    name: "Skincare",
    slug: "skincare",
    image: "/images/category-skincare.jpg",
    count: products.filter((p) => p.category === "skincare").length,
  },
  {
    name: "Makeup",
    slug: "makeup",
    image: "/images/category-makeup.jpg",
    count: products.filter((p) => p.category === "makeup").length,
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    image: "/images/category-fragrance.jpg",
    count: products.filter((p) => p.category === "fragrance").length,
  },
  {
    name: "Haircare",
    slug: "haircare",
    image: "/images/category-haircare.jpg",
    count: products.filter((p) => p.category === "haircare").length,
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.tag === "Bestseller")
}

function budgetScore(product: Product, budget: BudgetLevel) {
  const tier = product.priceTier ?? "mid"
  if (budget === "budget") {
    if (tier === "budget") return 3
    if (tier === "mid") return 1
    return -1
  }
  if (budget === "mid") {
    if (tier === "mid") return 3
    if (tier === "budget" || tier === "premium") return 1
    return 0
  }
  if (tier === "premium") return 3
  if (tier === "mid") return 1
  return 0
}

function routineStepScore(product: Product, routine: RoutineLevel) {
  const step = product.routineStep
  if (!step) return 0

  if (routine === "minimal") {
    return ["cleanser", "serum", "moisturizer", "sunscreen"].includes(step)
      ? 2
      : -1
  }
  if (routine === "moderate") {
    return ["cleanser", "toner", "serum", "moisturizer", "sunscreen", "eye-care"].includes(
      step
    )
      ? 2
      : 0
  }
  return 2
}

function allergyPenalty(product: Product, allergies: AllergyTag[]) {
  const active = allergies.filter((a) => a !== "none")
  if (active.length === 0) return 0
  const blocked = product.avoidForAllergies ?? []
  const hits = active.filter((a) => blocked.includes(a as Exclude<AllergyTag, "none">)).length
  return hits > 0 ? -8 * hits : 0
}

export function getRecommendations(profile: RecommendationProfile): Product[] {
  const scored = products
    .filter((product) => {
      if (product.category !== "skincare") return false
      if (profile.sensitivityLevel === "high" && product.sensitiveFriendly === false) {
        return false
      }
      return true
    })
    .map((product) => {
      let score = 0

      if (product.skinTypes?.includes(profile.skinType)) score += 5

      profile.concerns.forEach((concern) => {
        if (product.concerns?.includes(concern)) score += 3
      })

      if (product.texture === profile.texturePreference) score += 2
      if (
        profile.fragrancePreference === "fragrance-free" &&
        product.fragranceLevel === "fragrance-free"
      ) {
        score += 3
      } else if (
        profile.fragrancePreference === "light-fragrance" &&
        product.fragranceLevel === "light-fragrance"
      ) {
        score += 2
      } else if (profile.fragrancePreference !== "no-preference") {
        score -= 1
      }

      score += budgetScore(product, profile.budget)
      score += routineStepScore(product, profile.routine)
      score += allergyPenalty(product, profile.allergies)

      if (profile.sensitivityLevel === "high" && product.sensitiveFriendly) score += 3
      if (profile.sensitivityLevel === "medium" && product.sensitiveFriendly) score += 1

      score += product.rating * 0.4
      return { product, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((item) => item.product)
}
