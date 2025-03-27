"use client"

import { useState, useEffect, useRef } from "react"
import PatientTimer from "./patient-timer"
import { Bell, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  type Patient,
  type Alert,
  getPatients,
  getAlerts,
  updatePatient as updatePatientInDb,
  addAlert as addAlertToDb,
  updateAlert as updateAlertInDb,
  deleteAlert as deleteAlertInDb,
  subscribeToPatients,
  subscribeToAlerts,
  isSupabaseConfigured,
} from "@/lib/supabase"
import NotificationPermission from "./notification-permission"

type AlertType = "needles" | "pulse" | "session"

// Date inițiale pentru modul offline
const initialPatients: Patient[] = [
  { id: 1, name: "Pacient 1", bed: "Pat 1", timer_running: false, time_elapsed: 0, session_duration: 0 },
  { id: 2, name: "Pacient 2", bed: "Pat 2", timer_running: false, time_elapsed: 0, session_duration: 0 },
  { id: 3, name: "Pacient 3", bed: "Pat 3", timer_running: false, time_elapsed: 0, session_duration: 0 },
]

export default function PatientTimerDashboard() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(!isSupabaseConfigured())
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)
  const lastTickTimeRef = useRef<number>(0)
  const patientsRef = useRef<Patient[]>(initialPatients)
  const [isClientReady, setIsClientReady] = useState(false)
  const lastSyncTimeRef = useRef<number>(0)
  const localTimersRef = useRef<Record<number, boolean>>({})
  const localTimesRef = useRef<Record<number, number>>({})
  const alertsRef = useRef<Alert[]>([])

  // Referințe pentru canalele de timp real
  const patientsChannelRef = useRef<any>(null)
  const alertsChannelRef = useRef<any>(null)

  // Actualizăm referința când se schimbă pacienții
  useEffect(() => {
    patientsRef.current = patients
  }, [patients])

  // Actualizăm referința când se schimbă alertele
  useEffect(() => {
    alertsRef.current = alerts
  }, [alerts])

  // Marcăm clientul ca fiind pregătit după montare
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClientReady(true)
      lastTickTimeRef.current = Date.now()

      // Adăugăm un detector de interacțiune pentru iOS
      const markUserInteraction = () => {
        document.documentElement.classList.add("user-interacted")

        // Încercăm să deblocăm audio pe iOS la prima interacțiune
        try {
          // Redăm un sunet scurt și silențios pentru a debloca Audio API
          const audio = new Audio()
          audio.src = "/sounds/alert-session.mp3"
          audio.volume = 0.01
          audio.play().catch((e) => console.log("Eroare la deblocarea audio:", e))

          // Deblocăm și Web Audio API
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContext) {
            const audioContext = new AudioContext()
            const oscillator = audioContext.createOscillator()
            oscillator.connect(audioContext.destination)
            oscillator.start(0)
            oscillator.stop(0.001)
          }
        } catch (e) {
          console.error("Eroare la deblocarea audio:", e)
        }
      }

      // Adăugăm evenimentele de interacțiune
      const events = ["click", "touchstart", "keydown", "scroll", "touchend"]
      events.forEach((event) => {
        document.addEventListener(event, markUserInteraction, { once: true })
      })

      // Curățăm evenimentele la demontare
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, markUserInteraction)
        })
      }
    }
  }, [])

  // Încărcăm datele inițiale și configurăm abonamentele în timp real
  useEffect(() => {
    let isMounted = true

    // Verificăm dacă Supabase este configurat
    if (!isSupabaseConfigured()) {
      console.log("Supabase nu este configurat, folosim modul offline")
      setIsOffline(true)
      return
    }

    async function loadInitialData() {
      try {
        console.log("Încercăm să obținem pacienții...")
        const patientsData = await getPatients()

        if (isMounted && patientsData.length > 0) {
          console.log("Pacienți obținuți cu succes:", patientsData.length)
          setPatients(patientsData)
          patientsRef.current = patientsData
          setIsOffline(false)

          // Inițializăm timpul ultimei sincronizări
          lastSyncTimeRef.current = Date.now()

          // Încercăm să obținem alertele
          try {
            console.log("Încercăm să obținem alertele...")
            const alertsData = await getAlerts()

            if (isMounted) {
              console.log("Alerte obținute cu succes:", alertsData.length)
              setAlerts(alertsData)
              alertsRef.current = alertsData
            }
          } catch (alertError) {
            console.error("Eroare la obținerea alertelor:", alertError)
          }
        } else {
          // Dacă nu am obținut pacienți, setăm modul offline
          if (isMounted) setIsOffline(true)
        }
      } catch (error) {
        console.error("Eroare la obținerea pacienților:", error)

        if (isMounted) {
          setIsOffline(true)
          toast({
            title: "Mod offline",
            description: "Aplicația funcționează în mod offline cu date locale.",
            variant: "default",
          })
        }
      }
    }

    // Configurăm abonamentele în timp real
    function setupRealTimeSubscriptions() {
      try {
        console.log("Configurăm abonamentele în timp real...")

        // Abonament pentru pacienți
        patientsChannelRef.current = subscribeToPatients((newPatients) => {
          if (isMounted) {
            console.log("Am primit pacienți actualizați:", newPatients.length)

            // Actualizăm pacienții, păstrând starea timer_running și time_elapsed pentru cei activi
            setPatients((prevPatients) => {
              return newPatients.map((newPatient) => {
                const existingPatient = prevPatients.find((p) => p.id === newPatient.id)

                // Verificăm dacă pacientul are un timer local activ
                if (localTimersRef.current[newPatient.id]) {
                  // Păstrăm starea locală pentru timer_running și time_elapsed
                  return {
                    ...newPatient,
                    timer_running: true,
                    time_elapsed: localTimesRef.current[newPatient.id] || newPatient.time_elapsed,
                  }
                }

                // Altfel, folosim datele din baza de date
                return newPatient
              })
            })
          }
        })

        // Abonament pentru alerte
        alertsChannelRef.current = subscribeToAlerts((newAlerts) => {
          if (isMounted) {
            console.log("Am primit alerte actualizate:", newAlerts.length)

            // Combinăm alertele locale cu cele din baza de date
            setAlerts((prevAlerts) => {
              // Păstrăm alertele locale (cele cu ID-uri care încep cu "local-")
              const localAlerts = prevAlerts.filter((a) => a.id.startsWith("local-"))

              // Combinăm alertele din baza de date cu cele locale
              const combinedAlerts = [...newAlerts]

              // Adăugăm alertele locale care nu au fost încă sincronizate
              localAlerts.forEach((localAlert) => {
                // Verificăm dacă alerta locală există deja în baza de date
                const exists = newAlerts.some(
                  (a) =>
                    a.patient_id === localAlert.patient_id &&
                    a.type === localAlert.type &&
                    a.trigger_at === localAlert.trigger_at,
                )

                if (!exists) {
                  combinedAlerts.push(localAlert)
                }
              })

              return combinedAlerts
            })
          }
        })

        console.log("Abonamente configurate cu succes")
      } catch (subscribeError) {
        console.error("Eroare la configurarea abonamentelor:", subscribeError)
      }
    }

    // Încărcăm datele și configurăm abonamentele
    loadInitialData().then(() => {
      if (isMounted && !isOffline) {
        setupRealTimeSubscriptions()
      }
    })

    return () => {
      isMounted = false

      // Curățăm abonamentele
      if (patientsChannelRef.current) {
        try {
          patientsChannelRef.current.unsubscribe()
        } catch (err) {
          console.error("Eroare la dezabonare:", err)
        }
      }

      if (alertsChannelRef.current) {
        try {
          alertsChannelRef.current.unsubscribe()
        } catch (err) {
          console.error("Eroare la dezabonare:", err)
        }
      }
    }
  }, [toast, isOffline])

  // Implementăm un timer bazat pe requestAnimationFrame pentru precizie mai bună
  useEffect(() => {
    // Rulăm acest efect doar pe client
    if (typeof window === "undefined") return

    let animationFrameId: number

    function updateTimers() {
      const now = Date.now()
      const deltaTime = now - lastTickTimeRef.current

      // Actualizăm doar dacă a trecut cel puțin 1 secundă
      if (deltaTime >= 1000) {
        // Calculăm câte secunde au trecut
        const secondsElapsed = Math.floor(deltaTime / 1000)
        lastTickTimeRef.current = now - (deltaTime % 1000) // Ajustăm pentru precizie

        // Incrementăm contorul global
        setCurrentTime((prev) => prev + secondsElapsed)

        // Actualizăm timpul pentru pacienții cu timer activ
        if (!isUpdatingRef.current) {
          isUpdatingRef.current = false

          setPatients((prevPatients) => {
            // Verificăm dacă avem pacienți cu timer activ
            const hasRunningTimers = prevPatients.some((p) => p.timer_running)

            if (!hasRunningTimers) {
              return prevPatients
            }

            // Actualizăm pacienții
            const updatedPatients = prevPatients.map((patient) => {
              if (patient.timer_running) {
                // Incrementăm timpul scurs
                const newTimeElapsed = patient.time_elapsed + secondsElapsed

                // Actualizăm timpul local
                localTimesRef.current[patient.id] = newTimeElapsed

                // Verificăm dacă sesiunea s-a încheiat
                if (patient.session_duration > 0 && newTimeElapsed >= patient.session_duration) {
                  // Oprim cronometrul dacă sesiunea s-a încheiat
                  handleSessionComplete(patient, newTimeElapsed)

                  // Actualizăm starea locală
                  localTimersRef.current[patient.id] = false

                  return {
                    ...patient,
                    timer_running: false,
                    time_elapsed: newTimeElapsed,
                  }
                }

                // Actualizăm timpul în baza de date la fiecare 2 secunde
                if (Math.floor(newTimeElapsed / 2) > Math.floor(patient.time_elapsed / 2) && !isOffline) {
                  updatePatientInDb(patient.id, {
                    timer_running: true,
                    time_elapsed: newTimeElapsed,
                  }).catch((err) => console.error("Eroare la actualizarea timpului:", err))
                }

                // Returnăm pacientul actualizat
                return {
                  ...patient,
                  time_elapsed: newTimeElapsed,
                }
              }

              // Returnăm pacientul nemodificat
              return patient
            })

            return updatedPatients
          })
        }
      }

      // Continuăm bucla de animație
      animationFrameId = requestAnimationFrame(updateTimers)
    }

    // Inițiem bucla de animație
    animationFrameId = requestAnimationFrame(updateTimers)

    // Curățăm la demontare
    return () => {
      cancelAnimationFrame(animationFrameId)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOffline])

  // Funcție pentru gestionarea finalizării sesiunii
  const handleSessionComplete = (patient: Patient, newTimeElapsed: number) => {
    // Creăm o alertă de finalizare a sesiunii
    const sessionAlert = {
      patient_id: patient.id,
      type: "session" as AlertType,
      trigger_at: patient.session_duration,
      triggered: true,
      dismissed: false,
      last_triggered_at: currentTime,
    }

    // Adăugăm alerta local
    const localId = `local-${Date.now()}`
    setAlerts((prev) => [...prev, { ...sessionAlert, id: localId }])

    // Actualizăm în baza de date dacă nu suntem offline
    if (!isOffline) {
      updatePatientInDb(patient.id, {
        timer_running: false,
        time_elapsed: newTimeElapsed,
      }).catch((err) => console.error("Eroare la actualizarea pacientului:", err))

      addAlertToDb(sessionAlert).catch((err) => console.error("Eroare la adăugarea alertei:", err))
    }

    // Declanșăm notificarea
    triggerSessionCompleteAlert(patient.id, patient.name, patient.bed)
  }

  // Verificăm alertele separat pentru a evita bucle infinite
  useEffect(() => {
    const checkAlerts = () => {
      // Folosim o variabilă locală pentru a evita actualizări inutile
      const updatedAlerts = [...alerts]
      let hasChanges = false

      alerts.forEach((alert, index) => {
        if (!alert.triggered && !alert.dismissed) {
          const patient = patients.find((p) => p.id === alert.patient_id)
          if (patient && patient.timer_running && patient.time_elapsed >= alert.trigger_at) {
            // Marcăm alerta ca declanșată
            updatedAlerts[index] = {
              ...alert,
              triggered: true,
              last_triggered_at: currentTime,
            }
            hasChanges = true

            // Actualizăm în baza de date doar dacă nu suntem offline
            if (!isOffline) {
              updateAlertInDb(alert.id, {
                triggered: true,
                last_triggered_at: currentTime,
              }).catch((err) => console.error("Eroare la actualizarea alertei:", err))
            }

            // Declanșăm notificarea locală
            triggerAlert(updatedAlerts[index])
          }
        }
        // Verificăm alertele care trebuie redeclanșate
        else if (alert.triggered && !alert.dismissed && alert.last_triggered_at) {
          // Redeclanșăm la fiecare 5 secunde
          if (currentTime - alert.last_triggered_at >= 5) {
            updatedAlerts[index] = {
              ...alert,
              last_triggered_at: currentTime,
            }
            hasChanges = true

            // Actualizăm în baza de date doar dacă nu suntem offline
            if (!isOffline) {
              updateAlertInDb(alert.id, {
                last_triggered_at: currentTime,
              }).catch((err) => console.error("Eroare la actualizarea alertei:", err))
            }

            // Redeclanșăm notificarea locală
            retriggerAlert(updatedAlerts[index])
          }
        }
      })

      // Actualizăm starea doar dacă s-au făcut modificări
      if (hasChanges) {
        setAlerts(updatedAlerts)
      }
    }

    // Verificăm alertele
    checkAlerts()
  }, [alerts, patients, currentTime, isOffline])

  const triggerSessionCompleteAlert = (patientId: number, patientName: string, patientBed: string) => {
    // Redăm sunetul de finalizare a sesiunii
    playAlertSound("session")

    // Afișăm notificarea
    toast({
      title: `Sesiune Finalizată`,
      description: `${patientName} (${patientBed}) - Sesiunea s-a încheiat`,
      variant: "default",
      action: (
        <div
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
          onClick={() => {
            // Găsim și respingem alerta de sesiune
            const sessionAlert = alerts.find((a) => a.patient_id === patientId && a.type === "session" && !a.dismissed)
            if (sessionAlert) {
              dismissAlert(sessionAlert)
            }
          }}
        >
          Închide
        </div>
      ),
    })

    // Trimitem notificare nativă
    sendNotification("Sesiune Finalizată", `${patientName} (${patientBed}) - Sesiunea s-a încheiat`)
  }

  const triggerAlert = (alert: Alert) => {
    // Redăm sunetul corespunzător
    playAlertSound(alert.type)

    // Afișăm notificarea în aplicație
    showAlertNotification(alert)

    // Obținem informațiile pacientului
    const patient = patients.find((p) => p.id === alert.patient_id)
    if (!patient) return

    // Trimitem notificare nativă
    let title = ""
    const body = `${patient.name} (${patient.bed}) - ${formatTime(patient.time_elapsed)}`

    if (alert.type === "needles") {
      title = "Alertă: Schimbă Acele"
    } else if (alert.type === "pulse") {
      title = "Alertă: Verifică Pulsul"
    }

    sendNotification(title, body)
  }

  const retriggerAlert = (alert: Alert) => {
    // Redăm sunetul corespunzător
    playAlertSound(alert.type)

    // Afișăm notificarea
    showAlertNotification(alert)

    // Nu trimitem notificări native pentru re-declanșări pentru a evita spam-ul
  }

  const playAlertSound = (alertType: AlertType) => {
    if (typeof window === "undefined") return

    try {
      // Verificăm dacă utilizatorul a interacționat cu pagina (necesar pentru iOS)
      const hasInteracted = document.documentElement.classList.contains("user-interacted")

      // Creăm un context audio pentru a debloca audio pe iOS
      const unlockAudio = () => {
        // Creăm un context audio temporar pentru a debloca audio pe iOS
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const audioContext = new AudioContext()
          // Creăm un oscilator scurt și îl oprim imediat
          const oscillator = audioContext.createOscillator()
          oscillator.connect(audioContext.destination)
          oscillator.start(0)
          oscillator.stop(0.001)
        }
      }

      // Încercăm să deblocăm audio pe iOS
      if (hasInteracted) {
        unlockAudio()
      }

      // Folosim Audio API pentru compatibilitate mai bună cu dispozitivele mobile
      const audioFile = new Audio()

      // Setăm sursa audio în funcție de tipul alertei
      if (alertType === "needles") {
        audioFile.src = "/sounds/alert-needles.mp3"
      } else if (alertType === "pulse") {
        audioFile.src = "/sounds/alert-pulse.mp3"
      } else if (alertType === "session") {
        audioFile.src = "/sounds/alert-session.mp3"
      }

      // Setăm volumul
      audioFile.volume = 1.0 // Volum maxim pentru dispozitive mobile

      // Preîncărcăm audio pentru a evita întârzierile
      audioFile.load()

      // Încercăm să redăm sunetul
      const playPromise = audioFile.play()

      // Gestionăm promisiunea pentru a evita erorile pe iOS
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Sunet ${alertType} redat cu succes`)
          })
          .catch((err) => {
            console.error(`Eroare la redarea sunetului ${alertType}:`, err)

            // Dacă nu a funcționat Audio API, încercăm Web Audio API ca fallback
            fallbackAudioPlay(alertType)
          })
      }
    } catch (e) {
      console.error("Eroare la redarea sunetului:", e)
      // Încercăm metoda de rezervă
      fallbackAudioPlay(alertType)
    }
  }

  // Funcție de rezervă folosind Web Audio API
  const fallbackAudioPlay = (alertType: AlertType) => {
    try {
      // Creăm un context audio nou pentru fiecare sunet
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) {
        console.error("Web Audio API nu este suportată de acest browser")
        return
      }

      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Configurăm sunetul în funcție de tipul alertei
      if (alertType === "needles") {
        oscillator.type = "sine"
        oscillator.frequency.value = 600
        gainNode.gain.value = 0.3
      } else if (alertType === "pulse") {
        oscillator.type = "sine"
        oscillator.frequency.value = 400
        gainNode.gain.value = 0.3
      } else if (alertType === "session") {
        oscillator.type = "sine"
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.4
      }

      // Conectăm nodurile audio
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Adăugăm un fade-in și fade-out pentru un sunet mai plăcut
      const currentTime = audioContext.currentTime
      gainNode.gain.setValueAtTime(0, currentTime)
      gainNode.gain.linearRampToValueAtTime(gainNode.gain.value, currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5)

      // Redăm sunetul
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        oscillator.disconnect()
        gainNode.disconnect()
      }, 500)
    } catch (e) {
      console.error("Eroare la redarea sunetului de rezervă:", e)
    }
  }

  const showAlertNotification = (alert: Alert) => {
    // Obținem informațiile pacientului
    const patient = patients.find((p) => p.id === alert.patient_id)
    if (!patient) return

    // Determinăm conținutul notificării în funcție de tipul alertei
    let title = ""
    let bgColor = ""
    let description = `${patient.name} (${patient.bed}) - ${formatTime(patient.time_elapsed)}`

    if (alert.type === "needles") {
      title = "Alertă: Schimbă Acele"
      bgColor = "bg-gradient-to-r from-red-600 to-red-700"
    } else if (alert.type === "pulse") {
      title = "Alertă: Verifică Pulsul"
      bgColor = "bg-gradient-to-r from-blue-600 to-blue-700"
    } else if (alert.type === "session") {
      title = "Sesiune Finalizată"
      bgColor = "bg-gradient-to-r from-green-600 to-green-700"
      description = `${patient.name} (${patient.bed}) - Sesiunea s-a încheiat`
    }

    // Afișăm notificarea
    toast({
      title: title,
      description: description,
      variant: alert.type === "needles" ? "destructive" : "default",
      action: (
        <div
          className={`${bgColor} text-white px-4 py-2 rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all duration-200`}
          onClick={() => dismissAlert(alert)}
        >
          Închide
        </div>
      ),
    })
  }

  const sendNotification = (title: string, body: string) => {
    if (typeof window === "undefined") return

    // Verificăm dacă notificările sunt suportate și permise
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        // Verificăm dacă serviciul de worker este disponibil pentru notificări mai avansate
        if ("serviceWorker" in navigator && "PushManager" in window) {
          // Folosim notificări prin Service Worker dacă este posibil
          navigator.serviceWorker.ready
            .then((registration) => {
              registration
                .showNotification(title, {
                  body: body,
                  icon: "/favicon.ico",
                  badge: "/favicon.ico", // Pentru Android
                  sound: true, // Încercăm să activăm sunetul (nu funcționează pe toate platformele)
                  tag: "patient-alert", // Grupăm notificările similare
                  renotify: true, // Notifică din nou utilizatorul chiar dacă există o notificare cu același tag
                })
                .catch((err) => {
                  console.error("Eroare la afișarea notificării prin Service Worker:", err)
                  // Fallback la notificări standard
                  fallbackNotification(title, body)
                })
            })
            .catch((err) => {
              console.error("Service Worker nu este pregătit:", err)
              // Fallback la notificări standard
              fallbackNotification(title, body)
            })
        } else {
          // Fallback la notificări standard
          fallbackNotification(title, body)
        }
      } catch (error) {
        console.error("Eroare la trimiterea notificării:", error)
        // Încercăm metoda de rezervă
        fallbackNotification(title, body)
      }
    }
  }

  // Funcție de rezervă pentru notificări
  const fallbackNotification = (title: string, body: string) => {
    try {
      const notification = new Notification(title, {
        body: body,
        icon: "/favicon.ico",
      })

      // Adăugăm un handler pentru click pe notificare
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error("Eroare la trimiterea notificării de rezervă:", error)
    }
  }

  // Actualizăm funcția dismissAlert pentru a marca alerta ca respinsă în baza de date
  const dismissAlert = async (alert: Alert) => {
    // Actualizăm starea locală
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, dismissed: true } : a)))

    // Actualizăm în baza de date doar dacă nu suntem offline
    if (!isOffline) {
      await updateAlertInDb(alert.id, { dismissed: true }).catch((err) =>
        console.error("Eroare la actualizarea alertei în baza de date:", err),
      )
    }
  }

  // Modificăm funcția updatePatient pentru a gestiona mai bine erorile și sincronizarea

  const updatePatient = async (id: number, data: Partial<Patient>) => {
    console.log("Actualizare pacient:", id, data)

    // Verificăm dacă avem date valide
    if (!id || id <= 0) {
      console.error("ID pacient invalid:", id)
      return
    }

    // Actualizăm starea locală
    setPatients((prev) => {
      const updatedPatients = prev.map((p) => {
        if (p.id === id) {
          // Creăm o copie a pacientului cu valorile actualizate
          const updatedPatient = {
            ...p,
            name: data.name ?? p.name,
            bed: data.bed ?? p.bed,
            timer_running: data.timer_running !== undefined ? data.timer_running : p.timer_running,
            time_elapsed: data.time_elapsed !== undefined ? data.time_elapsed : p.time_elapsed,
            session_duration: data.session_duration !== undefined ? data.session_duration : p.session_duration,
          }

          // Dacă pornim timerul, ne asigurăm că nu resetăm timpul scurs
          if (data.timer_running === true && p.timer_running === false) {
            console.log("Pornire timer pentru pacientul", id, "cu timpul", updatedPatient.time_elapsed)

            // Actualizăm referințele locale
            localTimersRef.current[id] = true
            localTimesRef.current[id] = updatedPatient.time_elapsed

            // Actualizăm timestamp-ul ultimei actualizări pentru a evita resetarea
            if (typeof window !== "undefined") {
              lastTickTimeRef.current = Date.now()
            }
          } else if (data.timer_running === false && p.timer_running === true) {
            // Dacă oprim timerul, actualizăm referințele locale
            localTimersRef.current[id] = false
          }

          return updatedPatient
        }
        return p
      })

      return updatedPatients
    })

    const dbData: Partial<Patient> = {}

    // Adăugăm doar proprietățile care au valori definite
    if (data.name !== undefined) dbData.name = data.name
    if (data.bed !== undefined) dbData.bed = data.bed
    if (data.timer_running !== undefined) dbData.timer_running = data.timer_running
    if (data.time_elapsed !== undefined) dbData.time_elapsed = data.time_elapsed
    if (data.session_duration !== undefined) dbData.session_duration = data.session_duration

    // Actualizăm timpul ultimei sincronizări
    lastSyncTimeRef.current = Date.now()

    // Actualizăm în baza de date doar dacă nu suntem offline și avem date de actualizat
    if (!isOffline && Object.keys(dbData).length > 0) {
      try {
        const success = await updatePatientInDb(id, dbData)
        if (!success) {
          console.warn("Actualizarea pacientului în baza de date a eșuat")
        }
      } catch (err) {
        console.error("Eroare la actualizarea pacientului în baza de date:", err)
      }
    }
  }

  const addAlert = async (patientId: number, type: AlertType, minutesFromNow: number) => {
    const patient = patients.find((p) => p.id === patientId)
    if (!patient) return

    const triggerAt = patient.time_elapsed + minutesFromNow * 60

    // Generăm un ID local pentru alerta nouă
    const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Creăm alerta
    const newAlert = {
      id: localId,
      patient_id: patientId,
      type,
      trigger_at: triggerAt,
      triggered: false,
      dismissed: false,
      last_triggered_at: undefined,
    }

    // Adăugăm alerta în starea locală imediat
    setAlerts((prev) => [...prev, newAlert])

    // Încercăm să adăugăm în baza de date doar dacă nu suntem offline
    if (!isOffline) {
      try {
        // Omitem id pentru a permite Supabase să îl genereze
        const { id, ...alertData } = newAlert
        const serverId = await addAlertToDb(alertData)

        if (serverId) {
          // Actualizăm ID-ul local cu ID-ul de pe server
          setAlerts((prev) => prev.map((a) => (a.id === localId ? { ...a, id: serverId } : a)))
        }
      } catch (err) {
        console.error("Eroare la adăugarea alertei în baza de date:", err)

        // Afișăm un mesaj de eroare pentru utilizator
        toast({
          title: "Eroare la adăugarea alertei",
          description: "Alerta a fost adăugată doar local. Verificați configurația Supabase.",
          variant: "destructive",
        })

        // Setăm modul offline dacă avem erori de RLS
        if (err instanceof Error && err.message.includes("row-level security")) {
          setIsOffline(true)
          toast({
            title: "Mod offline activat",
            description: "Eroare de securitate la nivel de rând (RLS). Verificați politicile RLS în Supabase.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const deleteAlert = async (alertId: string) => {
    // Ștergem din starea locală
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))

    // Ștergem din baza de date doar dacă nu suntem offline
    if (!isOffline) {
      await deleteAlertInDb(alertId).catch((err) => console.error("Eroare la ștergerea alertei din baza de date:", err))
    }
  }

  const getActiveAlerts = (patientId: number) => {
    return alerts.filter((a) => a.patient_id === patientId && a.triggered === true && a.dismissed === false)
  }

  const getPendingAlerts = (patientId: number, type: AlertType) => {
    return alerts
      .filter((a) => a.patient_id === patientId && a.type === type && !a.triggered && !a.dismissed)
      .sort((a, b) => a.trigger_at - b.trigger_at)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!isClientReady) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-lg text-blue-700">Se încarcă aplicația...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {isOffline && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <WifiOff className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="font-medium text-yellow-800">Mod offline</h3>
            <p className="text-sm text-yellow-700">
              Aplicația funcționează în mod offline. Datele nu vor fi sincronizate cu serverul.
            </p>
          </div>
        </div>
      )}

      <NotificationPermission />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {patients.map((patient) => {
          const activeAlerts = getActiveAlerts(patient.id)
          const hasActiveAlert = activeAlerts.length > 0
          const hasNeedlesAlert = activeAlerts.some((alert) => alert.type === "needles")
          const hasPulseAlert = activeAlerts.some((alert) => alert.type === "pulse")
          const hasSessionAlert = activeAlerts.some((alert) => alert.type === "session")

          // Convertim pacientul pentru a se potrivi cu interfața componentei PatientTimer
          const patientForComponent = {
            id: patient.id,
            name: patient.name,
            bed: patient.bed,
            timer_running: patient.timer_running,
            time_elapsed: patient.time_elapsed,
            session_duration: patient.session_duration,
          }

          return (
            <div
              key={patient.id}
              className={`relative rounded-xl border p-5 shadow-lg transition-all duration-300 ${
                hasNeedlesAlert
                  ? "border-red-400 bg-gradient-to-br from-red-50 to-white"
                  : hasPulseAlert
                    ? "border-blue-400 bg-gradient-to-br from-blue-50 to-white"
                    : hasSessionAlert
                      ? "border-green-400 bg-gradient-to-br from-green-50 to-white"
                      : "border-gray-200 bg-white hover:shadow-xl"
              }`}
            >
              {hasActiveAlert && (
                <div className="absolute top-3 right-3 animate-pulse">
                  <Bell
                    className={`h-6 w-6 ${
                      hasNeedlesAlert ? "text-red-500" : hasPulseAlert ? "text-blue-500" : "text-green-500"
                    }`}
                  />
                </div>
              )}
              <PatientTimer
                patient={patientForComponent}
                updatePatient={updatePatient}
                addAlert={(type, minutesFromNow) => addAlert(patient.id, type, minutesFromNow)}
                getPendingAlerts={(type) => getPendingAlerts(patient.id, type)}
                activeAlerts={activeAlerts}
                dismissAlert={dismissAlert}
                deleteAlert={deleteAlert}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

