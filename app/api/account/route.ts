import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken } from "@/lib/mock-store"
import { getDbAccountUser, updateDbUserProfile } from "@/lib/db-users"

export async function GET() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
  }
  const accountUser = await getDbAccountUser(user.id)
  if (!accountUser) {
    return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 })
  }
  return NextResponse.json({ user: accountUser })
}

export async function PATCH(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone, email, avatarDataUrl } = body ?? {}

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Необходимо заполнить имя, фамилию и e-mail." },
        { status: 400 }
      )
    }

    const updated = await updateDbUserProfile(user.id, {
      firstName,
      lastName,
      phone: phone ?? "",
      email,
      avatarDataUrl: typeof avatarDataUrl === "string" ? avatarDataUrl : undefined,
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить профиль."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
