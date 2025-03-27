"use client"

import type React from "react"

import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "./toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  )
}

