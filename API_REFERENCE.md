# 📖 API Reference - ZapFacil Services

## ILogger

Interface para logging centralizado.

```typescript
export interface ILogger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, data?: any): void
  debug(message: string, data?: any): void
}
```

### Uso

```typescript
const logger = new LoggerService('MyService')

logger.info('Application started')
logger.warn('Low memory', { available: 512 })
logger.error('Failed to connect', new Error())
logger.debug('Variable value', { count: 5 })
```

### Output
```json
{
  "timestamp": "2026-05-07T10:30:45.123Z",
  "level": "INFO",
  "context": "MyService",
  "message": "Application started"
}
```

---

## IChromeDriverManager

Interface para gerenciar Selenium WebDriver.

```typescript
export interface IChromeDriverManager {
  initialize(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  navigateTo(url: string): Promise<void>
  findElement(selector: string, timeout?: number): Promise<any>
  executeScript(script: string, args?: any[]): Promise<any>
  getCurrentUrl(): Promise<string>
  takeScreenshot(): Promise<Buffer>
}
```

### Uso

```typescript
const chromeDriver = ChromeDriverService.getInstance()

// Inicializar
await chromeDriver.initialize()

// Navegar
await chromeDriver.navigateTo('https://web.whatsapp.com')

// Encontrar elemento
const sendButton = await chromeDriver.findElement('//button[@aria-label="Send"]', 5000)

// Executar script
const url = await chromeDriver.executeScript('return window.location.href')

// Screenshot
const screenshot = await chromeDriver.takeScreenshot()

// Parar
await chromeDriver.stop()
```

---

## IPhoneValidator

Interface para validação de telefones brasileiros.

```typescript
export interface IPhoneValidator {
  validate(phone: string): boolean
  format(phone: string): string
  unformat(phone: string): string
  extractCountryCode(phone: string): string
}
```

### Uso

```typescript
const validator = new PhoneValidationService(logger)

// Validar
const isValid = validator.validate('11999999999') // true
validator.validate('123') // false

// Formatar
validator.format('(11) 99999-9999') // '5511999999999'

// Desformatar
validator.unformat('+55 (11) 99999-9999') // '11999999999'

// Extrair código
validator.extractCountryCode('5511999999999') // '55'
```

### Formatos Suportados
- `11999999999` (10 dígitos + DDD)
- `(11)99999999` (com parênteses)
- `+5511999999999` (com código país)
- `11 99999-9999` (com espaço e hífen)

---

## IWhatsAppAutomation

Interface para automação do WhatsApp Web.

```typescript
export interface IWhatsAppAutomation {
  openWhatsAppWeb(): Promise<void>
  waitForQRCodeScan(timeoutMs?: number): Promise<void>
  sendMessage(phone: string, message: string): Promise<void>
  sendMessageToContacts(
    contacts: IContact[],
    message: string
  ): Promise<ISendResult[]>
  validatePhoneNumber(phone: string): boolean
}
```

### Uso

```typescript
const whatsApp = new WhatsAppAutomationService(chromeDriver, logger)

// Abrir WhatsApp Web
await whatsApp.openWhatsAppWeb()

// Aguardar QR scan
await whatsApp.waitForQRCodeScan(30000)

// Enviar para um contato
await whatsApp.sendMessage('11999999999', 'Olá!')

// Enviar em massa
const results = await whatsApp.sendMessageToContacts([
  { id: '1', name: 'João', phone: '11999999999', status: 'pendente' },
  { id: '2', name: 'Maria', phone: '11988888888', status: 'pendente' }
], 'Mensagem para todos')

results.forEach(result => {
  console.log(`${result.contactId}: ${result.success ? 'OK' : 'ERRO'} - ${result.error}`)
})
```

---

## IContactImporter

Interface para import/export de contatos.

```typescript
export interface IContactImporter {
  importFromCSV(filePath: string): Promise<IContact[]>
  exportToCSV(contacts: IContact[], filePath: string): Promise<void>
  validateContacts(contacts: IContact[]): Promise<IValidationResult>
}
```

### Uso

```typescript
const importer = new ContactImportService(phoneValidator, logger)

// Importar CSV
const contacts = await importer.importFromCSV('./contatos.csv')

// Validar
const validation = await importer.validateContacts(contacts)
if (!validation.isValid) {
  console.log('Erros:', validation.errors)
  console.log('Avisos:', validation.warnings)
}

// Exportar
await importer.exportToCSV(contacts, './contatos-backup.csv')
```

### Formato CSV
```csv
name,phone,status
João Silva,11999999999,pendente
Maria Santos,11988888888,enviado
```

---

## IChromeUpdateManager

Interface para auto-update do ChromeDriver.

```typescript
export interface IChromeUpdateManager {
  getCurrentVersion(): Promise<string>
  checkForUpdates(): Promise<boolean>
  downloadLatestDriver(): Promise<void>
  compareVersions(v1: string, v2: string): number
}
```

### Uso

