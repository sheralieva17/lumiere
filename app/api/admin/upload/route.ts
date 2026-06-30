import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getBearerToken } from "@/lib/server-auth"
import { getUserByToken, requireUserRole } from "@/lib/mock-store"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
])

function getExtension(file: File) {
  const byType =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : ".jpg"

  const original = path.extname(file.name || "").toLowerCase()
  if (original === ".png" || original === ".webp" || original === ".jpg" || original === ".jpeg") {
    return original === ".jpeg" ? ".jpg" : original
  }

  return byType
}

export async function POST(req: Request) {
  try {
    const token = await getBearerToken()
    const user = getUserByToken(token)
    requireUserRole(user, ["admin"])

    const formData = await req.formData()
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files were provided." }, { status: 400 })
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, and WEBP images are supported." },
          { status: 400 }
        )
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const savedPaths: string[] = []

    for (const file of files) {
      const extension = getExtension(file)
      const fileName = `${Date.now().toString(36)}-${randomUUID()}${extension}`
      const outputPath = path.join(uploadDir, fileName)
      const buffer = Buffer.from(await file.arrayBuffer())

      await writeFile(outputPath, buffer)
      savedPaths.push(`/uploads/${fileName}`)
    }

    return NextResponse.json({ paths: savedPaths })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not upload files"
    const message =
      rawMessage === "Forbidden"
        ? "Недостаточно прав доступа."
        : rawMessage === "Unauthorized"
          ? "Требуется авторизация."
          : rawMessage === "Could not upload files"
            ? "Не удалось загрузить файлы."
            : rawMessage
    const status = rawMessage === "Forbidden" ? 403 : 401
    return NextResponse.json({ error: message }, { status })
  }
}
