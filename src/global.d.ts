import { ElectronAPI } from './preload'

declare module '*.css'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
