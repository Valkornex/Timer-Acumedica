import PatientTimerDashboard from "@/components/patient-timer-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-800 drop-shadow-sm">
        Sistem de Cronometrare pentru Terapie Pacienți
      </h1>
      <PatientTimerDashboard />
    </main>
  )
}

