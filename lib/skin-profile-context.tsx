"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type {
  AllergyTag,
  BudgetLevel,
  FragrancePreference,
  RoutineLevel,
  SensitivityLevel,
  SkinConcern,
  SkinType,
  TexturePreference,
} from "./products"

export interface SkinProfile {
  skinType: SkinType
  concerns: SkinConcern[]
  ageRange: string
  routine: RoutineLevel
  sensitivityLevel: SensitivityLevel
  allergies: AllergyTag[]
  texturePreference: TexturePreference
  fragrancePreference: FragrancePreference
  budget: BudgetLevel
}

interface SkinProfileContextType {
  profile: SkinProfile | null
  setProfile: (profile: SkinProfile) => void
  clearProfile: () => void
  hasCompletedQuiz: boolean
}

const SkinProfileContext = createContext<SkinProfileContextType | undefined>(
  undefined
)

function isValidProfile(profile: unknown): profile is SkinProfile {
  if (!profile || typeof profile !== "object") return false
  const p = profile as Partial<SkinProfile>
  return Boolean(
    p.skinType &&
      Array.isArray(p.concerns) &&
      p.ageRange &&
      p.routine &&
      p.sensitivityLevel &&
      Array.isArray(p.allergies) &&
      p.texturePreference &&
      p.fragrancePreference &&
      p.budget
  )
}

export function SkinProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<SkinProfile | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const stored = window.sessionStorage.getItem("lumiere-skin-profile")
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return isValidProfile(parsed) ? parsed : null
    } catch {
      return null
    }
  })

  const setProfile = useCallback((newProfile: SkinProfile) => {
    setProfileState(newProfile)
    try {
      window.sessionStorage.setItem(
        "lumiere-skin-profile",
        JSON.stringify(newProfile)
      )
    } catch {
      // silently fail
    }
  }, [])

  const clearProfile = useCallback(() => {
    setProfileState(null)
    try {
      window.sessionStorage.removeItem("lumiere-skin-profile")
    } catch {
      // silently fail
    }
  }, [])

  return (
    <SkinProfileContext.Provider
      value={{
        profile,
        setProfile,
        clearProfile,
        hasCompletedQuiz: profile !== null,
      }}
    >
      {children}
    </SkinProfileContext.Provider>
  )
}

export function useSkinProfile() {
  const context = useContext(SkinProfileContext)
  if (!context) {
    throw new Error("useSkinProfile must be used within a SkinProfileProvider")
  }
  return context
}
