import React, { useState } from 'react'
import './UpdateNotification.css'


export interface UpdateNotificationProps {
  isVisible: boolean
  currentVersion: string
  targetVersion: string
  isDownloading: boolean
  isInstalling: boolean
  onInstall: () => Promise<void>
  onDismiss: () => void
  onLater: () => void
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  currentVersion,
  targetVersion,
  isDownloading,
  isInstalling,
  onInstall,
  onDismiss,
  onLater,
}) => {
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInstall = async (): Promise<void> => {
    try {
      setInstalling(true)
      setError(null)
      await onInstall()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao instalar atualização'
      setError(message)
    } finally {
      setInstalling(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="update-notification-overlay">
      <div className="update-notification">
        <div className="notification-header">
          <h3>🔄 Atualização Disponível</h3>
          <button
            className="notification-close"
            onClick={onDismiss}
            aria-label="Fechar"
            disabled={installing || isDownloading || isInstalling}
          >
            ✕
          </button>
        </div>

        <div className="notification-content">
          <p className="notification-text">
            Uma nova versão do ChromeDriver está disponível.
          </p>

          <div className="version-info">
            <div className="version-item">
              <span className="version-label">Versão Atual</span>
              <span className="version-value">{currentVersion || 'Não instalado'}</span>
            </div>
            <div className="version-arrow">→</div>
            <div className="version-item">
              <span className="version-label">Nova Versão</span>
              <span className="version-value">{targetVersion}</span>
            </div>
          </div>

          {(isDownloading || isInstalling || installing) && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="progress-text">
                {isDownloading || isInstalling
                  ? 'Baixando atualização...'
                  : 'Instalando atualização...'}
              </p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          <div className="notification-benefits">
            <p className="benefits-title">✨ Benefícios da atualização:</p>
            <ul className="benefits-list">
              <li>Melhorias de compatibilidade</li>
              <li>Correções de segurança</li>
              <li>Melhor performance</li>
            </ul>
          </div>
        </div>

        <div className="notification-actions">
          <button
            className="btn-later"
            onClick={onLater}
            disabled={installing || isDownloading || isInstalling}
          >
            Mais Tarde
          </button>
          <button
            className="btn-install"
            onClick={handleInstall}
            disabled={installing || isDownloading || isInstalling}
          >
            {isDownloading || isInstalling ? 'Processando...' : 'Instalar Agora'}
          </button>
        </div>

        <div className="notification-footer">
          <small>
            Esta atualização é crítica para garantir melhor compatibilidade com WhatsApp.
          </small>
        </div>
      </div>
    </div>
  )
}

export default UpdateNotification
