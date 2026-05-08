import { useCallback, useEffect, useMemo, useState, JSX } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PerformanceSummary, TelemetrySummary } from '@shared/appTypes'

import { IContact } from '@shared/interfaces'
import { Header, Sidebar } from './components/layout'
import { Modal, StatCard, ToastContainer } from './components/ui'
import { RechartsLineChart, RechartsPieChart } from './components/charts'
import { TemplatesList, TemplateEditor, type Template } from './components/templates'
import ContactsList from './components/ContactsList'
import MessageComposer from './components/MessageComposer'
import { ContactsManagementPage } from './components/contacts/ContactsManagementPage'

import StatusMonitor, { StatusLog } from './components/StatusMonitor'
import ReportsPage from './components/ReportsPage'
import AuthDialog from './components/AuthDialog'
import SettingsPage from './components/SettingsPage'
import UpdateNotification from './components/UpdateNotification'

interface AppState {
  isReady: boolean
  contacts: IContact[]
  selectedContactIds: string[]
  message: string
  isSending: boolean
  statusMessage: string
  chromeDriverVersion: string
}

interface UpdateState {
  isUpdateAvailable: boolean
  currentVersion: string
  targetVersion: string
  isDownloading: boolean
  isInstalling: boolean
}

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [state, setState] = useState<AppState>({
    isReady: false,
    contacts: [],
    selectedContactIds: [],
    message: '',
    isSending: false,
    statusMessage: 'Inicializando interface...',
    chromeDriverVersion: '',
  })
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    'connecting'
  )
  const [logs, setLogs] = useState<StatusLog[]>([])
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Boas-vindas',
      content: 'Olá {{nome}}, seja bem-vindo!',
      characterCount: 35,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Promoção',
      content: 'Olá {{nome}}, confira nossa promoção exclusiva para sua empresa {{empresa}}!',
      characterCount: 75,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Cobrança',
      content: 'Prezado {{nome}}, sua fatura venceu em {{data}}. Por favor, entre em contato conosco.',
      characterCount: 78,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  const [telemetrySummary, setTelemetrySummary] = useState<TelemetrySummary>({
    totalEvents: 0,
    eventsByName: {},
  })
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [updateState, setUpdateState] = useState<UpdateState>({
    isUpdateAvailable: false,
    currentVersion: '',
    targetVersion: '',
    isDownloading: false,
    isInstalling: false,
  })

  const pushLog = useCallback((log: Omit<StatusLog, 'id' | 'timestamp'>): void => {
    setLogs((prev) => [
      ...prev.slice(-99),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
        ...log,
      },
    ])
  }, [])

  const applyTheme = (themeChoice: 'light' | 'dark' | 'auto', systemPrefersDark?: boolean): void => {
    const root = document.documentElement
    const systemDark = systemPrefersDark ?? window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = themeChoice === 'dark' || (themeChoice === 'auto' && systemDark)

    if (useDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setIsDarkMode(useDark)
  }

  useEffect(() => {
    let unsubscribeLog: (() => void) | undefined
    let unsubscribeSettings: (() => void) | undefined
    let unsubscribeUpdate: (() => void) | undefined
    let mediaQuery: MediaQueryList | null = null

    const handlePrefersColorSchemeChange = (event: MediaQueryListEvent): void => {
      if (theme === 'auto') {
        applyTheme('auto', event.matches)
      }
    }

    async function loadStatus(): Promise<void> {
      try {
        unsubscribeLog = window.electronAPI.app.onLog((entry) => {
          pushLog({
            level:
              entry.level === 'WARN'
                ? 'warning'
                : entry.level === 'ERROR'
                  ? 'error'
                  : entry.level === 'INFO' || entry.level === 'DEBUG'
                    ? 'info'
                    : 'info',
            message: `[${entry.context}] ${entry.message}`,
          })
        })

        // Listen for update notifications
        unsubscribeUpdate = window.electronAPI.chromeDriver?.onUpdateAvailable?.((data) => {
          setUpdateState({
            isUpdateAvailable: true,
            currentVersion: data.currentVersion,
            targetVersion: data.targetVersion || data.currentVersion,
            isDownloading: data.isDownloading || false,
            isInstalling: data.isInstalling || false,
          })
            ; (window as any).showWarning?.(`ChromeDriver ${data.targetVersion || data.currentVersion} disponível`)
        })

        const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
          let timer: number | undefined
          try {
            return await new Promise<T>((resolve) => {
              timer = window.setTimeout(() => resolve(fallback), ms)
              promise.then(resolve).catch(() => resolve(fallback))
            })
          } finally {
            if (timer) window.clearTimeout(timer)
          }
        }

        const [status, appSettings] = await Promise.all([
          withTimeout(window.electronAPI.app.getStatus(), 9000, {
            ready: false,
            chromeDriverPath: '',
            chromeDriverVersion: 'Nao instalado',
            whatsappStatus: 'connecting',
          }),
          withTimeout(window.electronAPI.app.getSettings(), 9000, ({} as any)),
        ])

        const themeFromSettings = appSettings?.general?.theme ?? 'light'
        applyTheme(themeFromSettings)
        setTheme(themeFromSettings)

        setWhatsappStatus((status.whatsappStatus as any) || 'connecting')
        setState((prev) => ({
          ...prev,
          isReady: true,
          statusMessage: 'Pronto para importar contatos',
          chromeDriverVersion: status.chromeDriverVersion || 'Nao instalado',
        }))
        pushLog({ level: 'success', message: 'Interface conectada ao processo principal' })
        await window.electronAPI.telemetry.track({ name: 'app_opened' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setState((prev) => ({ ...prev, statusMessage: message }))
        pushLog({ level: 'error', message })
      }
    }

    loadStatus()

    if (window.electronAPI.app.onSettingsChanged) {
      unsubscribeSettings = window.electronAPI.app.onSettingsChanged((settings) => {
        setTheme(settings.general.theme)
        applyTheme(settings.general.theme)
      })
    }

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handlePrefersColorSchemeChange)

    return () => {
      unsubscribeLog?.()
      unsubscribeSettings?.()
      unsubscribeUpdate?.()
      mediaQuery?.removeEventListener('change', handlePrefersColorSchemeChange)
    }
  }, [pushLog, theme])

  useEffect(() => {
    async function loadReports(): Promise<void> {
      try {
        const [telemetry, performance] = await Promise.all([
          window.electronAPI.telemetry.getSummary(),
          window.electronAPI.app.getPerformanceSummary(),
        ])
        setTelemetrySummary(telemetry)
        setPerformanceSummary(performance)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        pushLog({ level: 'warning', message: `Falha ao carregar relatórios: ${message}` })
      }
    }

    if (currentPage === 'reports') {
      loadReports()
    }
  }, [currentPage, pushLog])


  const stats = useMemo(() => {
    const sent = state.contacts.filter((contact) => contact.status === 'enviado').length
    const failed = state.contacts.filter((contact) => contact.status === 'erro').length
    return { sent, failed, pending: state.contacts.length - sent - failed }
  }, [state.contacts])

  const selectedContacts = useMemo(() => {
    const selectedIds = new Set(state.selectedContactIds)
    return state.contacts.filter((contact) => selectedIds.has(contact.id))
  }, [state.contacts, state.selectedContactIds])

  const handleSendMessages = async (): Promise<void> => {
    if (selectedContacts.length === 0) {
      setState((prev) => ({ ...prev, statusMessage: 'Selecione ao menos um contato' }))
      return
    }

    setState((prev) => ({ ...prev, isSending: true, statusMessage: 'Enviando mensagens...' }))

    try {
      const result = await window.electronAPI.whatsApp.sendMessages(selectedContacts, state.message)
      const contacts = state.contacts.map((contact) => {
        const sendResult = result.results.find((item) => item.contactId === contact.id)
        if (!sendResult) return contact

        return {
          ...contact,
          status: sendResult.success ? 'enviado' as const : 'erro' as const,
        }
      })

      setState((prev) => ({
        ...prev,
        contacts,
        statusMessage: result.canceled ? 'Envio cancelado' : 'Envio concluido',
      }))
      pushLog({
        level: result.canceled ? 'warning' : 'success',
        message: result.canceled
          ? `Envio cancelado apos ${result.results.length} contato(s)`
          : `Envio concluido para ${result.results.length} contato(s)`,
      })
      await window.electronAPI.telemetry.track({
        name: 'messages_sent',
        properties: { total: result.results.length },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState((prev) => ({ ...prev, statusMessage: message }))
      pushLog({ level: 'error', message })
    } finally {
      setState((prev) => ({ ...prev, isSending: false }))
    }
  }

  const handleCancelSendMessages = async (): Promise<void> => {
    await window.electronAPI.whatsApp.cancelSending()
    setState((prev) => ({ ...prev, statusMessage: 'Cancelamento solicitado...' }))
    pushLog({ level: 'warning', message: 'Cancelamento do envio solicitado pelo usuario' })
  }

  const handleImportContacts = async (): Promise<void> => {
    setState((prev) => ({ ...prev, statusMessage: 'Importando CSV...' }))

    try {
      const result = await window.electronAPI.contacts.importCsv()
      if (result.canceled) {
        setState((prev) => ({ ...prev, statusMessage: 'Importacao cancelada' }))
        return
      }

      setState((prev) => ({
        ...prev,
        contacts: result.contacts,
        selectedContactIds: result.contacts.map((contact) => contact.id),
        statusMessage: `${result.contacts.length} contato(s) importado(s)`,
      }))
      pushLog({ level: 'success', message: `${result.contacts.length} contato(s) importado(s)` })
      await window.electronAPI.telemetry.track({
        name: 'contacts_imported',
        properties: { total: result.contacts.length },
      })

      if (result.validation && !result.validation.isValid) {
        pushLog({ level: 'warning', message: result.validation.errors.join('; ') })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState((prev) => ({ ...prev, statusMessage: message }))
      pushLog({ level: 'error', message })
    }
  }

  const handleExportContacts = async (): Promise<void> => {
    const result = await window.electronAPI.contacts.exportCsv(state.contacts)

    if (!result.canceled) {
      pushLog({ level: 'success', message: `Contatos exportados para ${result.filePath}` })
    }
  }

  const handleSelectedContactsChange = (selectedContactIds: string[]): void => {
    setState((prev) => ({ ...prev, selectedContactIds }))
  }

  const handleContactsChange = (nextContacts: IContact[]): void => {
    const nextIds = new Set(nextContacts.map((contact) => contact.id))

    setState((prev) => ({
      ...prev,
      contacts: nextContacts,
      selectedContactIds: prev.selectedContactIds.filter((id) => nextIds.has(id)),
    }))
  }

  const handleSaveTemplate = (
    templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): void => {
    if (templateData.id) {
      // Update existing template
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateData.id
            ? {
              ...t,
              ...templateData,
              updatedAt: new Date(),
            }
            : t
        )
      )
      pushLog({ level: 'success', message: `Template "${templateData.name}" atualizado` })
    } else {
      // Create new template
      const newTemplate: Template = {
        ...templateData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setTemplates((prev) => [...prev, newTemplate])
      pushLog({ level: 'success', message: `Template "${templateData.name}" criado` })
    }

    setIsEditorOpen(false)
    setEditingTemplate(undefined)
  }

  const handleDeleteTemplate = (id: string): void => {
    const template = templates.find((t) => t.id === id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    pushLog({ level: 'success', message: `Template "${template?.name}" removido` })
  }

  const handleEditTemplate = (template: Template): void => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }

  const handleNewTemplate = (): void => {
    setEditingTemplate(undefined)
    setIsEditorOpen(true)
  }

  const handleUpdateInstall = async (): Promise<void> => {
    try {
      setUpdateState((prev) => ({ ...prev, isDownloading: true }))
      const result = await window.electronAPI.chromeDriver?.update?.()
      if (result?.updated) {
        pushLog({
          level: 'success',
          message: `ChromeDriver atualizado para v${result.currentVersion}`,
        })
        setUpdateState((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          isDownloading: false,
          currentVersion: result.currentVersion,
        }))
          ; (window as any).showSuccess?.('ChromeDriver atualizado com sucesso')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar ChromeDriver'
      pushLog({ level: 'error', message })
        ; (window as any).showError?.(message)
      setUpdateState((prev) => ({ ...prev, isDownloading: false }))
    }
  }

  const handleUpdateDismiss = (): void => {
    setUpdateState((prev) => ({
      ...prev,
      isUpdateAvailable: false,
    }))
  }

  const handleUpdateLater = (): void => {
    setUpdateState((prev) => ({
      ...prev,
      isUpdateAvailable: false,
    }))
    pushLog({ level: 'info', message: 'Atualização do ChromeDriver adiada' })
  }



  if (!state.isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin">
            <div className="w-16 h-16 border-4 border-primary-300 border-t-primary-600 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{state.statusMessage}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-sidebar">
        {/* Header */}

        <Header
          whatsappStatus={whatsappStatus}
          isDark={isDarkMode}
          onThemeToggle={() => {
            const nextIsDark = !isDarkMode
            applyTheme(nextIsDark ? 'dark' : 'light')
          }}
        />





        {/* Content */}
        <main className="flex-1 overflow-auto pt-header">
          {currentPage === 'mensageria' && (
            <div className="p-6">
              <div className="card-lg space-y-6">
                  {/* Envio de Mensagens */}
                  <div className="contacts-list__header">
                    <MessageComposer
                      message={state.message}
                      onChange={(message) => setState((prev) => ({ ...prev, message }))}
                      onSend={handleSendMessages}
                      onCancel={handleCancelSendMessages}
                      isSending={state.isSending}
                      contactCount={selectedContacts.length}
                      templates={templates}
                    />
                  </div>

                  {/* Contatos */}
                  <div className="contacts-list__header">
                    <ContactsList
                      contacts={state.contacts}
                      selectedContactIds={state.selectedContactIds}
                      onSelectedContactIdsChange={handleSelectedContactsChange}
                      selectionDisabled={state.isSending}
                      onImport={handleImportContacts}
                      onExport={handleExportContacts}
                    />
                  </div>
                </div>
            </div>
          )}

          {currentPage === 'dashboard' && (


            <div className="p-6 space-y-6">

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total de Contatos"
                  value={state.contacts.length}
                  color="primary"
                  trend={{ value: 12, direction: 'up' }}
                />
                <StatCard
                  title="Pendentes"
                  value={stats.pending}
                  color="warning"
                  trend={{ value: 5, direction: 'down' }}
                />
                <StatCard
                  title="Enviados"
                  value={stats.sent}
                  color="success"
                  trend={{ value: 8, direction: 'up' }}
                />
                <StatCard
                  title="Erros"
                  value={stats.failed}
                  color="danger"
                  trend={{ value: 2, direction: 'down' }}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RechartsLineChart
                  title="Resumo Mensal"
                  xAxisKey="dia"
                  data={[
                    { dia: '1', enviados: stats.sent, erros: stats.failed },
                    { dia: '2', enviados: stats.pending, erros: stats.failed },
                    { dia: '3', enviados: stats.sent, erros: stats.failed },
                    { dia: '4', enviados: stats.pending, erros: stats.failed },
                    { dia: '5', enviados: stats.sent, erros: stats.failed },
                  ]}
                  lines={[
                    { dataKey: 'enviados', stroke: '#10b981', name: 'Enviados' },
                    { dataKey: 'erros', stroke: '#ef4444', name: 'Erros' },
                  ]}
                />

                <RechartsPieChart
                  title="Taxa de Sucesso"
                  data={[
                    { name: 'Enviados', value: stats.sent },
                    { name: 'Pendentes', value: stats.pending },
                    { name: 'Erros', value: stats.failed },
                  ]}
                  colors={['#10b981', '#f59e0b', '#ef4444']}
                />
              </div>
              {/* Status Monitor */}
              <StatusMonitor logs={logs} onClear={() => setLogs([])} />
            </div>
          )}

          {currentPage === 'contacts' && (
            <div className="p-6">
              <ContactsManagementPage
                contacts={state.contacts}
                onImport={handleImportContacts}
                onExport={handleExportContacts}
                onContactsChange={handleContactsChange}
              />
            </div>
          )}

          {currentPage === 'templates' && (
            <div className="p-6">
              <TemplatesList
                templates={templates}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onNew={handleNewTemplate}
              />
              <Modal
                isOpen={isEditorOpen}
                onClose={() => {
                  setIsEditorOpen(false)
                  setEditingTemplate(undefined)
                }}
                size="xl"
              >
                <TemplateEditor
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onCancel={() => {
                    setIsEditorOpen(false)
                    setEditingTemplate(undefined)
                  }}
                />
              </Modal>
            </div>
          )}



          {currentPage === 'reports' && (
            <ReportsPage
              telemetrySummary={telemetrySummary}
              performanceSummary={performanceSummary}
              onRefresh={async () => {
                const [telemetry, performance] = await Promise.all([
                  window.electronAPI.telemetry.getSummary(),
                  window.electronAPI.app.getPerformanceSummary(),
                ])
                setTelemetrySummary(telemetry)
                setPerformanceSummary(performance)
                pushLog({ level: 'success', message: 'Relatórios atualizados' })
              }}
            />
          )}

          {currentPage === 'settings' && <SettingsPage />}



          {currentPage === 'license' && (
            <div className="p-6">
              <div className="card-lg max-w-3xl">
                <h2 className="text-2xl font-bold mb-4">Licença MIT</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Direitos autorais (c) {new Date().getFullYear()} ZapFacil Team.
                </p>

                <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  <p>
                    Permissão é concedida, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e dos arquivos de documentação associados (o “Software”), para lidar com o Software sem restrição, incluindo sem limitação os direitos de usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software, e permitir às pessoas a quem o Software é fornecido fazerem o mesmo, sob as seguintes condições:
                  </p>

                  <p>
                    O aviso de copyright acima e este aviso de permissão devem ser incluídos em todas as cópias ou partes substanciais do Software.
                  </p>

                  <p>
                    O SOFTWARE É FORNECIDO “NO ESTADO EM QUE SE ENCONTRA”, SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO, SEM LIMITAÇÃO, GARANTIAS DE COMERCIABILIDADE, ADEQUAÇÃO A UM FIM ESPECÍFICO E NÃO VIOLAÇÃO. EM NENHUM CASO OS AUTORES OU TITULARES DA LICENÇA SERÃO RESPONSÁVEIS POR QUALQUER RECLAMAÇÃO, DANOS OU OUTRAS RESPONSABILIDADES, SEJA EM AÇÃO CONTRATUAL, ATO ILÍCITO OU OUTRA FORMA, DECORRENTES DO SOFTWARE, DO SEU USO OU DE OUTRAS NEGOCIAÇÕES RELACIONADAS AO SOFTWARE.
                  </p>

                  <p className="pt-2 text-gray-600 dark:text-gray-400">
                    Para mais detalhes, consulte o arquivo LICENSE no repositório.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={() => {
          pushLog({ level: 'success', message: 'WhatsApp autenticado com sucesso' })
          setIsAuthDialogOpen(false)
        }}
      />

      {/* Update Notification */}
      <UpdateNotification
        isVisible={updateState.isUpdateAvailable}
        currentVersion={updateState.currentVersion}
        targetVersion={updateState.targetVersion}
        isDownloading={updateState.isDownloading}
        isInstalling={updateState.isInstalling}
        onInstall={handleUpdateInstall}
        onDismiss={handleUpdateDismiss}
        onLater={handleUpdateLater}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default App
