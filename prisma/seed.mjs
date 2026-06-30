import prismaPkg from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pgPkg from "pg"

const { PrismaClient } = prismaPkg
const { Pool } = pgPkg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const databaseUrl = new URL(connectionString)
const username = decodeURIComponent(databaseUrl.username)
const password = decodeURIComponent(databaseUrl.password)
const database = databaseUrl.pathname.replace(/^\//, "")
const host = process.env.PGHOST ?? "/tmp"
const port = Number(process.env.PGPORT ?? databaseUrl.port ?? 5433)

const pool = new Pool({
  user: username,
  password,
  database,
  host,
  port,
})
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

const categories = [
  { name: "Skincare", slug: "skincare", image: "/images/category-skincare.jpg" },
  { name: "Makeup", slug: "makeup", image: "/images/category-makeup.jpg" },
  { name: "Fragrance", slug: "fragrance", image: "/images/category-fragrance.jpg" },
  { name: "Haircare", slug: "haircare", image: "/images/category-haircare.jpg" },
]

const brands = [
  "The Ordinary",
  "Ma:nyo",
  "COSRX",
  "Round Lab",
  "Anua",
  "NARS",
  "MAC Cosmetics",
  "Estee Lauder",
  "Huda Beauty",
  "NYX",
  "Chanel",
  "Dior",
  "Gucci",
  "Yves Saint Laurent",
  "Valentino",
  "Kerastase",
  "Olaplex",
  "Living Proof",
  "Semi dilino",
  "Odele",
]

const products = [
  {
    id: "radiance-serum",
    name: "Radiance Vitamin C Serum",
    description:
      "A brightening serum with 15% vitamin C complex to boost glow and improve uneven tone.",
    image: "/images/product-serum.jpg",
    price: 78,
    categorySlug: "skincare",
    brandName: "The Ordinary",
  },
  {
    id: "hydra-moisturizer",
    name: "Hydra-Glow Moisturizer",
    description:
      "Deep hydration with hyaluronic acid and squalane in a silky daily cream.",
    image: "/images/product-moisturizer.jpg",
    price: 64,
    categorySlug: "skincare",
    brandName: "Ma:nyo",
  },
  {
    id: "clarity-gel-cleanser",
    name: "Clarity Balance Gel Cleanser",
    description:
      "Low-foam gel cleanser that removes excess oil without stripping skin.",
    image: "/images/product-clarity-cleanser.jpg",
    price: 32,
    categorySlug: "skincare",
    brandName: "COSRX",
  },
  {
    id: "barrier-milk-cleanser",
    name: "Barrier Milk Cleanser",
    description:
      "Cream-milk cleanser designed for fragile, sensitized, and dry skin barriers.",
    image: "/images/product-barrier-cleanser.jpg",
    price: 34,
    categorySlug: "skincare",
    brandName: "Round Lab",
  },
  {
    id: "pore-refine-toner",
    name: "Pore Refine Toner",
    description:
      "Alcohol-free toner with niacinamide to refine pores and smooth texture.",
    image: "/images/product-mask.jpg",
    price: 29,
    categorySlug: "skincare",
    brandName: "Anua",
  },
  {
    id: "soothing-cica-toner",
    name: "Soothing Cica Essence Toner",
    description:
      "Hydrating essence-toner with cica and panthenol to calm redness and irritation.",
    image: "/images/product-mask.jpg",
    price: 41,
    categorySlug: "skincare",
    brandName: "The Ordinary",
  },
  {
    id: "blemish-niacinamide-serum",
    name: "Blemish Control Niacinamide Serum",
    description:
      "Niacinamide and zinc serum to reduce visible pores and control congestion.",
    image: "/images/product-serum.jpg",
    price: 39,
    categorySlug: "skincare",
    brandName: "COSRX",
  },
  {
    id: "deep-hyaluronic-serum",
    name: "Deep Hydration Hyaluronic Serum",
    description:
      "Layerable hyaluronic serum for dehydrated skin with immediate plumping feel.",
    image: "/images/product-serum.jpg",
    price: 46,
    categorySlug: "skincare",
    brandName: "Round Lab",
  },
  {
    id: "retinol-night-treatment",
    name: "Retinol Night Treatment",
    description:
      "Encapsulated retinol treatment to improve firmness and smooth fine lines.",
    image: "/images/product-mask.jpg",
    price: 72,
    categorySlug: "skincare",
    brandName: "The Ordinary",
  },
  {
    id: "azelaic-redness-treatment",
    name: "Azelaic Calm Treatment",
    description:
      "Azelaic treatment that targets redness and uneven tone in reactive skin.",
    image: "/images/product-mask.jpg",
    price: 49,
    categorySlug: "skincare",
    brandName: "Anua",
  },
  {
    id: "hydra-gel-cream",
    name: "Hydra Gel-Cream",
    description:
      "Oil-free gel moisturizer that hydrates while keeping shine under control.",
    image: "/images/product-moisturizer.jpg",
    price: 38,
    categorySlug: "skincare",
    brandName: "Ma:nyo",
  },
  {
    id: "ceramide-rich-cream",
    name: "Ceramide Rich Repair Cream",
    description:
      "Barrier-focused ceramide cream for dry patches and overnight recovery.",
    image: "/images/product-moisturizer.jpg",
    price: 58,
    categorySlug: "skincare",
    brandName: "Round Lab",
  },
  {
    id: "daily-mineral-spf50",
    name: "Daily Mineral SPF 50",
    description:
      "Mineral sunscreen with sheer finish and strong UVA/UVB protection.",
    image: "/images/product-moisturizer.jpg",
    price: 37,
    categorySlug: "skincare",
    brandName: "Anua",
  },
  {
    id: "dewy-spf-essence",
    name: "Dewy SPF Essence 40",
    description:
      "Hydrating sunscreen essence that leaves a fresh radiant finish.",
    image: "/images/product-moisturizer.jpg",
    price: 52,
    categorySlug: "skincare",
    brandName: "COSRX",
  },
  {
    id: "revital-eyecream",
    name: "Revitalizing Eye Cream",
    description:
      "Targets fine lines, dark circles, and puffiness with peptides.",
    image: "/images/product-eyecream.jpg",
    price: 56,
    categorySlug: "skincare",
    brandName: "Ma:nyo",
  },
  {
    id: "caffeine-eye-gel",
    name: "Caffeine Depuff Eye Gel",
    description:
      "Cooling eye gel that helps reduce morning puffiness and tired look.",
    image: "/images/product-eyecream.jpg",
    price: 33,
    categorySlug: "skincare",
    brandName: "The Ordinary",
  },
  {
    id: "renewal-mask",
    name: "Overnight Renewal Mask",
    description:
      "Intensive overnight treatment with retinol and niacinamide.",
    image: "/images/product-mask.jpg",
    price: 52,
    categorySlug: "skincare",
    brandName: "COSRX",
  },
  {
    id: "soothing-oat-mask",
    name: "Soothing Oat Recovery Mask",
    description:
      "Weekly calming mask that reduces redness and restores comfort.",
    image: "/images/product-mask.jpg",
    price: 44,
    categorySlug: "skincare",
    brandName: "Round Lab",
  },
  {
    id: "velvet-lipstick",
    name: "Velvet Matte Lipstick",
    description:
      "Rich full-coverage matte lipstick with a comfortable vitamin E base.",
    image: "/images/product-lipstick.jpg",
    price: 36,
    categorySlug: "makeup",
    brandName: "NARS",
  },
  {
    id: "silk-powder",
    name: "Silk Finish Setting Powder",
    description:
      "Ultra-fine setting powder for long wear and pore-blurring finish.",
    image: "/images/product-powder.jpg",
    price: 44,
    categorySlug: "makeup",
    brandName: "MAC Cosmetics",
  },
  {
    id: "double-wear-concealer",
    name: "Double Wear Radiant Concealer",
    description:
      "Long-wear concealer with a natural finish that smooths and brightens.",
    image: "/images/product-powder.jpg",
    price: 42,
    categorySlug: "makeup",
    brandName: "Estee Lauder",
  },
  {
    id: "huda-obsession-palette",
    name: "Obsession Nude Eye Palette",
    description:
      "Highly blendable everyday tones with matte and satin textures.",
    image: "/images/product-lipstick.jpg",
    price: 48,
    categorySlug: "makeup",
    brandName: "Huda Beauty",
  },
  {
    id: "nyx-soft-gloss",
    name: "Soft Shine Lip Gloss",
    description:
      "Lightweight non-sticky gloss for hydrated lips and glossy finish.",
    image: "/images/product-lipstick.jpg",
    price: 18,
    categorySlug: "makeup",
    brandName: "NYX",
  },
  {
    id: "essence-perfume",
    name: "Essence No. 5 Eau de Parfum",
    description:
      "A floral-woody fragrance with jasmine, bergamot, and sandalwood.",
    image: "/images/product-perfume.jpg",
    price: 120,
    categorySlug: "fragrance",
    brandName: "Chanel",
  },
  {
    id: "dior-rose-eau",
    name: "Rose Atelier Eau de Parfum",
    description:
      "Elegant rose-amber composition with soft musk trail.",
    image: "/images/product-perfume.jpg",
    price: 128,
    categorySlug: "fragrance",
    brandName: "Dior",
  },
  {
    id: "gucci-amber-eau",
    name: "Amber Bloom Eau de Parfum",
    description:
      "Warm amber-floral fragrance with subtle woody depth.",
    image: "/images/product-perfume.jpg",
    price: 132,
    categorySlug: "fragrance",
    brandName: "Gucci",
  },
  {
    id: "ysl-velvet-noir",
    name: "Velvet Noir Eau de Parfum",
    description:
      "Bold floral-oriental scent with evening wear character.",
    image: "/images/product-perfume.jpg",
    price: 136,
    categorySlug: "fragrance",
    brandName: "Yves Saint Laurent",
  },
  {
    id: "valentino-roma",
    name: "Roma Night Eau de Parfum",
    description:
      "Modern sweet-woody profile with vanilla and jasmine notes.",
    image: "/images/product-perfume.jpg",
    price: 124,
    categorySlug: "fragrance",
    brandName: "Valentino",
  },
  {
    id: "scalp-balance-shampoo",
    name: "Scalp Balance Shampoo",
    description:
      "Gentle clarifying shampoo that removes buildup while keeping scalp comfort.",
    image: "/images/product-cleanser.jpg",
    price: 34,
    categorySlug: "haircare",
    brandName: "Kerastase",
  },
  {
    id: "silk-repair-conditioner",
    name: "Silk Repair Conditioner",
    description:
      "Nourishing conditioner with lightweight proteins for softness and shine.",
    image: "/images/product-moisturizer.jpg",
    price: 39,
    categorySlug: "haircare",
    brandName: "Olaplex",
  },
  {
    id: "argan-heat-protect-spray",
    name: "Argan Heat Protect Spray",
    description:
      "Daily leave-in spray that protects from heat and reduces frizz.",
    image: "/images/product-serum.jpg",
    price: 29,
    categorySlug: "haircare",
    brandName: "Living Proof",
  },
  {
    id: "semi-dilino-diamond-mask",
    name: "Diamond Hair Mask",
    description:
      "Rich recovery mask for dull, damaged strands and instant shine.",
    image: "/images/product-mask.jpg",
    price: 45,
    categorySlug: "haircare",
    brandName: "Semi dilino",
  },
  {
    id: "odele-air-dry-styler",
    name: "Air Dry Styler Cream",
    description:
      "Defines natural texture and controls frizz without heaviness.",
    image: "/images/product-moisturizer.jpg",
    price: 26,
    categorySlug: "haircare",
    brandName: "Odele",
  },
]

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        image: category.image,
      },
      create: category,
    })
  }

  for (const brandName of brands) {
    const slug = brandName
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    await prisma.brand.upsert({
      where: { slug },
      update: { name: brandName },
      create: {
        name: brandName,
        slug,
      },
    })
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
      select: { id: true },
    })

    const brandSlug = product.brandName
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const brand = await prisma.brand.findUniqueOrThrow({
      where: { slug: brandSlug },
      select: { id: true },
    })

    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        stock: 50,
        categoryId: category.id,
        brandId: brand.id,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        stock: 50,
        categoryId: category.id,
        brandId: brand.id,
      },
    })
  }

  console.log(
    `Seed complete: ${categories.length} categories, ${brands.length} brands, ${products.length} products`
  )
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
