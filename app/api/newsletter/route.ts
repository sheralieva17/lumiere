import { NextResponse } from "next/server"
import { subscribeNewsletterEmail } from "@/lib/db-newsletter"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = typeof body?.email === "string" ? body.email : ""
    const result = await subscribeNewsletterEmail(email)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось оформить подписку."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
