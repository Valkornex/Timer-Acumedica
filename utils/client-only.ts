export const isClient = typeof window !== "undefined"

export const safeNow = () => {
  if (typeof window !== "undefined") {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now()
    }
    return Date.now()
  }
  return 0 // Valoare implicită pentru server
}

export const runOnClient = (callback: () => void) => {
  if (isClient) {
    callback()
  }
}

// Adăugăm o funcție pentru a genera ID-uri unice
export const generateUniqueId = () => {
  if (typeof window !== "undefined") {
    return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
  return `server-${Math.random().toString(36).substring(2, 15)}`
}

