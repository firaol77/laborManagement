"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Toast } from "./toast"

// Create a custom event for toast notifications
export const toast = {
  success: (message, title) => {
    const event = new CustomEvent("toast", {
      detail: { type: "success", message, title },
    })
    document.dispatchEvent(event)
  },
  error: (message, title) => {
    const event = new CustomEvent("toast", {
      detail: { type: "error", message, title },
    })
    document.dispatchEvent(event)
  },
  warning: (message, title) => {
    const event = new CustomEvent("toast", {
      detail: { type: "warning", message, title },
    })
    document.dispatchEvent(event)
  },
  info: (message, title) => {
    const event = new CustomEvent("toast", {
      detail: { type: "info", message, title },
    })
    document.dispatchEvent(event)
  },
}

export const Toaster = () => {
  const [toasts, setToasts] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleToast = (event) => {
      const { type, message, title } = event.detail
      const id = Date.now()
      setToasts((prev) => [...prev, { id, type, message, title }])

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, 5000)
    }

    document.addEventListener("toast", handleToast)

    return () => {
      document.removeEventListener("toast", handleToast)
    }
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  if (!mounted) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body,
  )
}

