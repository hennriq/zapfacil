import { contextBridge, ipcRenderer } from 'electron'

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar eventos para main
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  // Receber eventos do main
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (event, data) => callback(data))
  },
  // Enviar e aguardar resposta
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data)
  },
})

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: any) => void
      on: (channel: string, callback: (data: any) => void) => void
      invoke: (channel: string, data?: any) => Promise<any>
    }
  }
}
