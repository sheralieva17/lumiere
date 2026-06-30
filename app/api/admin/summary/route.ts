import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"
import { getAdminDashboardSummary } from "@/lib/services/admin-service"

export async function GET() {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    requireUserRole(user, ["admin"])
    return NextResponse.json({ summary: await getAdminDashboardSummary() })
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
