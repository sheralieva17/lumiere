import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { type UserRecord } from "@/lib/mock-store"

function startOfLocalDay(input = new Date()) {
  const date = new Date(input)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfLocalDay(input = new Date()) {
  const date = startOfLocalDay(input)
  date.setDate(date.getDate() + 1)
  return date
}

function parseLocalDateKey(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim())
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
}

function normalizeReport(report: {
  id: string
  reportDate: Date
  deliveredOrdersCount: number
  cancelledOrdersCount: number
  deliveredRevenue: number
  comment: string
  managerId: string
  managerName: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: report.id,
    reportDate: report.reportDate.toISOString(),
    deliveredOrdersCount: report.deliveredOrdersCount,
    cancelledOrdersCount: report.cancelledOrdersCount,
    deliveredRevenue: report.deliveredRevenue,
    comment: report.comment,
    managerId: report.managerId,
    managerName: report.managerName,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}

async function ensureManagerUserInDb(manager: UserRecord) {
  const existing = await prisma.user.findUnique({
    where: { id: manager.id },
    select: { id: true },
  })

  if (existing) return existing.id

  const existingByEmail = await prisma.user.findUnique({
    where: { email: manager.email.trim().toLowerCase() },
    select: { id: true },
  })

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        firstName: manager.firstName,
        lastName: manager.lastName,
        password: manager.password,
        role: manager.role,
        phone: manager.phone ?? "",
        avatarUrl: manager.avatarDataUrl || null,
      },
    })
    return existingByEmail.id
  }

  const created = await prisma.user.create({
    data: {
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email.trim().toLowerCase(),
      password: manager.password,
      phone: manager.phone ?? "",
      avatarUrl: manager.avatarDataUrl || null,
      role: manager.role,
    },
    select: { id: true },
  })

  return created.id
}

type ManagerDailyReportRow = {
  id: string
  reportDate: Date
  deliveredOrdersCount: number
  cancelledOrdersCount: number
  deliveredRevenue: number
  comment: string
  managerId: string
  managerName: string
  createdAt: Date
  updatedAt: Date
}

export type ManagerDailyReportRecord = ReturnType<typeof normalizeReport>

type ReportRangeInput = {
  from?: string | null
  to?: string | null
}

function getReportRangeBounds(input?: ReportRangeInput) {
  const fromDate = input?.from ? parseLocalDateKey(input.from) : null
  const toDate = input?.to ? parseLocalDateKey(input.to) : null

  if (input?.from && !fromDate) {
    throw new Error("Неверный формат начальной даты.")
  }

  if (input?.to && !toDate) {
    throw new Error("Неверный формат конечной даты.")
  }

  const from = fromDate ? startOfLocalDay(fromDate) : null
  const to = toDate ? startOfLocalDay(toDate) : null

  if (from && to && from > to) {
    throw new Error("Начальная дата не может быть позже конечной.")
  }

  const toExclusive = to ? endOfLocalDay(to) : null

  return { from, to, toExclusive }
}

