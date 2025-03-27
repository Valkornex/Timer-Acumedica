"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

export function AddIntegration() {
  return (
    <Card className="w-full max-w-md mx-auto mb-8 border-blue-200 shadow-md">
      <CardHeader className="bg-blue-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          Configurare Supabase
        </CardTitle>
        <CardDescription>
          Pentru sincronizare în timp real între dispozitive, trebuie să configurați Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>
            Creați un cont gratuit pe{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Supabase
            </a>
          </li>
          <li>Creați un nou proiect</li>
          <li>
            Executați scriptul SQL din fișierul{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">supabase/migrations/20240326_initial_schema.sql</code>
          </li>
          <li>Copiați URL-ul și cheia API anonimă din setările proiectului</li>
          <li>
            Adăugați aceste valori în fișierul <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> din
            proiectul dumneavoastră
          </li>
        </ol>
      </CardContent>
      <CardFooter className="bg-blue-50 rounded-b-lg">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Am configurat Supabase</Button>
      </CardFooter>
    </Card>
  )
}

