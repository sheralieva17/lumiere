import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"
import {
  createAdminProduct,
  deleteAdminProduct,
  listProductsForAdmin,
  updateAdminProduct,
} from "@/lib/services/admin-service"

const CATEGORIES = ["skincare", "makeup", "fragrance", "haircare"] as const

function parsePayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name : ""
  const description = typeof body.description === "string" ? body.description : ""
  const image = typeof body.image === "string" ? body.image : ""
  const gallery = Array.isArray(body.gallery)
    ? body.gallery.filter((item): item is string => typeof item === "string")
    : []
  const brand = typeof body.brand === "string" ? body.brand : ""
  const price =
    typeof body.price === "number"
      ? body.price
      : Number(typeof body.price === "string" ? body.price : NaN)
  const stock =
    typeof body.stock === "number"
      ? body.stock
      : Number(typeof body.stock === "string" ? body.stock : NaN)
  const category = body.category

  if (!name || !description || !image || Number.isNaN(price) || Number.isNaN(stock)) {
    throw new Error("Необходимо заполнить название, описание, изображение, цену и остаток.")
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error("Выбрана некорректная категория.")
  }

  return {
    name,
    description,
    image,
    gallery,
    brand,
    price,
    stock,
    category: category as (typeof CATEGORIES)[number],
  }
}

async function ensureAdmin() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  return requireUserRole(user, ["admin"])
}

export async function GET(req: Request) {
  try {
    await ensureAdmin()
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || "1")
    const search = searchParams.get("search")?.trim() || ""
    const category = searchParams.get("category") || "all"
    const sort = searchParams.get("sort") || "newest"

    return NextResponse.json(
      await listProductsForAdmin({
        page: Number.isFinite(page) ? page : 1,
        pageSize: 10,
        search,
        category:
          category === "all" || CATEGORIES.includes(category as (typeof CATEGORIES)[number])
            ? (category as (typeof CATEGORIES)[number] | "all")
            : "all",
        sort:
          sort === "newest" ||
          sort === "oldest" ||
          sort === "price_asc" ||
          sort === "price_desc" ||
          sort === "stock_desc" ||
          sort === "stock_asc"
            ? sort
            : "newest",
      })
    )
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unauthorized"
    const message =
      rawMessage === "Unauthorized"
        ? "Требуется авторизация."
        : rawMessage === "Forbidden"
          ? "Недостаточно прав доступа."
          : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : 401
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: Request) {
  try {
    await ensureAdmin()
    const body = (await req.json()) as Record<string, unknown>
    const product = await createAdminProduct(parsePayload(body))
    return NextResponse.json({ product })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not create product"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not create product"
            ? "Не удалось создать товар."
            : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureAdmin()
    const body = (await req.json()) as Record<string, unknown>
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) {
      return NextResponse.json({ error: "Не указан идентификатор товара." }, { status: 400 })
    }
    const product = await updateAdminProduct({ id, ...parsePayload(body) })
    return NextResponse.json({ product })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not update product"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not update product"
            ? "Не удалось обновить товар."
            : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Не указан идентификатор товара." }, { status: 400 })
    }
    const product = await deleteAdminProduct(id)
    return NextResponse.json({ product })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not delete product"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not delete product"
            ? "Не удалось удалить товар."
            : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
