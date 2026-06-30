"use client"

export const AUTH_TOKEN_KEY = "lumiere-auth-token"
export const AUTH_CHANGE_EVENT = "lumiere-auth-change"

function emitAuthChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function getAuthToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  emitAuthChange()
}

export function clearAuthToken() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  emitAuthChange()
}
