import React, { useEffect } from 'react'
import './Toast.css'


export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message.duration) return

    const timer = setTimeout(() => {
      onClose(message.id)
    }, message.duration)

    return () => clearTimeout(timer)
  }, [message, onClose])

  const handleClose = (): void => {
    onClose(message.id)
  }

  return (
    <div className={`toast toast-${message.type}`} role="alert">
      <div className="toast-content">
        <span className="toast-icon">
          {message.type === 'success' && '✓'}
          {message.type === 'error' && '✕'}
          {message.type === 'warning' && '⚠'}
          {message.type === 'info' && 'ℹ'}
        </span>
        <span className="toast-message">{message.message}</span>
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Fechar notificação">
        ✕
      </button>
    </div>
  )
}

export default Toast
