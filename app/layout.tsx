import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Painel administrativo",
  description:
    "Painel administrativo para gestao de usuarios e simulacoes financeiras",
}

export const viewport: Viewport = {
  themeColor: "#0E87C6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="light">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
