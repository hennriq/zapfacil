import React, { useState, useEffect } from 'react'
import './App.css'
import ContactsList from './components/ContactsList'
import MessageComposer from './components/MessageComposer'
import StatusMonitor from './components/StatusMonitor'

interface AppState {
  isReady: boolean
  contacts: Array<{ id: string; name: string; phone: string }>
  message: string
  isSending: boolean
}

function App(): JSX.Element {
  const [state, setState] = useState<AppState>({
    isReady: false,
    contacts: [],
    message: '',
    isSending: false,
  })

  useEffect(() => {
    // Notificar main que app está pronto
    if (window.electronAPI) {
      window.electronAPI.send('app:ready', {})
      window.electronAPI.on('app:ready-response', (data: any) => {
        if (data.success) {
          setState((prev) => ({ ...prev, isReady: true }))
        }
      })
    }
  }, [])

  const handleSendMessages = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isSending: true }))
    try {
      // Chamar serviço de envio via IPC
      const result = await window.electronAPI.invoke('whatsapp:send-messages', {
        contacts: state.contacts,
        message: state.message,
      })
      console.log('Messages sent:', result)
    } catch (error) {
      console.error('Failed to send messages:', error)
    } finally {
      setState((prev) => ({ ...prev, isSending: false }))
    }
  }

  const handleImportContacts = (contacts: AppState['contacts']): void => {
    setState((prev) => ({ ...prev, contacts }))
  }

  const handleMessageChange = (message: string): void => {
    setState((prev) => ({ ...prev, message }))
  }

  if (!state.isReady) {
    return <div className="loading">Carregando ZapFacil...</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ZapFacil - Automação WhatsApp</h1>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="left-panel">
            <ContactsList 
              contacts={state.contacts}
              onImport={handleImportContacts}
            />
          </div>

          <div className="right-panel">
            <MessageComposer 
              message={state.message}
              onChange={handleMessageChange}
              onSend={handleSendMessages}
              isSending={state.isSending}
              contactCount={state.contacts.length}
            />
            <StatusMonitor />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
