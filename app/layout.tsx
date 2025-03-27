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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cronometru Pacienți" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