```typescript
const updater = new ChromeUpdateService(logger)

// Versão atual
const version = await updater.getCurrentVersion() // '125.0.6422.0'

// Verificar updates
const hasUpdate = await updater.checkForUpdates()

if (hasUpdate) {
  // Download
  await updater.downloadLatestDriver()
  console.log('ChromeDriver atualizado!')
}

// Comparar versões
updater.compareVersions('125.0.0', '124.0.0') // 1 (primeira é maior)
updater.compareVersions('125.0.0', '125.0.0') // 0 (iguais)
updater.compareVersions('125.0.0', '126.0.0') // -1 (segunda é maior)
```

---

## Data Models

### IContact
```typescript
export interface IContact {
  id: string
  name: string
  phone: string
  status: 'pendente' | 'enviado' | 'erro'
}
```

### ISendResult
```typescript
export interface ISendResult {
  contactId: string
  success: boolean
  error?: string
  timestamp: number
}
```

### IValidationResult
```typescript
export interface IValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
```

---

## BootstrapService (Orchestrator)

Facade que coordena inicialização de todos os serviços.

```typescript
export class BootstrapService {
  async initialize(): Promise<void>
  async shutdown(): Promise<void>
  
  getLogger(): ILogger
  getChromeDriver(): ChromeDriverService
  getWhatsAppAutomation(): WhatsAppAutomationService
  getContactImporter(): ContactImportService
  getChromeUpdater(): ChromeUpdateService
}
```

### Uso

```typescript
const bootstrap = BootstrapService.getInstance()

// Inicializar tudo
await bootstrap.initialize()

// Usar serviços
const logger = bootstrap.getLogger()
const whatsApp = bootstrap.getWhatsAppAutomation()

// Desligar
await bootstrap.shutdown()
```

### Fluxo de Inicialização
1. Verificar updates do Chrome
2. Inicializar ChromeDriver
3. Abrir WhatsApp Web
4. Aguardar QR code scan
5. Pronto para enviar mensagens

---

## IPC Events (Renderer ↔ Main)

### Enviar Evento
```typescript
// Renderer
window.electronAPI.send('app:ready', { version: '2.0.0' })

// Main
ipcMain.on('app:ready', (event, data) => {
  console.log('App pronto:', data.version)
})
```

### Chamar Handler Async
```typescript
// Renderer
const result = await window.electronAPI.invoke('whatsapp:send-messages', {
  contacts: [...],
  message: 'Hello'
})

// Main
ipcMain.handle('whatsapp:send-messages', async (event, { contacts, message }) => {
  return await whatsAppService.sendMessageToContacts(contacts, message)
})
```

### Escutar Evento do Main
```typescript
// Main
mainWindow.webContents.send('chrome:update-ready')

// Renderer
window.electronAPI.on('chrome:update-ready', (data) => {
  console.log('Update disponível!')
})
```

---

## Testing Examples

### Mock Service
```typescript
const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}
```

### Mock ChromeDriver
```typescript
const mockChromeDriver: jest.Mocked<IChromeDriverManager> = {
  initialize: jest.fn().mockResolvedValue(undefined),
  navigateTo: jest.fn().mockResolvedValue(undefined),
  findElement: jest.fn().mockResolvedValue({ click: jest.fn() }),
  executeScript: jest.fn().mockResolvedValue('result'),
  getCurrentUrl: jest.fn().mockResolvedValue('https://web.whatsapp.com'),
  takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('...'))
}
```

### Test Case
```typescript
describe('WhatsAppAutomationService', () => {
  it('should send message successfully', async () => {
    const service = new WhatsAppAutomationService(mockChromeDriver, mockLogger)
    
    await service.sendMessage('11999999999', 'Test')
    
    expect(mockChromeDriver.navigateTo).toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Sending message')
    )
  })
})
```

---

## Best Practices

### ✅ Use Interfaces
```typescript
// ✅ Bom
const service: IWhatsAppAutomation = new WhatsAppAutomationService(...)

// ❌ Ruim
const service = new WhatsAppAutomationService(...)
```

### ✅ Injetar Dependências
```typescript
// ✅ Bom
export class MyService {
  constructor(private logger: ILogger) {}
}

// ❌ Ruim
export class MyService {
  private logger = new LoggerService()
}
```

### ✅ Use Async/Await
```typescript
// ✅ Bom
const contacts = await importer.importFromCSV(path)

// ❌ Ruim
importer.importFromCSV(path).then(contacts => { })
```

### ✅ Tratar Erros
```typescript
// ✅ Bom
try {
  await whatsApp.sendMessage(phone, message)
} catch (error) {
  logger.error('Send failed', { phone, error })
}

// ❌ Ruim
await whatsApp.sendMessage(phone, message)
```

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **IPC** | Inter-Process Communication (Electron) |
| **WebDriver** | Selenium interface para Chrome |
| **SOLID** | Princípios de design de software |
| **DI** | Dependency Injection |
| **Facade** | Design pattern para simplicar interfaces |
| **Singleton** | Pattern de instância única |

---

**Última atualização**: 07/05/2026  
**Versão**: 2.0  
**Status**: Production-ready
