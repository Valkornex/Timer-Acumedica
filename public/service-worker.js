// Service Worker pentru gestionarea notificărilor
self.addEventListener("install", (event) => {
  console.log("Service Worker instalat")
  // Forțăm activarea imediată a service worker-ului
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activat")
  // Preluăm controlul imediat asupra tuturor paginilor
  event.waitUntil(clients.claim())
})

// Gestionăm evenimentul de notificare
self.addEventListener("notificationclick", (event) => {
  console.log("Notificare click", event)

  // Închide notificarea
  event.notification.close()

  // Deschide fereastra aplicației când utilizatorul face click pe notificare
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Verificăm dacă există deja o fereastră deschisă și o focalizăm
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }

      // Dacă nu există nicio fereastră deschisă, deschidem una nouă
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    }),
  )
})

// Gestionăm evenimentul push pentru notificări push
self.addEventListener("push", (event) => {
  console.log("Push primit", event)

  if (event.data) {
    try {
      const data = event.data.json()

      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "patient-alert",
          vibrate: [200, 100, 200], // Adăugăm vibrație pentru dispozitive mobile
          requireInteraction: true, // Notificarea rămâne vizibilă până când utilizatorul interacționează cu ea
        }),
      )
    } catch (e) {
      console.error("Eroare la procesarea datelor push:", e)

      // Încercăm să afișăm o notificare simplă în caz de eroare
      event.waitUntil(
        self.registration.showNotification("Notificare nouă", {
          body: "Aveți o alertă nouă",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          requireInteraction: true,
        }),
      )
    }
  }
})

// Adăugăm un handler pentru fetch pentru a gestiona cererile offline
self.addEventListener("fetch", (event) => {
  // Lăsăm browserul să gestioneze cererile în mod normal
  // Acest handler este necesar pentru ca service worker-ul să fie considerat valid
})

// Adăugăm un handler pentru a menține service worker-ul activ
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "KEEP_ALIVE") {
    console.log("Keeping service worker alive")
  }
})

