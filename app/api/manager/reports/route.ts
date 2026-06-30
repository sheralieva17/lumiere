import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"
import {
  getTodayManagerReportSnapshotFromDb,
  saveManagerDailyReportToDb,
} from "@/lib/db-manager-reports"

async function ensureManager() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  requireUserRole(user, ["manager", "admin"])
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function GET() {
  try {
    await ensureManager()
    const snapshot = await getTodayManagerReportSnapshotFromDb()
    return NextResponse.json(snapshot)
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unauthorized"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : 401
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: Request) {
  try {
    const manager = await ensureManager()
    const body = await req.json()
    const comment = typeof body?.comment === "string" ? body.comment : ""
    const report = await saveManagerDailyReportToDb({
      manager,
      comment,
    })
    return NextResponse.json({ report })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not save report"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not save report"
            ? "Не удалось сохранить отчет."
            : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : rawMessage === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
