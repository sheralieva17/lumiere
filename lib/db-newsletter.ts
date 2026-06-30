import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type NewsletterSubscriberRow = {
  id: string
  email: string
  createdAt: Date
}

export async function subscribeNewsletterEmail(emailInput: string) {
  const email = normalizeEmail(emailInput)

  if (!email) {
    throw new Error("Укажите e-mail.")
  }

  if (!isValidEmail(email)) {
    throw new Error("Введите корректный e-mail.")
  }

  const existingRows = await prisma.$queryRaw<NewsletterSubscriberRow[]>`
    SELECT id, email, "createdAt"
    FROM "NewsletterSubscriber"
    WHERE email = ${email}
    LIMIT 1
  `

  if (existingRows[0]) {
    return {
      status: "already_subscribed" as const,
      message: "Этот e-mail уже подписан на рассылку.",
    }
  }

  await prisma.$executeRaw`
    INSERT INTO "NewsletterSubscriber" (id, email, "createdAt")
    VALUES (${randomUUID()}, ${email}, NOW())
  `

  return {
    status: "subscribed" as const,
    message: "Вы успешно подписались на рассылку.",
  }
}
