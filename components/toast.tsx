"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

type ToastProps = {
  id: string
  title: string
  description: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
  onDismiss: (id: string) => void
}

export function Toast({ id, title, description, variant = "default", action, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } fixed bottom-4 right-4 z-50 max-w-md transition-all duration-300 ease-in-out transform ${
        variant === "destructive" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
      } border rounded-lg shadow-lg p-4`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-medium ${variant === "destructive" ? "text-red-800" : "text-gray-900"}`}>{title}</h3>
          <p className={`mt-1 text-sm ${variant === "destructive" ? "text-red-700" : "text-gray-500"}`}>
            {description}
          </p>
        </div>
        <button
          onClick={() => onDismiss(id)}
          className={`ml-4 p-1 rounded-full ${
            variant === "destructive" ? "text-red-600 hover:bg-red-100" : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ToastContainer({ toasts, dismiss }: { toasts: any[]; dismiss: (id: string) => void }) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={dismiss} />
      ))}
    </>
  )
}

