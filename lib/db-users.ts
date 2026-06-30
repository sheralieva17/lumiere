import { prisma } from "@/lib/prisma"
import type { RecommendationProfile } from "@/lib/products"
import {
  createSessionForUser,
  getUserRecordById,
  loginUser as loginLegacyUser,
  type UserRecord,
  upsertMockUser,
} from "@/lib/mock-store"

type PublicAccountUser = {
  id: string
  role: "customer" | "manager" | "admin"
  firstName: string
  lastName: string
  email: string
  phone: string
  avatarDataUrl: string
  savedAddresses: string[]
  hasCompletedQuiz: boolean
  quizResult: RecommendationProfile | null
  quizCompletedAt: string | null
}

const SYSTEM_USERS = [
  {
    id: "usr_admin_demo",
    role: "admin" as const,
    firstName: "System",
    lastName: "Admin",
    email: "admin@lumiere.com",
    password: "admin123",
  },
  {
    id: "usr_manager_demo",
    role: "manager" as const,
    firstName: "Store",
    lastName: "Manager",
    email: "manager@lumiere.com",
    password: "manager123",
  },
]

function buildUserId() {
  return `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function mapQuizResult(
  quizResult:
    | {
        skinType: string
        concerns: string[]
        ageRange: string
        routine: string
        sensitivityLevel: string
        allergies: string[]
        texturePreference: string
        fragrancePreference: string
        budget: string
        createdAt: Date
      }
    | null
    | undefined
): { quizResult: RecommendationProfile | null; quizCompletedAt: string | null } {
  if (!quizResult) {
    return { quizResult: null, quizCompletedAt: null }
  }

  return {
    quizResult: {
      skinType: quizResult.skinType as RecommendationProfile["skinType"],
      concerns: quizResult.concerns as RecommendationProfile["concerns"],
      ageRange: quizResult.ageRange,
      routine: quizResult.routine as RecommendationProfile["routine"],
      sensitivityLevel:
        quizResult.sensitivityLevel as RecommendationProfile["sensitivityLevel"],
      allergies: quizResult.allergies as RecommendationProfile["allergies"],
      texturePreference:
        quizResult.texturePreference as RecommendationProfile["texturePreference"],
      fragrancePreference:
        quizResult.fragrancePreference as RecommendationProfile["fragrancePreference"],
      budget: quizResult.budget as RecommendationProfile["budget"],
    },
    quizCompletedAt: quizResult.createdAt.toISOString(),
  }
}

function buildPublicUser(
  dbUser: {
    id: string
    role: "customer" | "manager" | "admin"
    firstName: string
    lastName: string
    email: string
    phone: string | null
    avatarUrl: string | null
    addresses?: Array<{
      street: string
      city: string
      region: string | null
      house: string | null
      apartment: string | null
      phone: string | null
    }>
    quizResult?: {
      skinType: string
      concerns: string[]
      ageRange: string
      routine: string
      sensitivityLevel: string
      allergies: string[]
      texturePreference: string
      fragrancePreference: string
      budget: string
      createdAt: Date
    } | null
  },
  legacyUser: UserRecord | null
): PublicAccountUser {
  const mappedQuiz = mapQuizResult(dbUser.quizResult)
  const savedAddresses =
    dbUser.addresses && dbUser.addresses.length > 0
      ? dbUser.addresses.map((address) =>
          [
            address.city,
            address.street,
            address.house ? `дом ${address.house}` : null,
            address.apartment ? `кв. ${address.apartment}` : null,
          ]
            .filter(Boolean)
            .join(", ")
        )
      : legacyUser?.savedAddresses ?? []

  return {
    id: dbUser.id,
    role: dbUser.role,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    email: dbUser.email,
    phone: dbUser.phone ?? "",
    avatarDataUrl: dbUser.avatarUrl ?? legacyUser?.avatarDataUrl ?? "",
    savedAddresses,
    hasCompletedQuiz:
      Boolean(mappedQuiz.quizResult) || legacyUser?.hasCompletedQuiz || false,
    quizResult: mappedQuiz.quizResult ?? legacyUser?.quizResult ?? null,
    quizCompletedAt:
      mappedQuiz.quizCompletedAt ?? legacyUser?.quizCompletedAt ?? null,
  }
}

function buildMockUserRecord(
  dbUser: {
    id: string
    role: "customer" | "manager" | "admin"
    firstName: string
    lastName: string
    email: string
    password: string
    phone: string | null
    avatarUrl: string | null
    createdAt: Date
  },
  legacyUser: UserRecord | null
): UserRecord {
  return {
    id: dbUser.id,
    role: dbUser.role,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    email: dbUser.email,
    password: dbUser.password,
    phone: dbUser.phone ?? "",
    avatarDataUrl: dbUser.avatarUrl ?? legacyUser?.avatarDataUrl ?? "",
    savedAddresses: legacyUser?.savedAddresses ?? [],
    createdAt: dbUser.createdAt.toISOString(),
    hasCompletedQuiz: legacyUser?.hasCompletedQuiz ?? false,
    quizResult: legacyUser?.quizResult ?? null,
    quizCompletedAt: legacyUser?.quizCompletedAt ?? null,
  }
}

function toQuizResultCreateInput(profile: RecommendationProfile) {
  return {
    skinType: profile.skinType,
    concerns: profile.concerns,
    sensitivityLevel: profile.sensitivityLevel,
    allergies: profile.allergies,
    texturePreference: profile.texturePreference,
    fragrancePreference: profile.fragrancePreference,
    ageRange: profile.ageRange,
    budget: profile.budget,
    routine: profile.routine,
    recommendations: [],
  }
}

async function ensureSystemUsersInDb() {
  for (const systemUser of SYSTEM_USERS) {
    await prisma.user.upsert({
      where: { email: systemUser.email },
      update: {
        id: systemUser.id,
        firstName: systemUser.firstName,
        lastName: systemUser.lastName,
        password: systemUser.password,
        role: systemUser.role,
      },
      create: {
        id: systemUser.id,
        firstName: systemUser.firstName,
        lastName: systemUser.lastName,
        email: systemUser.email,
        password: systemUser.password,
        phone: "",
        avatarUrl: null,
        role: systemUser.role,
      },
    })
  }
}

async function ensureDbUserFromLegacy(user: UserRecord) {
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })

  if (existing) {
    return existing
  }

  return prisma.user.create({
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email.trim().toLowerCase(),
      password: user.password,
      phone: user.phone ?? "",
      avatarUrl: user.avatarDataUrl || null,
      role: user.role,
    },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })
}

export async function registerDbUser(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}) {
  await ensureSystemUsersInDb()

  const email = input.email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    throw new Error("Этот e-mail уже зарегистрирован.")
  }

  const createdUser = await prisma.user.create({
    data: {
      id: buildUserId(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      password: input.password,
      phone: input.phone?.trim() ?? "",
      avatarUrl: null,
      role: "customer",
    },
  })

  const mockUser = buildMockUserRecord(createdUser, null)
  const token = createSessionForUser(mockUser)

  return {
    token,
    user: buildPublicUser(
      {
        ...createdUser,
        phone: createdUser.phone,
        avatarUrl: createdUser.avatarUrl,
        addresses: [],
        quizResult: null,
      },
      mockUser
    ),
  }
}

export async function loginDbUser(input: { email: string; password: string }) {
  await ensureSystemUsersInDb()

  const email = input.email.trim().toLowerCase()
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })

  if (!dbUser) {
    const legacy = loginLegacyUser(input)
    return legacy
  }

  if (dbUser.password !== input.password) {
    throw new Error("Неверный e-mail или пароль.")
  }

  const legacyUser = getUserRecordById(dbUser.id)
  const mockUser = buildMockUserRecord(dbUser, legacyUser)
  upsertMockUser(mockUser)
  const token = createSessionForUser(mockUser)

  return {
    token,
    user: buildPublicUser(dbUser, mockUser),
  }
}

export async function getDbAccountUser(userId: string) {
  await ensureSystemUsersInDb()

  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })

  const legacyUser = getUserRecordById(userId)

  if (!dbUser && legacyUser) {
    dbUser = await ensureDbUserFromLegacy(legacyUser)
  }

  if (!dbUser) {
    return null
  }

  const mockUser = buildMockUserRecord(dbUser, legacyUser)
  upsertMockUser(mockUser)

  return buildPublicUser(dbUser, mockUser)
}

export async function updateDbUserProfile(
  userId: string,
  input: {
    firstName: string
    lastName: string
    phone: string
    email: string
    avatarDataUrl?: string
  }
) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      NOT: { id: userId },
    },
    select: { id: true },
  })

  if (existing) {
    throw new Error("Email is already registered")
  }

  const legacyUser = getUserRecordById(userId)
  if (legacyUser) {
    await ensureDbUserFromLegacy(legacyUser)
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
      phone: input.phone.trim(),
      ...(typeof input.avatarDataUrl === "string"
        ? { avatarUrl: input.avatarDataUrl }
        : {}),
    },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })

  const mockUser = buildMockUserRecord(updatedUser, legacyUser)
  upsertMockUser(mockUser)

  return buildPublicUser(updatedUser, mockUser)
}

export async function saveDbUserQuizResult(
  userId: string,
  profile: RecommendationProfile
) {
  const legacyUser = getUserRecordById(userId)
  if (legacyUser) {
    await ensureDbUserFromLegacy(legacyUser)
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      quizResult: {
        select: { id: true },
      },
    },
  })

  if (!existingUser) {
    throw new Error("Пользователь не найден.")
  }

  if (existingUser.quizResult) {
    throw new Error("Quiz can only be completed once")
  }

  await prisma.quizResult.create({
    data: {
      user: {
        connect: { id: userId },
      },
      ...toQuizResultCreateInput(profile),
    },
  })

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        select: {
          street: true,
          city: true,
          region: true,
          house: true,
          apartment: true,
          phone: true,
        },
      },
      quizResult: true,
    },
  })

  if (!updatedUser) {
    throw new Error("Пользователь не найден.")
  }

  const mappedQuiz = mapQuizResult(updatedUser.quizResult)
  const mockUser = buildMockUserRecord(updatedUser, legacyUser)
  mockUser.hasCompletedQuiz = true
  mockUser.quizResult = mappedQuiz.quizResult
  mockUser.quizCompletedAt = mappedQuiz.quizCompletedAt
  upsertMockUser(mockUser)

  return buildPublicUser(updatedUser, mockUser)
}
