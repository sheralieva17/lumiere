import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"
import {
  getAdminReportsAnalytics,
  getAdminReportByDate,
  listAdminReports,
} from "@/lib/services/admin-service"

async function ensureAdmin() {
  const token = await getBearerToken()
  const user = getUserByToken(token)
  requireUserRole(user, ["admin"])
}

export async function GET(req: Request) {
  try {
    await ensureAdmin()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const exportFormat = searchParams.get("export")

    if (exportFormat === "csv" || exportFormat === "xls") {
      const { reports, summary } = await getAdminReportsAnalytics({ from, to })
      const rows = [
        ["Дата", "Доставлено", "Отменено", "Выручка", "Менеджер", "Комментарий"],
        ...reports.map((report) => [
          String(report.reportDate).slice(0, 10),
          String(report.deliveredOrdersCount),
          String(report.cancelledOrdersCount),
          String(report.deliveredRevenue.toFixed(2)),
          report.managerName,
          report.comment.replace(/\s+/g, " ").trim(),
        ]),
        [],
        [
          "ИТОГО",
          String(summary.deliveredOrdersCount),
          String(summary.cancelledOrdersCount),
          String(summary.deliveredRevenue.toFixed(2)),
          "",
          "",
        ],
      ]

      if (exportFormat === "csv") {
        const csv = rows
          .map((row) =>
            row
              .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
              .join(",")
          )
          .join("\n")

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="manager-reports.csv"',
          },
        })
      }

      const htmlRows = rows
        .map(
          (row, index) =>
            `<tr>${row
              .map((value) =>
                index === 0
                  ? `<th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">${String(
                      value ?? ""
                    )}</th>`
                  : `<td style="border:1px solid #ccc;padding:8px;">${String(
                      value ?? ""
                    )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")

      const table = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Manager Reports</title>
  </head>
  <body>
    <table>${htmlRows}</table>
  </body>
</html>`

      return new NextResponse(table, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": 'attachment; filename="manager-reports.xls"',
        },
      })
    }

    const reports = await listAdminReports({ from, to })
    const report = date ? await getAdminReportByDate(date) : null
    const analytics = await getAdminReportsAnalytics({ from, to })

    return NextResponse.json({ reports, report, summary: analytics.summary })
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
