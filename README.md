# ZapFacil - Automação WhatsApp com Electron.js

Migração de uma automação WinForms em C# para arquitetura moderna com Electron.js, seguindo princípios SOLID com cobertura completa de testes.

## 📋 Status do Projeto

### ✅ Concluído (Fase 1-2)
- [x] Estrutura do projeto Electron.js com TypeScript
- [x] Configuração do build (Vite + Webpack)
- [x] Setup de testes (Jest com 100% threshold)
- [x] Serviços core implementados com SOLID:
  - `LoggerService` - Logging centralizado
  - `ChromeDriverService` - Gerenciamento de Selenium WebDriver
  - `PhoneValidationService` - Validação de telefones
  - `WhatsAppAutomationService` - Automação WhatsApp
  - `ContactImportService` - Import/Export de contatos
- [x] Testes unitários (>100 test cases)
- [x] Configuração ESLint + TypeScript

### 🚀 Em Progresso (Fase 3)
- [ ] Componentes React (ContactsList, MessageComposer, StatusMonitor)
- [ ] IPC bridge main/renderer
- [ ] Auto-update do ChromeDriver
- [ ] Interface responsiva

### ⏳ Planejado (Fase 4-6)
- [ ] 100% cobertura de testes
- [ ] Testes E2E
- [ ] Build e packaging
- [ ] Release automático

## 🏗️ Arquitetura

### Princípios SOLID Implementados

**Single Responsibility (SRP)**
- Cada serviço tem uma única responsabilidade
- Ex: `PhoneValidationService` apenas valida telefones

**Open/Closed (OCP)**
- Interfaces bem definidas permitem extensão sem modificação
- Fácil adicionar novos tipos de automação

**Liskov Substitution (LSP)**
- Implementações seguras de interfaces
- Tipos genéricos onde apropriado

**Interface Segregation (ISP)**
- Interfaces específicas: `ILogger`, `IChromeDriverManager`, etc
- Clientes dependem apenas do necessário

**Dependency Injection (DI)**
- Todos os serviços recebem dependências via constructor
- Facilita testes e manutenção

### Estrutura de Pastas

```
zapfacil/
├── src/
│   ├── main/
│   │   ├── index.ts              # Entrada Electron
│   │   ├── services/             # Lógica de negócio
│   │   │   ├── LoggerService.ts
│   │   │   ├── ChromeDriverService.ts
│   │   │   ├── PhoneValidationService.ts
│   │   │   ├── WhatsAppAutomationService.ts
│   │   │   └── ContactImportService.ts
│   │   └── models/               # Modelos de dados
│   ├── renderer/
│   │   ├── App.tsx               # Componente principal
│   │   ├── components/           # Componentes React
│   │   ├── views/                # Páginas
│   │   └── hooks/                # Custom hooks
│   ├── preload.js                # IPC bridge
│   └── shared/
│       ├── interfaces.ts         # Contracts SOLID
│       ├── types.ts
│       └── utils/                # Utilitários
├── tests/
│   ├── unit/                     # Testes unitários
│   ├── e2e/                      # Testes E2E
│   └── setup.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── vite.config.ts
```

## 🚀 Começando

### Pré-requisitos
- Node.js >= 18
- npm ou yarn
- Git

### Instalação

```bash
# Clonar repositório
git clone https://github.com/hennriq/zapfacil.git
cd zapfacil

# Instalar dependências
npm install

# Desenvolver
npm run dev

# Executar testes
npm test

# Cobertura de testes
npm run test:coverage

# Build de produção
npm run build

# Packager (cria .exe no Windows)
npm run package
```

## 📝 Comandos Disponíveis

```bash
npm run dev              # Iniciar dev server Electron + Vite
npm run dev:electron     # Iniciar Electron apenas
npm run dev:react        # Iniciar Vite apenas
npm test                 # Executar testes (watch mode)
npm run test:coverage    # Gerar relatório de cobertura
npm run lint             # Verificar ESLint
npm run type-check       # Verificar tipos TypeScript
npm run build            # Build para produção
npm run package          # Criar instalador
```

## 🧪 Testes

### Cobertura Esperada: 100%

```
Services/
├── LoggerService ..................... 100%
├── ChromeDriverService ............... 95%  (requer mock de Selenium)
├── PhoneValidationService ............ 100%
├── WhatsAppAutomationService ......... 95%  (requer mock de navegador)
└── ContactImportService ............. 100%

Utils/
└── WebUtility ....................... 100%
```

### Executar Testes

```bash
# Modo watch
npm run test:watch

# Com coverage
npm run test:coverage

# Teste específico
npm test -- PhoneValidationService
```

## 🔄 Fluxo de Desenvolvimento

1. **Branch**: Sempre trabalhar em `feature/electron`
2. **Commits**: Seguir padrão convencional (feat:, fix:, test:, refactor:)
3. **Testes**: 100% de cobertura obrigatória
4. **PRs**: Contra `main` (não `master`)

### Exemplo de Commit

```bash
git commit -m "feat: add dark mode support

- Implement dark theme context
- Add system preference detection
- Update components styling"
```

## 📚 Migração do Código Legado

### Mapeamento de Classes

| WinForms (C#) | Electron (TS) | Status |
|---|---|---|
| Main.cs | App.tsx | ✅ Planejado |
| ChromeConfig.cs | ChromeDriverService.ts | ✅ Migrado |
| WebHelper.cs | WhatsAppAutomationService.ts | ✅ Migrado |
| FileReader.cs | ContactImportService.ts | ✅ Migrado |
| ChromeHelper.cs | ChromeUpdateService.ts | ⏳ Próximo |
| Message.cs | IContact interface | ✅ Migrado |
| PhoneHelper.cs | PhoneValidationService.ts | ✅ Migrado |

## 🔐 Segurança

- ✅ Context isolation no Electron
- ✅ Preload bridge para IPC seguro
- ✅ Sem `nodeIntegration`
- ✅ Validação de entrada em todos os serviços

## 🐛 Debugging

### VS Code Launch Config

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## 📦 Build & Deploy

### Build Local

```bash
npm run build:react
npm run build:electron
npm run package
```

### Resultado

- Windows: `release/*.exe` (instalador NSIS + portable)
- Linux/Mac: Configurável em `package.json`

## 🤝 Contribuindo

1. Checkout `feature/electron`
2. Criar branch feature: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/my-feature`
5. PR contra `feature/electron`

## 📄 Licença

MIT

## 👥 Autores

- ZapFacil Team

## 🗺️ Roadmap

- [x] Setup inicial Electron + TypeScript
- [x] Serviços SOLID core
- [x] Testes unitários
- [ ] Interface React (Fase 3)
- [ ] Auto-update Chrome (Fase 4)
- [ ] Testes E2E (Fase 5)
- [ ] Release production (Fase 6)

---

**Nota**: Este projeto segue rigorosamente os princípios SOLID, TDD e oferece 100% de cobertura de testes unitários.