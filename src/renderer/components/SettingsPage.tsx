import React, { useState, useEffect } from 'react'
import { AppSettings, defaultAppSettings } from '@shared/appTypes'
import './SettingsPage.css'

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [checkStatus, setCheckStatus] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      const loadedSettings = await window.electronAPI.app.getSettings()
      if (loadedSettings) {
        setSettings(loadedSettings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const applyTheme = (themeChoice: 'light' | 'dark' | 'auto'): void => {
    const root = document.documentElement
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = themeChoice === 'dark' || (themeChoice === 'auto' && systemPrefersDark)

    if (useDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const handleSettingChange = (
    category: keyof AppSettings,
    key: string,
    value: any
  ): void => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
    setUnsavedChanges(true)

    if (category === 'general' && key === 'theme') {
      applyTheme(value as 'light' | 'dark' | 'auto')
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      await window.electronAPI.app.saveSettings(settings)
      setSaveSuccess(true)
      setUnsavedChanges(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const handleReset = (): void => {
    if (window.confirm('Tem certeza? Todas as configurações serão redefinidas para o padrão.')) {
      loadSettings()
      setUnsavedChanges(false)
    }
  }

  const handleChromeDriverCheck = async (): Promise<void> => {
    try {
      setCheckingUpdate(true)
      setCheckStatus('Verificando atualizações do ChromeDriver...')
      const status = await window.electronAPI.chromeDriver.update()
      const appStatus = await window.electronAPI.app.getStatus()
      setSettings((prev) => ({
        ...prev,
        chrome: {
          ...prev.chrome,
          version: status.currentVersion || appStatus.chromeDriverVersion || prev.chrome.version,
        },
      }))

      setCheckStatus(
        status.updated
          ? `ChromeDriver atualizado para ${status.currentVersion}`
          : status.updateAvailable
          ? `Atualização disponível: ${status.targetVersion}`
          : `ChromeDriver está atualizado: ${status.currentVersion || appStatus.chromeDriverVersion || 'não instalado'}`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setCheckStatus(`Falha ao verificar atualizações: ${message}`)
      console.error(message)
    } finally {
      setCheckingUpdate(false)
      setTimeout(() => setCheckStatus(''), 5000)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Personalize o comportamento da aplicação
        </p>
      </div>

      <div className="settings-container">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {[
              { id: 'general', label: 'Geral', icon: '⚙️' },
              { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
              { id: 'chrome', label: 'ChromeDriver', icon: '🔧' },
              { id: 'backup', label: 'Backup', icon: '💾' },

            ].map((item) => (
              <button
                key={item.id}
                className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2 className="section-title">Configurações Gerais</h2>
              <div className="settings-form">
                {/* Theme Selection */}
                <div className="form-group">
                  <label htmlFor="theme-select" className="form-label">
                    Tema da Interface
                  </label>
                  <select
                    id="theme-select"
                    className="form-select"
                    value={settings.general.theme}
                    onChange={(e) =>
                      handleSettingChange(
                        'general',
                        'theme',
                        e.target.value as 'light' | 'dark' | 'auto'
                      )
                    }
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                {/* Language Selection */}
                <div className="form-group">
                  <label htmlFor="language-select" className="form-label">
                    Idioma
                  </label>
                  <select
                    id="language-select"
                    className="form-select"
                    value={settings.general.language}
                    onChange={(e) =>
                      handleSettingChange('general', 'language', e.target.value)
                    }
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (España)</option>
                  </select>
                </div>

                {/* Update Check Interval */}
                <div className="form-group">
                  <label htmlFor="update-interval" className="form-label">
                    Intervalo de Verificação de Atualizações (horas)
                  </label>
                  <input
                    id="update-interval"
                    type="number"
                    min="1"
                    max="168"
                    className="form-input"
                    value={settings.general.autoUpdateCheckInterval}
                    onChange={(e) =>
                      handleSettingChange('general', 'autoUpdateCheckInterval', parseInt(e.target.value))
                    }
                  />
                </div>

                {/* Notifications Toggle */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.general.enableNotifications}
                      onChange={(e) =>
                        handleSettingChange('general', 'enableNotifications', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Ativar notificações</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.general.betaUpdates}
                      onChange={(e) =>
                        handleSettingChange('general', 'betaUpdates', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Receber atualizações beta</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.general.telemetryEnabled}
                      onChange={(e) =>
                        handleSettingChange('general', 'telemetryEnabled', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Compartilhar telemetria local de uso</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Settings */}
          {activeTab === 'whatsapp' && (
            <div className="settings-section">
              <h2 className="section-title">Configurações do WhatsApp</h2>
              <div className="settings-form">
                {/* Auto Reconnect */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp.autoReconnect}
                      onChange={(e) =>
                        handleSettingChange('whatsapp', 'autoReconnect', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Reconectar automaticamente</span>
                  </label>
                </div>

                {/* Reconnect Delay */}
                <div className="form-group">
                  <label htmlFor="reconnect-delay" className="form-label">
                    Atraso de Reconexão (ms)
                  </label>
                  <input
                    id="reconnect-delay"
                    type="number"
                    min="1000"
                    step="1000"
                    className="form-input"
                    value={settings.whatsapp.reconnectDelay}
                    onChange={(e) =>
                      handleSettingChange('whatsapp', 'reconnectDelay', parseInt(e.target.value))
                    }
                  />
                </div>

                {/* Session Timeout */}
                <div className="form-group">
                  <label htmlFor="session-timeout" className="form-label">
                    Tempo de Expiração da Sessão (ms)
                  </label>
                  <input
                    id="session-timeout"
                    type="number"
                    min="10000"
                    step="10000"
                    className="form-input"
                    value={settings.whatsapp.sessionTimeout}
                    onChange={(e) =>
                      handleSettingChange('whatsapp', 'sessionTimeout', parseInt(e.target.value))
                    }
                  />
                </div>

                {/* Auto Read Messages */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp.enableAutoRead}
                      onChange={(e) =>
                        handleSettingChange('whatsapp', 'enableAutoRead', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Marcar mensagens como lidas automaticamente</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ChromeDriver Settings */}
          {activeTab === 'chrome' && (
            <div className="settings-section">
              <h2 className="section-title">Configurações do ChromeDriver</h2>
              <div className="settings-form">
                {/* Auto Update */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.chrome.autoUpdate}
                      onChange={(e) =>
                        handleSettingChange('chrome', 'autoUpdate', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Atualizar ChromeDriver automaticamente</span>
                  </label>
                </div>

                {/* Check Interval */}
                <div className="form-group">
                  <label htmlFor="chrome-check-interval" className="form-label">
                    Intervalo de Verificação (horas)
                  </label>
                  <input
                    id="chrome-check-interval"
                    type="number"
                    min="1"
                    max="168"
                    className="form-input"
                    value={settings.chrome.checkInterval}
                    onChange={(e) =>
                      handleSettingChange('chrome', 'checkInterval', parseInt(e.target.value))
                    }
                  />
                </div>

                {/* Current Version */}
                <div className="form-group">
                  <label className="form-label">Versão Instalada</label>
                  <div className="form-display">
                    {settings.chrome.version || 'Não instalado'}
                  </div>
                </div>

                {/* Check for Updates Button */}
                <div className="form-group">
                  <button
                    className="btn-secondary w-full"
                    onClick={handleChromeDriverCheck}
                    disabled={checkingUpdate}
                  >
                    {checkingUpdate ? 'Verificando...' : 'Verificar Atualizações Agora'}
                  </button>
                  {checkStatus && <p className="mt-2 text-sm text-gray-500">{checkStatus}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="settings-section">
              <h2 className="section-title">Configurações de Backup</h2>
              <div className="settings-form">
                {/* Auto Backup */}
                <div className="form-group">
                  <label className="form-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.backup.autoBackup}
                      onChange={(e) =>
                        handleSettingChange('backup', 'autoBackup', e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span>Backup automático de contatos</span>
                  </label>
                </div>

                {/* Backup Interval */}
                <div className="form-group">
                  <label htmlFor="backup-interval" className="form-label">
                    Intervalo de Backup (dias)
                  </label>
                  <input
                    id="backup-interval"
                    type="number"
                    min="1"
                    max="30"
                    className="form-input"
                    value={settings.backup.backupInterval}
                    onChange={(e) =>
                      handleSettingChange('backup', 'backupInterval', parseInt(e.target.value))
                    }
                  />
                </div>

                {/* Backup Location */}
                <div className="form-group">
                  <label className="form-label">Pasta de Backup</label>
                  <div className="backup-path-container">
                    <input
                      type="text"
                      className="form-input flex-1"
                      value={settings.backup.backupPath}
                      readOnly
                    />
                    <button
                      className="btn-secondary ml-2"
                      type="button"
                      onClick={async () => {
                        const result = await window.electronAPI.backup.selectDirectory()
                        if (!result.canceled) {
                          handleSettingChange('backup', 'backupPath', result.directoryPath)
                        }
                      }}
                    >
                      Alterar
                    </button>

                  </div>
                </div>


                {/* Backup Now Button */}
                <div className="form-group">
                  <button className="btn-secondary w-full">
                    Fazer Backup Agora
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Actions Bar */}
      <div className="settings-actions">
        {unsavedChanges && (
          <div className="unsaved-warning">
            <p className="text-sm">Você tem alterações não salvas</p>
          </div>
        )}
        {saveSuccess && (
          <div className="save-success">
            <p className="text-sm">✓ Configurações salvas com sucesso</p>
          </div>
        )}
        <div className="actions-buttons">
          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={!unsavedChanges}
          >
            Restaurar Padrões
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!unsavedChanges}
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
