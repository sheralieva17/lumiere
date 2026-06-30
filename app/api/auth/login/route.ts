import { NextResponse } from "next/server"
import { loginDbUser } from "@/lib/db-users"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body ?? {}

    if (!email || !password) {
      return NextResponse.json(
        { error: "Необходимо указать e-mail и пароль." },
        { status: 400 }
      )
    }

    const result = await loginDbUser({ email, password })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить вход."
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
