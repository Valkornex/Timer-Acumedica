// Service Worker pentru gestionarea notificărilor
self.addEventListener("install", (event) => {
  console.log("Service Worker instalat")
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activat")
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
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "patient-alert",
      }),
    )
  }
})

