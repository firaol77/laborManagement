"use client"
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react"

export const Toast = ({ type, title, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-success" size={20} />,
    error: <AlertCircle className="text-danger" size={20} />,
    warning: <AlertTriangle className="text-warning" size={20} />,
    info: <Info className="text-info" size={20} />,
  }

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  )
}

