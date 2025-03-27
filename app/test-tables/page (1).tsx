"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Patient, Alert } from "@/lib/supabase"

export default function TestTablesPage() {
  const [patientsStatus, setPatientsStatus] = useState<string>("Se verifică...")
  const [alertsStatus, setAlertsStatus] = useState<string>("Se verifică...")
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [patientsError, setPatientsError] = useState<string | null>(null)
  const [alertsError, setAlertsError] = useState<string | null>(null)

  useEffect(() => {
    async function checkTables() {
      // Verificăm tabelul patients
      try {
        const { data: patientsData, error: patientsError } = await supabase.from("patients").select("*")

        if (patientsError) {
          setPatientsStatus("Eroare la accesarea tabelului patients")
          setPatientsError(JSON.stringify(patientsError, null, 2))
        } else {
          setPatientsStatus(`Tabelul patients accesibil (${patientsData.length} înregistrări)`)
          setPatients(patientsData)
        }
      } catch (err) {
        setPatientsStatus("Excepție la accesarea tabelului patients")
        setPatientsError(JSON.stringify(err, null, 2))
      }

      // Verificăm tabelul alerts
      try {
        const { data: alertsData, error: alertsError } = await supabase.from("alerts").select("*")

        if (alertsError) {
          setAlertsStatus("Eroare la accesarea tabelului alerts")
          setAlertsError(JSON.stringify(alertsError, null, 2))
        } else {
          setAlertsStatus(`Tabelul alerts accesibil (${alertsData.length} înregistrări)`)
          setAlerts(alertsData)
        }
      } catch (err) {
        setAlertsStatus("Excepție la accesarea tabelului alerts")
        setAlertsError(JSON.stringify(err, null, 2))
      }
    }

    checkTables()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Tabele Supabase</h1>

      {/* Secțiunea pentru tabelul patients */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Tabelul Patients</h2>

        <div
          className={`p-4 rounded-lg mb-4 ${
            patientsStatus.includes("accesibil")
              ? "bg-green-100"
              : patientsStatus.includes("verifică")
                ? "bg-blue-100"
                : "bg-red-100"
          }`}
        >
          <p>
            <strong>Status:</strong> {patientsStatus}
          </p>
        </div>

        {patientsError && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <h3 className="font-semibold mb-2">Eroare:</h3>
            <pre className="whitespace-pre-wrap bg-gray-800 text-white p-4 rounded overflow-auto">{patientsError}</pre>
          </div>
        )}

        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Nume</th>
                  <th className="py-2 px-4 border-b">Pat</th>
                  <th className="py-2 px-4 border-b">Timer Activ</th>
                  <th className="py-2 px-4 border-b">Timp Scurs</th>
                  <th className="py-2 px-4 border-b">Durată Sesiune</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="py-2 px-4 border-b">{patient.id}</td>
                    <td className="py-2 px-4 border-b">{patient.name}</td>
                    <td className="py-2 px-4 border-b">{patient.bed}</td>
                    <td className="py-2 px-4 border-b">{patient.timer_running ? "Da" : "Nu"}</td>
                    <td className="py-2 px-4 border-b">{patient.time_elapsed}</td>
                    <td className="py-2 px-4 border-b">{patient.session_duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Secțiunea pentru tabelul alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Tabelul Alerts</h2>

        <div
          className={`p-4 rounded-lg mb-4 ${
            alertsStatus.includes("accesibil")
              ? "bg-green-100"
              : alertsStatus.includes("verifică")
                ? "bg-blue-100"
                : "bg-red-100"
          }`}
        >
          <p>
            <strong>Status:</strong> {alertsStatus}
          </p>
        </div>

        {alertsError && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <h3 className="font-semibold mb-2">Eroare:</h3>
            <pre className="whitespace-pre-wrap bg-gray-800 text-white p-4 rounded overflow-auto">{alertsError}</pre>
          </div>
        )}

        {alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Pacient ID</th>
                  <th className="py-2 px-4 border-b">Tip</th>
                  <th className="py-2 px-4 border-b">Declanșare la</th>
                  <th className="py-2 px-4 border-b">Declanșat</th>
                  <th className="py-2 px-4 border-b">Respins</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="py-2 px-4 border-b">{alert.id}</td>
                    <td className="py-2 px-4 border-b">{alert.patient_id}</td>
                    <td className="py-2 px-4 border-b">{alert.type}</td>
                    <td className="py-2 px-4 border-b">{alert.trigger_at}</td>
                    <td className="py-2 px-4 border-b">{alert.triggered ? "Da" : "Nu"}</td>
                    <td className="py-2 px-4 border-b">{alert.dismissed ? "Da" : "Nu"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nu există alerte în baza de date.</p>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Pași următori:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Dacă tabelele nu sunt accesibile, verificați dacă ați executat scriptul SQL în Supabase</li>
          <li>Verificați politicile RLS (Row Level Security) pentru ambele tabele</li>
          <li>
            Dacă tabelele sunt accesibile dar aplicația principală nu funcționează, verificați codul din componenta
            PatientTimerDashboard
          </li>
        </ol>
      </div>
    </div>
  )
}

