# Arquitetura ZapFacil - Princípios SOLID

## Overview

ZapFacil é uma aplicação Electron.js que automatiza o envio de mensagens via WhatsApp Web. A arquitetura segue rigorosamente os princípios SOLID para garantir manutenibilidade, extensibilidade e testabilidade.

---

## 1️⃣ Single Responsibility Principle (SRP)

Cada classe tem UMA responsabilidade.

### Exemplo
```typescript
// ❌ Ruim - múltiplas responsabilidades
class WhatsAppBot {
  validatePhone() { }
  sendMessage() { }
  importCSV() { }
  updateChrome() { }
}

// ✅ Bom - separação de responsabilidades
class PhoneValidationService { validatePhone() }
class WhatsAppAutomationService { sendMessage() }
class ContactImportService { importCSV() }
class ChromeUpdateService { updateChrome() }
```

### Serviços Implementados (SRP)
| Serviço | Responsabilidade | Arquivo |
|---------|------------------|---------|
| LoggerService | Logging centralizado | `services/LoggerService.ts` |
| ChromeDriverService | Gerenciar WebDriver | `services/ChromeDriverService.ts` |
| PhoneValidationService | Validar telefones | `services/PhoneValidationService.ts` |
| WhatsAppAutomationService | Automação WhatsApp | `services/WhatsAppAutomationService.ts` |
| ContactImportService | Import/Export CSV | `services/ContactImportService.ts` |
| ChromeUpdateService | Auto-update Chrome | `services/ChromeUpdateService.ts` |

---

## 2️⃣ Open/Closed Principle (OCP)

Aberto para extensão, fechado para modificação.

### Exemplo
```typescript
// ✅ Bom - Interface bem definida
export interface IChromeDriverManager {
  initialize(): Promise<void>
  navigateTo(url: string): Promise<void>
  findElement(selector: string): Promise<any>
}

// Fácil adicionar nova implementação
export class RemoteChromeDriverManager implements IChromeDriverManager {
  // implementação diferente, mesma interface
}
```

### Aplicação
```typescript
// Main process pode aceitar qualquer implementação
class WhatsAppAutomationService {
  constructor(
    private chromeDriver: IChromeDriverManager, // Interface, não classe
    private logger: ILogger
  ) {}
}

// No teste, podemos injetar mock
const mockChromeDriver: jest.Mocked<IChromeDriverManager> = {
  initialize: jest.fn(),
  navigateTo: jest.fn(),
  findElement: jest.fn(),
}
```

---

## 3️⃣ Liskov Substitution Principle (LSP)

Subtipos devem ser substituíveis pelo tipo pai.

### Exemplo
```typescript
// ✅ Bom - LoggerService é um ILogger válido
export class LoggerService implements ILogger {
  info(message: string): void { /* implementação */ }
  error(message: string): void { /* implementação */ }
}

// Pode ser usado em qualquer lugar que espera ILogger
function initializeApp(logger: ILogger) {
  logger.info('Starting app') // Funciona com qualquer ILogger
}

initializeApp(new LoggerService('App'))
```

---

## 4️⃣ Interface Segregation Principle (ISP)

Clientes não devem depender de interfaces que não usam.

### Exemplo
```typescript
// ❌ Ruim - Interface grande
interface IGenericService {
  log(): void
  sendMessage(): void
  validatePhone(): void
  importCSV(): void
  updateChrome(): void
}

// ✅ Bom - Interfaces pequenas e específicas
interface ILogger {
  info(msg: string): void
  error(msg: string): void
}

interface IPhoneValidator {
  validate(phone: string): boolean
}

interface IWhatsAppAutomation {
  sendMessage(phone: string, msg: string): Promise<void>
}

// Cada classe implementa apenas o necessário
class PhoneValidationService implements IPhoneValidator { }
```

---

## 5️⃣ Dependency Injection (DI)

Dependências são injetadas, não criadas internamente.

### Exemplo
```typescript
// ❌ Ruim - Tight coupling
export class WhatsAppAutomationService {
  private chromeDriver = new ChromeDriverService() // Hard-coded
  
  async sendMessage(phone: string) {
    this.chromeDriver.navigateTo(url)
  }
}

// ✅ Bom - Dependency Injection
export class WhatsAppAutomationService {
  constructor(
    private chromeDriver: IChromeDriverManager, // Injetado
    private logger: ILogger // Injetado
  ) {}
  
  async sendMessage(phone: string) {
    this.chromeDriver.navigateTo(url)
  }
}

// Uso
const logger = new LoggerService('App')
const chromeDriver = new ChromeDriverService(logger)
const whatsapp = new WhatsAppAutomationService(chromeDriver, logger)
```

### BootstrapService (Orchestrator)
```typescript
// Coordena injeção de dependências
export class BootstrapService {
  private logger = new LoggerService('App')
  private chromeDriver = ChromeDriverService.getInstance(this.logger)
  private whatsapp = new WhatsAppAutomationService(
    this.chromeDriver,
    this.logger
  )
  
  async initialize() {
    await this.chromeDriver.initialize()
    await this.whatsapp.openWhatsAppWeb()
  }
}
```

---

## Padrões de Design Implementados

### 1. Singleton
```typescript
// ChromeDriverService - apenas uma instância em toda app
export class ChromeDriverService {
  private static instance: ChromeDriverService

  static getInstance(logger?: ILogger): ChromeDriverService {
    if (!ChromeDriverService.instance) {
      ChromeDriverService.instance = new ChromeDriverService(logger)
    }
    return ChromeDriverService.instance
  }
}
```

### 2. Facade
```typescript
// BootstrapService simplifica uso de múltiplos serviços
export class BootstrapService {
  async initialize() {
    // Coordena: Logger → ChromeDriver → WhatsApp → ContactImporter
  }
}
```

