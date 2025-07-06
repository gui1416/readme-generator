import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gerador de README - IA Gemini",
  description: "Transforme qualquer repositório em documentação profissional com inteligência artificial",
  icons: "/favicon.ico"
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e5e5e5",
              color: "#262626",
            },
          }}
        />
      </body>
    </html>
  )
}
