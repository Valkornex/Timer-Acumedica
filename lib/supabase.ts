import { createClient } from "@supabase/supabase-js"

// Tipurile pentru datele din baza de date
export type Patient = {
  id: number
  name: string
  bed: string
  timer_running: boolean
  time_elapsed: number
  session_duration: number
  created_at?: string
}

export type Alert = {
  id: string
  patient_id: number
  type: "needles" | "pulse" | "session"
  trigger_at: number
  triggered: boolean
  dismissed: boolean
  last_triggered_at?: number
  created_at?: string
}

// Creăm clientul Supabase cu opțiuni suplimentare
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Adăugăm opțiuni pentru a gestiona mai bine erorile de rețea
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Verificăm dacă Supabase este configurat corect
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Funcții helper pentru interacțiunea cu baza de date
export async function getPatients(): Promise<Patient[]> {
  try {
    console.log("Încercăm să obținem pacienții...")

    // Verificăm dacă URL-ul și cheia API sunt definite
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      throw new Error("Configurație Supabase lipsă")
    }

    const { data, error } = await supabase.from("patients").select("*").order("id")

    if (error) {
      console.error("Eroare la obținerea pacienților:", error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn("Nu s-au găsit pacienți în baza de date")
      throw new Error("Nu s-au găsit pacienți")
    }

    console.log("Pacienți obținuți cu succes:", data.length)
    return data as Patient[]
  } catch (err) {
    console.error("Excepție la obținerea pacienților:", err)
    throw err
  }
}

export async function updatePatient(id: number, updates: Partial<Patient>): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return false
    }

    // Verificăm dacă avem date valide pentru actualizare
    if (!id || id <= 0) {
      console.error("ID pacient invalid:", id)
      return false
    }

    // Filtrăm proprietățile undefined sau null
    const filteredUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filteredUpdates[key] = value
      }
    })

    // Verificăm dacă avem proprietăți de actualizat
    if (Object.keys(filteredUpdates).length === 0) {
      console.warn("Nu există proprietăți pentru actualizare")
      return true // Returnăm true pentru că nu este o eroare
    }

    console.log("Trimit actualizare către Supabase:", id, filteredUpdates)

    const { error } = await supabase.from("patients").update(filteredUpdates).eq("id", id)

    if (error) {
      console.error("Eroare la actualizarea pacientului:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Excepție la actualizarea pacientului:", err)
    return false
  }
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    console.log("Încercăm să obținem alertele...")

    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      throw new Error("Configurație Supabase lipsă")
    }

    const { data, error } = await supabase.from("alerts").select("*")

    if (error) {
      console.error("Eroare la obținerea alertelor:", error)
      throw error
    }

    console.log("Alerte obținute cu succes:", data?.length || 0)
    return data as Alert[]
  } catch (err) {
    console.error("Excepție la obținerea alertelor:", err)
    return []
  }
}

export async function addAlert(alert: Omit<Alert, "id" | "created_at">): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return null
    }

    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          patient_id: alert.patient_id,
          type: alert.type,
          trigger_at: alert.trigger_at,
          triggered: alert.triggered,
          dismissed: alert.dismissed,
          last_triggered_at: alert.last_triggered_at,
        },
      ])
      .select()

    if (error) {
      console.error("Eroare la adăugarea alertei:", error)

      // Verificăm dacă este o eroare de RLS
      if (error.message.includes("row-level security") || error.code === "42501") {
        console.error("Eroare de securitate la nivel de rând (RLS). Verificați politicile RLS în Supabase.")
      }

      throw error
    }

    // Returnăm ID-ul alertei adăugate
    return data && data.length > 0 ? data[0].id : null
  } catch (err) {
    console.error("Excepție la adăugarea alertei:", err)
    throw err
  }
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return false
    }

    // Verificăm dacă ID-ul este local
    if (id.startsWith("local-")) {
      console.log("Ignorăm actualizarea alertei locale:", id)
      return true
    }

    const { error } = await supabase
      .from("alerts")
      .update({
        triggered: updates.triggered,
        dismissed: updates.dismissed,
        last_triggered_at: updates.last_triggered_at,
      })
      .eq("id", id)

    if (error) {
      console.error("Eroare la actualizarea alertei:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Excepție la actualizarea alertei:", err)
    return false
  }
}

export async function deleteAlert(id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return false
    }

    // Verificăm dacă ID-ul este local
    if (id.startsWith("local-")) {
      console.log("Ignorăm ștergerea alertei locale:", id)
      return true
    }

    const { error } = await supabase.from("alerts").delete().eq("id", id)

    if (error) {
      console.error("Eroare la ștergerea alertei:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Excepție la ștergerea alertei din baza de date:", err)
    return false
  }
}

// Funcție pentru a subscrie la modificări în timp real
export function subscribeToPatients(callback: (patients: Patient[]) => void) {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return {
        unsubscribe: () => {},
      }
    }

    // Abonăm la toate modificările din tabelul patients
    const channel = supabase
      .channel("patients-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
        },
        (payload) => {
          console.log("Modificare detectată în tabelul patients:", payload)
          // La orice modificare, obținem lista actualizată de pacienți
          getPatients()
            .then(callback)
            .catch((err) => console.error("Eroare la actualizarea pacienților după modificare:", err))
        },
      )
      .subscribe((status) => {
        console.log("Status abonament patients:", status)
      })

    return channel
  } catch (err) {
    console.error("Excepție la abonarea la modificări pentru pacienți:", err)
    return {
      unsubscribe: () => {},
    }
  }
}

export function subscribeToAlerts(callback: (alerts: Alert[]) => void) {
  try {
    if (!isSupabaseConfigured()) {
      console.error("Variabilele de mediu pentru Supabase nu sunt configurate")
      return {
        unsubscribe: () => {},
      }
    }

    // Abonăm la toate modificările din tabelul alerts
    const channel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          console.log("Modificare detectată în tabelul alerts:", payload)
          // La orice modificare, obținem lista actualizată de alerte
          getAlerts()
            .then(callback)
            .catch((err) => console.error("Eroare la actualizarea alertelor după modificare:", err))
        },
      )
      .subscribe((status) => {
        console.log("Status abonament alerts:", status)
      })

    return channel
  } catch (err) {
    console.error("Excepție la abonarea la modificări pentru alerte:", err)
    return {
      unsubscribe: () => {},
    }
  }
}

