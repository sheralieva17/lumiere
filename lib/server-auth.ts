import { headers } from "next/headers"

export async function getBearerToken() {
  const h = await headers()
  const auth = h.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length).trim()
}
