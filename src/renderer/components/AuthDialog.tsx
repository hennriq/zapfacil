import React, { useEffect, useState } from 'react'
import { Modal } from './ui'
import './AuthDialog.css'

export interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: () => void
}

interface AuthState {
  isAuthenticated: boolean
  isScanning: boolean
  qrCode: string | null
  error: string | null
  attempts: number
}

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isScanning: false,
    qrCode: null,
    error: null,
    attempts: 0,
  })

  useEffect(() => {
    if (!isOpen) return
    let unsubscribe: (() => void) | undefined

    const initAuth = async (): Promise<void> => {
      try {
        setAuthState((prev) => ({
          ...prev,
          isScanning: true,
          error: null,
        }))

        // Simulate getting QR code from WhatsApp
        const qrData = await generateMockQRCode()
        setAuthState((prev) => ({
          ...prev,
          qrCode: qrData,
          isScanning: true,
        }))

        // Start listening for authentication
        unsubscribe = window.electronAPI.whatsApp.onAuthStatusChange?.((status) => {
          if (status === 'authenticated') {
            setAuthState((prev) => ({
              ...prev,
              isAuthenticated: true,
              isScanning: false,
            }))
            onAuthSuccess()
            handleClose()
          } else if (status === 'error') {
            setAuthState((prev) => ({
              ...prev,
              error: 'Falha na autenticação. Tente novamente.',
              attempts: prev.attempts + 1,
              isScanning: false,
            }))
          }
        })

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao iniciar autenticação'
        setAuthState((prev) => ({
          ...prev,
          error: message,
          isScanning: false,
        }))
      }
    }

    void initAuth()

    return () => unsubscribe?.()
  }, [isOpen, onAuthSuccess])

  const generateMockQRCode = async (): Promise<string> => {
    // In production, this would be replaced with actual QR code from WhatsApp Web
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ffffff' width='200' height='200'/%3E%3Cg fill='%23000000'%3E%3Crect x='10' y='10' width='30' height='30'/%3E%3Crect x='160' y='10' width='30' height='30'/%3E%3Crect x='10' y='160' width='30' height='30'/%3E%3C/g%3E%3C/svg%3E`
  }

  const handleRetry = (): void => {
    setAuthState((prev) => ({
      ...prev,
      error: null,
      isScanning: true,
      qrCode: null,
    }))
  }

  const handleClose = (): void => {
    setAuthState({
      isAuthenticated: false,
      isScanning: false,
      qrCode: null,
      error: null,
      attempts: 0,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="auth-dialog">
        <div className="auth-header">
          <h2 className="text-2xl font-bold text-center">Conectar WhatsApp</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            Escaneie o código QR com seu telefone para conectar
          </p>
        </div>

        <div className="auth-content">
          {authState.isScanning && authState.qrCode && !authState.error ? (
            <>
              <div className="qr-code-container">
                <img
                  src={authState.qrCode}
                  alt="QR Code para autenticação do WhatsApp"
                  className="qr-code"
                />
              </div>
              <div className="auth-info">
                <div className="spinner"></div>
                <p className="text-center text-gray-700 dark:text-gray-300 mt-4">
                  Aguardando escaneamento...
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Mantenha o código QR visível na tela
                </p>
              </div>
            </>
          ) : authState.error ? (
            <>
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <p className="text-center text-red-600 dark:text-red-400 font-semibold mt-4">
                  {authState.error}
                </p>
                {authState.attempts < 3 && (
                  <div className="auth-actions mt-6">
                    <button className="btn-primary w-full" onClick={handleRetry}>
                      Tentar Novamente
                    </button>
                    <button className="btn-secondary w-full" onClick={handleClose}>
                      Cancelar
                    </button>
                  </div>
                )}
                {authState.attempts >= 3 && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Muitas tentativas. Por favor, reinicie a aplicação e tente novamente.
                    </p>
                    <button className="btn-secondary w-full" onClick={handleClose}>
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : authState.isAuthenticated ? (
            <div className="success-container">
              <div className="success-icon">✓</div>
              <p className="text-center text-green-600 dark:text-green-400 font-semibold mt-4">
                Autenticação bem-sucedida!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                WhatsApp conectado e pronto para uso
              </p>
            </div>
          ) : (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="text-center text-gray-700 dark:text-gray-300 mt-4">
                Carregando código QR...
              </p>
            </div>
          )}
        </div>

        <div className="auth-footer">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Sua senha não será armazenada. A autenticação é feita de forma segura.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default AuthDialog
