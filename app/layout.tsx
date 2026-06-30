import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { FavoritesProvider } from "@/lib/favorites-context"
import { SkinProfileProvider } from "@/lib/skin-profile-context"
import { AiChatWidget } from "@/components/ai-chat-widget"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "LUMIERE - Премиальная косметика",
  description:
    "Откройте для себя премиальный уход, макияж и ароматы. Персонально подобранные бьюти-решения для современного пользователя.",
}

export const viewport: Viewport = {
  themeColor: "#f5f0eb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <SkinProfileProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
              <AiChatWidget />
            </CartProvider>
          </FavoritesProvider>
        </SkinProfileProvider>
        <Analytics />
      </body>
    </html>
  )
}
