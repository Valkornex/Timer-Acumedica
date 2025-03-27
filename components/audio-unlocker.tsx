"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"

export default function AudioUnlocker() {
  const [showUnlocker, setShowUnlocker] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Verificăm dacă suntem pe iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      return /iphone|ipad|ipod/.test(userAgent)
    }

    // Verificăm dacă utilizatorul a interacționat deja
    const hasInteracted = document.documentElement.classList.contains("user-interacted")

    // Afișăm butonul doar pe iOS și dacă utilizatorul nu a interacționat încă
    if (checkIOS() && !hasInteracted) {
      setIsIOS(true)
      setShowUnlocker(true)
    }
  }, [])

  const unlockAudio = () => {
    try {
      // Marcăm interacțiunea utilizatorului
      document.documentElement.classList.add("user-interacted")

      // Redăm toate sunetele cu volum 0 pentru a le preîncărca și debloca
      const sounds = ["/sounds/alert-needles.mp3", "/sounds/alert-pulse.mp3", "/sounds/alert-session.mp3"]

      sounds.forEach((soundSrc) => {
        const audio = new Audio(soundSrc)
        audio.volume = 0.01
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.log("Eroare la deblocarea audio:", e))
          // Oprim sunetul după o scurtă perioadă
          setTimeout(() => {
            try {
              audio.pause()
              audio.currentTime = 0
            } catch (e) {
              console.error("Eroare la oprirea audio:", e)
            }
          }, 100)
        }
      })

      // Deblocăm și Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        oscillator.connect(audioContext.destination)
        oscillator.start(0)
        oscillator.stop(0.001)
      }

      // Ascundem butonul
      setShowUnlocker(false)
    } catch (e) {
      console.error("Eroare la deblocarea audio:", e)
    }
  }

  if (!showUnlocker || !isIOS) {
    return null
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center mb-2">
        <Volume2 className="h-5 w-5 text-blue-600 mr-3" />
        <p className="text-sm text-blue-700">Activați sunetul pentru alerte</p>
      </div>
      <Button onClick={unlockAudio} className="w-full bg-blue-600 hover:bg-blue-700">
        Activează sunetul
      </Button>
    </div>
  )
}