### 3. Observer (IPC)
```typescript
// Renderer observa eventos do Main
window.electronAPI.on('app:ready-response', (data) => {
  setState({ isReady: true })
})
```

### 4. Strategy (Validadores)
```typescript
// Diferentes estratégias de validação
interface IValidator {
  validate(value: any): boolean
}

class PhoneValidator implements IValidator { }
class EmailValidator implements IValidator { }
```

---

## Fluxo de Dados

```
┌─────────────────┐
│  Renderer (React)
│  - ContactsList
│  - MessageComposer
│  - StatusMonitor
└────────┬────────┘
         │ IPC (Secure)
         ▼
┌─────────────────────────────┐
│  Main Process (Electron)    │
│  - ipcMain handlers         │
│  - BootstrapService         │
└────────┬────────────────────┘
         │
    ┌────┴────────────────────┬──────────────┬──────────────┐
    ▼                        ▼              ▼              ▼
┌─────────────┐    ┌──────────────────┐ ┌─────────────┐ ┌─────────────┐
│  Chrome     │    │  WhatsApp        │ │  Contact    │ │  File       │
│  Driver     │    │  Automation      │ │  Import     │ │  System     │
│  Service    │    │  Service         │ │  Service    │ │  (csv, etc) │
└─────────────┘    └──────────────────┘ └─────────────┘ └─────────────┘
    ▼                        ▼              ▼              ▼
┌────────────────────────────────────────────────────────────────────┐
│  Shared Services (Cross-cutting)                                   │
│  - LoggerService (logging)                                         │
│  - PhoneValidationService (validation)                             │
│  - WebUtility (URL encoding, etc)                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas (SOLID-aligned)

```
src/
├── main/                       # Main Process (Electron)
│   ├── index.ts               # Entry point, IPC setup
│   ├── ipc/                   # IPC handlers
│   │   ├── handlers.ts
│   │   └── types.ts
│   ├── services/              # Business Logic (SOLID)
│   │   ├── LoggerService.ts
│   │   ├── ChromeDriverService.ts
│   │   ├── PhoneValidationService.ts
│   │   ├── WhatsAppAutomationService.ts
│   │   ├── ContactImportService.ts
│   │   ├── ChromeUpdateService.ts
│   │   ├── BootstrapService.ts
│   │   └── index.ts           # Barrel export
│   ├── models/                # Data models
│   │   └── Message.ts
│   └── utils/                 # Utilities
│
├── renderer/                  # React Frontend
│   ├── App.tsx               # Root component
│   ├── components/           # UI Components
│   │   ├── ContactsList.tsx
│   │   ├── MessageComposer.tsx
│   │   └── StatusMonitor.tsx
│   ├── hooks/                # Custom hooks
│   │   └── useWhatsApp.ts
│   ├── pages/                # Page components
│   ├── theme/                # Styling
│   └── index.tsx             # React entry
│
└── shared/                   # Shared Code
    ├── interfaces.ts         # All interfaces (SOLID contracts)
    ├── types.ts              # Shared types
    └── utils/                # Shared utilities
        └── WebUtility.ts
```

---

## Testabilidade (Facilitada por SOLID)

```typescript
// Fácil de testar porque usa DI e interfaces
describe('WhatsAppAutomationService', () => {
  let service: WhatsAppAutomationService
  let mockChromeDriver: jest.Mocked<IChromeDriverManager>
  let mockLogger: jest.Mocked<ILogger>

  beforeEach(() => {
    mockChromeDriver = {
      initialize: jest.fn(),
      navigateTo: jest.fn(),
      findElement: jest.fn(),
    }
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    }
    service = new WhatsAppAutomationService(mockChromeDriver, mockLogger)
  })

  it('should send message', async () => {
    mockChromeDriver.findElement.mockResolvedValue({ click: jest.fn() })
    
    await service.sendMessage('11999999999', 'Hello')
    
    expect(mockChromeDriver.navigateTo).toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalled()
  })
})
```

---

## Extensão Futura (Habilitada por OCP)

```typescript
// Adicionar novo serviço sem modificar código existente

// 1. Criar interface
export interface IAnalyticsService {
  trackEvent(name: string, data?: any): void
}

// 2. Implementar serviço
export class AnalyticsService implements IAnalyticsService {
  trackEvent(name: string) {
    console.log(`Event: ${name}`)
  }
}

// 3. Injetar em BootstrapService
export class BootstrapService {
  private analytics = new AnalyticsService()
  // resto do código não muda!
}
```

---

## Métricas de Qualidade

- ✅ **Coesão**: Alta (cada classe faz UMA coisa bem)
- ✅ **Acoplamento**: Baixo (via interfaces)
- ✅ **Testabilidade**: Alta (DI + Mocks)
- ✅ **Reusabilidade**: Alta (interfaces bem definidas)
- ✅ **Manutenibilidade**: Alta (código limpo e organizado)

---

## Checklist de Review (SOLID)

- [ ] Cada classe tem uma responsabilidade? (SRP)
- [ ] Novas features podem ser adicionadas sem modificar código? (OCP)
- [ ] Subclasses são substituíveis? (LSP)
- [ ] Interfaces são específicas? (ISP)
- [ ] Dependências são injetadas? (DI)
- [ ] Testes podem mockar facilmente? (Testabilidade)
- [ ] Sem tight coupling? (Baixo acoplamento)

---

## Referências

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Typescript SOLID](https://www.typescriptlang.org/)
- [Dependency Injection in TypeScript](https://www.tutorialspoint.com/)
- [Clean Code - Robert C. Martin](https://www.oreilly.com/)

---

**Última atualização**: 07/05/2026  
**Versão da Arquitetura**: 2.0  
**Status**: Produção-ready para Fase 3
