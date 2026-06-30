import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const databaseUrl = new URL(connectionString)
const username = decodeURIComponent(databaseUrl.username)
const password = decodeURIComponent(databaseUrl.password)
const database = databaseUrl.pathname.replace(/^\//, "")
const host = process.env.PGHOST ?? "/tmp"
const port = Number(process.env.PGPORT ?? databaseUrl.port ?? 5433)

const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    user: username,
    password,
    database,
    host,
    port,
  })

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaPool = pool
}
