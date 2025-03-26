"use client"

import { useEffect } from "react"

// This is a fallback modal that uses vanilla JavaScript
// to create a modal without React's createPortal
const FallbackModal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return

    console.log("FallbackModal - Creating modal with vanilla JS")

    // Create modal elements
    const backdrop = document.createElement("div")
    backdrop.style.position = "fixed"
    backdrop.style.top = "0"
    backdrop.style.left = "0"
    backdrop.style.right = "0"
    backdrop.style.bottom = "0"
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
    backdrop.style.display = "flex"
    backdrop.style.alignItems = "center"
    backdrop.style.justifyContent = "center"
    backdrop.style.zIndex = "9999"

    const modal = document.createElement("div")
    modal.style.backgroundColor = "#fff"
    modal.style.borderRadius = "8px"
    modal.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)"
    modal.style.width = "90%"
    modal.style.maxWidth = "500px"
    modal.style.maxHeight = "90vh"
    modal.style.overflowY = "auto"
    modal.style.zIndex = "10000"
    modal.style.position = "relative"

    const header = document.createElement("div")
    header.style.display = "flex"
    header.style.alignItems = "center"
    header.style.justifyContent = "space-between"
    header.style.padding = "16px"
    header.style.borderBottom = "1px solid #e5e7eb"

    const titleEl = document.createElement("h3")
    titleEl.style.margin = "0"
    titleEl.style.fontSize = "1.25rem"
    titleEl.style.fontWeight = "600"
    titleEl.textContent = title

    const closeBtn = document.createElement("button")
    closeBtn.style.background = "transparent"
    closeBtn.style.border = "none"
    closeBtn.style.cursor = "pointer"
    closeBtn.style.padding = "4px"
    closeBtn.textContent = "×"
    closeBtn.style.fontSize = "24px"
    closeBtn.onclick = () => {
      document.body.removeChild(backdrop)
      onClose()
    }

    const body = document.createElement("div")
    body.style.padding = "16px"
    body.innerHTML = "<p>This is a fallback modal. If you can see this, the React modal is not working.</p>"

    // Assemble modal
    header.appendChild(titleEl)
    header.appendChild(closeBtn)
    modal.appendChild(header)
    modal.appendChild(body)
    backdrop.appendChild(modal)

    // Add to DOM
    document.body.appendChild(backdrop)

    // Cleanup
    return () => {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop)
      }
    }
  }, [isOpen, onClose, title])

  return null // This component doesn't render anything in the React tree
}

export default FallbackModal

