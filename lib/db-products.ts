import { normalizeBrandName } from "@/lib/brand-normalization"
import { prisma } from "@/lib/prisma"
import {
  categories as staticCategories,
  products as staticProducts,
  type Product,
} from "@/lib/products"

const staticProductMap = new Map(
  staticProducts.map((product) => [product.id, product])
)
const staticCategoryMap = new Map(
  staticCategories.map((category) => [category.slug, category])
)

function mergeDbProduct(
  dbProduct: {
    id: string
    name: string
    description: string
    image: string
    gallery?: string[]
    price: number
    stock: number
    category: { slug: string }
    brand: { name: string }
  }
): Product {
  const staticProduct = staticProductMap.get(dbProduct.id)
  const gallery = Array.isArray(dbProduct.gallery) ? dbProduct.gallery : []

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    image: dbProduct.image,
    gallery: gallery.length > 0 ? gallery : staticProduct?.gallery,
    price: dbProduct.price,
    stock: dbProduct.stock,
    category: dbProduct.category.slug as Product["category"],
    brand: dbProduct.brand.name,
    tag: staticProduct?.tag,
    rating: staticProduct?.rating ?? 0,
    reviews: staticProduct?.reviews ?? 0,
    skinTypes: staticProduct?.skinTypes,
    concerns: staticProduct?.concerns,
    routineStep: staticProduct?.routineStep,
    texture: staticProduct?.texture,
    fragranceLevel: staticProduct?.fragranceLevel,
    priceTier: staticProduct?.priceTier,
    sensitiveFriendly: staticProduct?.sensitiveFriendly,
    avoidForAllergies: staticProduct?.avoidForAllergies,
  }
}

export async function getShopProductsFromDb(filters?: {
  category?: string
  brand?: string
}) {
  const products = await prisma.product.findMany({
    where: {
      ...(filters?.category && filters.category !== "all"
        ? { category: { slug: filters.category } }
        : {}),
    },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  const mergedProducts = products.map(mergeDbProduct)
  const normalizedBrand = normalizeBrandName(filters?.brand)

  if (!normalizedBrand) {
    return mergedProducts
  }

  return mergedProducts.filter(
    (product) => normalizeBrandName(product.brand) === normalizedBrand
  )
}

export async function getProductByIdFromDb(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!product) return undefined

  return mergeDbProduct(product)
}

export async function getRelatedProductsFromDb(
  category: string,
  excludeId: string
) {
  const products = await prisma.product.findMany({
    where: {
      id: { not: excludeId },
      category: { slug: category },
    },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
    take: 4,
    orderBy: {
      createdAt: "asc",
    },
  })

  return products.map(mergeDbProduct)
}

export async function getCategoriesFromDb() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  return categories.map((category) => {
    const staticCategory = staticCategoryMap.get(category.slug)

    return {
      name: category.name,
      slug: category.slug,
      image: category.image ?? staticCategory?.image ?? "/images/category-skincare.jpg",
      count: category._count.products,
    }
  })
}

export async function getFeaturedProductsFromDb() {
  const featuredIds = staticProducts
    .filter((product) => product.tag === "Bestseller")
    .map((product) => product.id)

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: featuredIds,
      },
    },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
  })

  const mergedProducts = products.map(mergeDbProduct)

  return featuredIds
    .map((id) => mergedProducts.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))
}

export async function getProductsByIdsFromDb(ids: string[]) {
  if (ids.length === 0) return []

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
  })

  const mergedProducts = products.map(mergeDbProduct)
  const byId = new Map(mergedProducts.map((product) => [product.id, product]))

  return ids
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product))
}
