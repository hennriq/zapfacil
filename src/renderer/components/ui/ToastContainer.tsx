import React, { useState, useCallback } from 'react'
import Toast, { ToastMessage, ToastType } from './Toast'
import './Toast.css'

interface ToastContainerProps {}

export interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContainer: React.FC<ToastContainerProps> = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  // Expor para uso global
  ;(window as any).showToast = addToast
  ;(window as any).showSuccess = (msg: string, duration?: number) => addToast(msg, 'success', duration)
  ;(window as any).showError = (msg: string, duration?: number) => addToast(msg, 'error', duration)
  ;(window as any).showWarning = (msg: string, duration?: number) => addToast(msg, 'warning', duration)
  ;(window as any).showInfo = (msg: string, duration?: number) => addToast(msg, 'info', duration)



  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onClose={removeToast} />
      ))}
    </div>
  )
}

export default ToastContainer
