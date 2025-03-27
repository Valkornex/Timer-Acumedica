"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export default function NotificationPermission() {
  const [permissionState, setPermissionState] = useState<string>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false)

  useEffect(() => {
    // Verificăm dacă notificările sunt suportate
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermissionState(Notification.permission)

      // Înregistrăm Service Worker-ul pentru notificări mai bune
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker înregistrat cu succes:", registration)
            setServiceWorkerRegistered(true)
          })
          .catch((error) => {
            console.error("Eroare la înregistrarea Service Worker:", error)
          })
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      // Dacă permisiunea este acordată, trimitem o notificare de test
      if (permission === "granted") {
        // Încercăm să redăm un sunet pentru a debloca Audio API pe iOS
        const audio = new Audio("/sounds/alert-session.mp3")
        audio.volume = 0.1
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.log("Eroare la redarea sunetului de test:", e))
        }

        // Deblocăm Web Audio API pe iOS
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContext) {
            const audioContext = new AudioContext()
            const oscillator = audioContext.createOscillator()
            oscillator.connect(audioContext.destination)
            oscillator.start(0)
            oscillator.stop(0.001)
          }
        } catch (e) {
          console.error("Eroare la deblocarea Web Audio API:", e)
        }

        // Trimitem o notificare de test
        if (serviceWorkerRegistered) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Notificări activate", {
              body: "Veți primi notificări pentru alerte",
              icon: "/favicon.ico",
              badge: "/favicon.ico",
            })
          })
        } else {
          new Notification("Notificări activate", {
            body: "Veți primi notificări pentru alerte",
            icon: "/favicon.ico",
          })
        }
      }
    } catch (error) {
      console.error("Eroare la solicitarea permisiunii:", error)
    }
  }

  if (!isSupported) return null

  if (permissionState === "granted") {
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
        <Bell className="h-5 w-5 text-green-600 mr-3" />
        <p className="text-sm text-green-700">Notificările sunt activate</p>
      </div>
    )
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center mb-2">
        <Bell className="h-5 w-5 text-blue-600 mr-3" />
        <p className="text-sm text-blue-700">Activați notificările pentru alerte</p>
      </div>
      <Button onClick={requestPermission} className="w-full bg-blue-600 hover:bg-blue-700">
        Activează notificări
      </Button>
    </div>
  )
}

