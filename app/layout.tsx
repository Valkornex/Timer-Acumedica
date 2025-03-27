import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistem de Cronometrare pentru Terapie Pacienți",
  description: "Aplicație pentru cronometrarea sesiunilor de terapie și gestionarea alertelor pentru pacienți",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

