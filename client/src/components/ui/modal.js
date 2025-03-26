"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const Modal = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"

      // Add escape key handler
      const handleEscape = (e) => {
        if (e.key === "Escape") onClose()
      }
      document.addEventListener("keydown", handleEscape)

      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  // Use inline styles to avoid any CSS conflicts
  return createPortal(
    <div
      onClick={(e) => {
        // Only close if the backdrop itself is clicked, not its children
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999, // Very high z-index to ensure it's on top
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 100000, // Even higher z-index
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{title}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent event bubbling
              onClose()
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          style={{
            padding: "16px",
            maxHeight: "calc(90vh - 130px)",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default Modal

