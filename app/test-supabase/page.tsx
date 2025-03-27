"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>("Testăm conexiunea...")
  const [error, setError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<{ url: string; key: string }>({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "Nedefinit",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...`
      : "Nedefinit",
  })

  useEffect(() => {
    async function testConnection() {
      try {
        // Test simplu - verificăm dacă putem face o cerere de bază
        const { data, error } = await supabase.from("patients").select("count")

        if (error) {
          setStatus("Eroare la conectare")
          setError(JSON.stringify(error, null, 2))
          return
        }

        setStatus("Conexiune reușită!")
      } catch (err) {
        setStatus("Excepție la conectare")
        setError(JSON.stringify(err, null, 2))
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Conexiune Supabase</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Variabile de mediu:</h2>
        <div>
          <strong>URL:</strong> {envVars.url}
        </div>
        <div>
          <strong>Key:</strong> {envVars.key}
        </div>
      </div>

      <div
        className={`p-4 rounded-lg mb-4 ${
          status.includes("reușită") ? "bg-green-100" : status.includes("Testăm") ? "bg-blue-100" : "bg-red-100"
        }`}
      >
        <h2 className="text-lg font-semibold">Status: {status}</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold mb-2">Eroare:</h2>
          <pre className="whitespace-pre-wrap bg-gray-800 text-white p-4 rounded overflow-auto">{error}</pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Pași de verificare:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Verificați dacă variabilele de mediu sunt definite corect în fișierul <code>.env.local</code>
          </li>
          <li>Asigurați-vă că ați creat tabelele în Supabase folosind scriptul SQL furnizat</li>
          <li>Verificați dacă aveți politici RLS (Row Level Security) care permit accesul la date</li>
          <li>Verificați dacă URL-ul Supabase este accesibil din rețeaua dvs.</li>
        </ol>
      </div>
    </div>
  )
}

