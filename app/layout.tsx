import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

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
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

