import { getShopProductsFromDb } from "@/lib/db-products"
import type { Product } from "@/lib/products"

const QUERY_ALIASES: Record<string, string[]> = {
  dry: ["dry", "сух", "dryness", "hydrat", "dehydr", "шелуш", "обезвож"],
  oily: ["oily", "жирн", "sebum", "oil", "блеск"],
  combination: ["combination", "комбинир", "mixed skin"],
  sensitive: ["sensitive", "чувств", "reactive", "раздражен"],
  normal: ["normal", "нормаль"],
  acne: ["acne", "blemish", "breakout", "прыщ", "акне", "post-acne", "высып", "postacne"],
  aging: ["aging", "anti-aging", "wrinkle", "line", "антивозраст", "морщ"],
  dullness: ["dull", "glow", "radiance", "туск", "сиян", "свежест"],
  dryness: ["dry", "сух", "dryness", "hydrat", "dehydr", "шелуш", "обезвож"],
  sensitivity: ["sensitive", "чувств", "redness", "раздраж", "reactive"],
  hyperpigmentation: ["pigment", "spot", "dark spot", "пигмент", "тон", "пятн", "постакне"],
  pores: ["pore", "пор"],
  redness: ["redness", "red", "покрас", "rosacea", "розацеа"],
  cleanser: ["cleanser", "wash", "cleansing", "очищ", "умыва", "пенка", "гель", "для умывания"],
  toner: ["toner", "essence", "тонер", "эссенц", "mist"],
  serum: ["serum", "сыворот", "ampoule", "ампул"],
  moisturizer: ["moisturizer", "cream", "крем", "увлаж", "эмульс", "gel-cream", "гель-крем"],
  treatment: ["treatment", "active", "acid", "ретинол", "кислот", "niacinamide", "azelaic"],
  sunscreen: ["spf", "sunscreen", "sun", "санскрин", "защита от солнца", "spf50", "spf 50"],
  mask: ["mask", "маск", "маска"],
  eye: ["eye", "under-eye", "eyes", "глаз", "вокруг глаз"],
  makeup: ["makeup", "cosmetics", "макияж", "декоратив"],
  fragrance: ["fragrance", "perfume", "parfum", "аромат", "духи", "парфюм"],
  haircare: ["hair", "shampoo", "conditioner", "волос", "шампун", "кондиционер", "для волос", "спрей для волос"],
  budget: ["budget", "cheap", "affordable", "недорог", "дешев", "бюджет"],
  premium: ["premium", "luxury", "дорог", "люкс"],
}

function normalizeQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function queryTerms(query: string) {
  const normalized = normalizeQuery(query)
  const terms = new Set(normalized.split(" ").filter(Boolean))

  for (const aliasGroup of Object.values(QUERY_ALIASES)) {
    if (aliasGroup.some((alias) => normalized.includes(alias))) {
      aliasGroup.forEach((alias) => {
        if (alias.includes(" ")) {
          alias.split(" ").forEach((piece) => terms.add(piece))
        } else {
          terms.add(alias)
        }
      })
    }
  }

  return Array.from(terms)
}

function hasQueryIntent(query: string, aliases: string[]) {
  const normalized = normalizeQuery(query)
  return aliases.some((alias) => normalized.includes(alias))
}

function searchableFields(product: Product) {
  return [
    product.name,
    product.description,
    product.category,
    product.brand ?? "",
    product.tag ?? "",
    ...(product.skinTypes ?? []),
    ...(product.concerns ?? []),
    product.routineStep ?? "",
    product.texture ?? "",
    product.fragranceLevel ?? "",
    product.priceTier ?? "",
    product.sensitiveFriendly ? "sensitive-friendly" : "",
  ]
    .join(" ")
    .toLowerCase()
}

function scoreProduct(product: Product, query: string) {
  const normalized = normalizeQuery(query)
  const haystack = searchableFields(product)
  const terms = queryTerms(query)
  let score = 0

  if (product.name.toLowerCase().includes(normalized) && normalized.length > 2) {
    score += 10
  }

  if ((product.brand ?? "").toLowerCase().includes(normalized) && normalized.length > 2) {
    score += 8
  }

  if (product.category.toLowerCase().includes(normalized) && normalized.length > 2) {
    score += 6
  }

  for (const term of terms) {
    if (term.length < 3) continue

    if (product.name.toLowerCase().includes(term)) score += 5
    else if ((product.brand ?? "").toLowerCase().includes(term)) score += 4
    else if (product.category.toLowerCase().includes(term)) score += 3
    else if (haystack.includes(term)) score += 2
  }

  if (normalized.includes("for dry skin") || normalized.includes("для сух")) {
    if (product.skinTypes?.includes("dry")) score += 5
  }

  if (normalized.includes("for sensitive skin") || normalized.includes("для чувств")) {
    if (product.skinTypes?.includes("sensitive")) score += 5
  }

  if (normalized.includes("for oily skin") || normalized.includes("для жир")) {
    if (product.skinTypes?.includes("oily")) score += 5
  }

  if (hasQueryIntent(query, QUERY_ALIASES.acne) && product.concerns?.includes("acne")) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.redness) &&
    product.concerns?.includes("redness")
  ) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.dullness) &&
    product.concerns?.includes("dullness")
  ) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.hyperpigmentation) &&
    product.concerns?.includes("hyperpigmentation")
  ) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.dryness) &&
    product.concerns?.includes("dryness")
  ) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.sensitivity) &&
    (product.concerns?.includes("sensitivity") || product.sensitiveFriendly)
  ) {
    score += 6
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.cleanser) &&
    product.routineStep === "cleanser"
  ) {
    score += 5
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.moisturizer) &&
    product.routineStep === "moisturizer"
  ) {
    score += 5
  }

  if (hasQueryIntent(query, QUERY_ALIASES.serum) && product.routineStep === "serum") {
    score += 5
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.sunscreen) &&
    product.routineStep === "sunscreen"
  ) {
    score += 5
  }

  if (hasQueryIntent(query, QUERY_ALIASES.mask) && product.routineStep === "mask") {
    score += 5
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.eye) &&
    product.routineStep === "eye-care"
  ) {
    score += 5
  }

  if (
    hasQueryIntent(query, QUERY_ALIASES.haircare) &&
    product.category === "haircare"
  ) {
    score += 6
  }

  return score
}

export async function searchProductsForChat(query: string, limit = 6) {
  const products = await getShopProductsFromDb()

  return products
    .map((product) => ({
      product,
      score: scoreProduct(product, query),
    }))
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, limit)
    .map((item) => item.product)
}

import { formatSom } from "@/lib/format"

export function buildCatalogContext(products: Product[]) {
  if (products.length === 0) {
    return "В каталоге не найдено подходящих товаров."
  }

  return products
    .map((product) => {
      const parts = [
        `${product.name} (${formatSom(product.price)})`,
        `category: ${product.category}`,
        product.brand ? `brand: ${product.brand}` : "",
        `description: ${product.description}`,
        typeof product.stock === "number"
          ? `availability: ${product.stock > 0 ? `in stock (${product.stock})` : "out of stock"}`
          : "",
        product.skinTypes?.length ? `skin types: ${product.skinTypes.join(", ")}` : "",
        product.concerns?.length ? `concerns: ${product.concerns.join(", ")}` : "",
        product.routineStep ? `routine step: ${product.routineStep}` : "",
        product.priceTier ? `price tier: ${product.priceTier}` : "",
      ].filter(Boolean)

      return `- ${parts.join(" | ")}`
    })
    .join("\n")
}
