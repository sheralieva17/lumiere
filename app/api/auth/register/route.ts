import { NextResponse } from "next/server"
import { registerDbUser } from "@/lib/db-users"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, password, phone } = body ?? {}

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Необходимо заполнить имя, фамилию, e-mail и пароль." },
        { status: 400 }
      )
    }

    const result = await registerDbUser({
      firstName,
      lastName,
      email,
      password,
      phone,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось выполнить регистрацию."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