async function getTodayReportMetrics() {
  const from = startOfLocalDay()
  const to = endOfLocalDay()

  const [deliveredOrdersCount, cancelledOrdersCount, revenue] = await Promise.all([
    prisma.order.count({
      where: {
        status: "delivered",
        managerUpdatedAt: {
          gte: from,
          lt: to,
        },
      },
    }),
    prisma.order.count({
      where: {
        status: "cancelled",
        managerUpdatedAt: {
          gte: from,
          lt: to,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: "delivered",
        managerUpdatedAt: {
          gte: from,
          lt: to,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ])

  return {
    from,
    to,
    deliveredOrdersCount,
    cancelledOrdersCount,
    deliveredRevenue: revenue._sum.totalAmount ?? 0,
  }
}

export async function getTodayManagerReportSnapshotFromDb() {
  const { from, deliveredOrdersCount, cancelledOrdersCount, deliveredRevenue } =
    await getTodayReportMetrics()
  const existingRows = await prisma.$queryRaw<ManagerDailyReportRow[]>`
    SELECT
      id,
      "reportDate",
      "deliveredOrdersCount",
      "cancelledOrdersCount",
      "deliveredRevenue",
      comment,
      "managerId",
      "managerName",
      "createdAt",
      "updatedAt"
    FROM "ManagerDailyReport"
    WHERE "reportDate" = ${from}
    LIMIT 1
  `
  const existing = existingRows[0] ?? null

  return {
    reportDate: from.toISOString(),
    deliveredOrdersCount,
    cancelledOrdersCount,
    deliveredRevenue,
    existingReport: existing ? normalizeReport(existing) : null,
  }
}

export async function saveManagerDailyReportToDb(input: {
  manager: UserRecord
  comment: string
}) {
  const managerId = await ensureManagerUserInDb(input.manager)
  const { from, deliveredOrdersCount, cancelledOrdersCount, deliveredRevenue } =
    await getTodayReportMetrics()
  const managerName =
    `${input.manager.firstName} ${input.manager.lastName}`.trim() || input.manager.email
  const comment = input.comment.trim()

  const existingRows = await prisma.$queryRaw<ManagerDailyReportRow[]>`
    SELECT
      id,
      "reportDate",
      "deliveredOrdersCount",
      "cancelledOrdersCount",
      "deliveredRevenue",
      comment,
      "managerId",
      "managerName",
      "createdAt",
      "updatedAt"
    FROM "ManagerDailyReport"
    WHERE "reportDate" = ${from}
    LIMIT 1
  `

  if (existingRows[0]) {
    await prisma.$executeRaw`
      UPDATE "ManagerDailyReport"
      SET
        "deliveredOrdersCount" = ${deliveredOrdersCount},
        "cancelledOrdersCount" = ${cancelledOrdersCount},
        "deliveredRevenue" = ${deliveredRevenue},
        comment = ${comment},
        "managerId" = ${managerId},
        "managerName" = ${managerName},
        "updatedAt" = NOW()
      WHERE "reportDate" = ${from}
    `
  } else {
    await prisma.$executeRaw`
      INSERT INTO "ManagerDailyReport" (
        id,
        "reportDate",
        "deliveredOrdersCount",
        "cancelledOrdersCount",
        "deliveredRevenue",
        comment,
        "managerId",
        "managerName",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${randomUUID()},
        ${from},
        ${deliveredOrdersCount},
        ${cancelledOrdersCount},
        ${deliveredRevenue},
        ${comment},
        ${managerId},
        ${managerName},
        NOW(),
        NOW()
      )
    `
  }

  const savedRows = await prisma.$queryRaw<ManagerDailyReportRow[]>`
    SELECT
      id,
      "reportDate",
      "deliveredOrdersCount",
      "cancelledOrdersCount",
      "deliveredRevenue",
      comment,
      "managerId",
      "managerName",
      "createdAt",
      "updatedAt"
    FROM "ManagerDailyReport"
    WHERE "reportDate" = ${from}
    LIMIT 1
  `

  const report = savedRows[0]
  if (!report) {
    throw new Error("Не удалось сохранить отчет менеджера.")
  }

  return normalizeReport(report)
}

export async function listManagerDailyReportsFromDb(input?: ReportRangeInput) {
  const { from, toExclusive } = getReportRangeBounds(input)
  const reports = await prisma.managerDailyReport.findMany({
    where: {
      ...(from || toExclusive
        ? {
            reportDate: {
              ...(from ? { gte: from } : {}),
              ...(toExclusive ? { lt: toExclusive } : {}),
            },
          }
        : {}),
    },
    orderBy: {
      reportDate: "desc",
    },
  })

  return reports.map(normalizeReport)
}

export async function getManagerDailyReportByDateFromDb(dateString: string) {
  const localDate = parseLocalDateKey(dateString)
  const date = localDate ?? new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid report date")
  }

  const normalized = startOfLocalDay(date)

  const reports = await prisma.$queryRaw<ManagerDailyReportRow[]>`
    SELECT
      id,
      "reportDate",
      "deliveredOrdersCount",
      "cancelledOrdersCount",
      "deliveredRevenue",
      comment,
      "managerId",
      "managerName",
      "createdAt",
      "updatedAt"
    FROM "ManagerDailyReport"
    WHERE "reportDate" = ${normalized}
    LIMIT 1
  `
  const report = reports[0] ?? null

  return report ? normalizeReport(report) : null
}
