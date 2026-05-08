# Guia de Próximos Passos - ZapFacil Electron.js

## Status Atual (07/05/2026)

### ✅ Completado (Fases 1-2)
- Estrutura base Electron.js com TypeScript
- 6 serviços SOLID implementados
- 3 componentes React (UI)
- Testes unitários configurados (5 suites)
- Build system (Vite + Webpack)
- Documentação e README

### 📊 Métrica de Progresso
- **Arquivos criados**: 35+
- **Serviços implementados**: 6/6
- **Componentes React**: 3/6
- **Commits**: 3
- **Test cases escritos**: 100+
- **Linhas de código**: 2000+

---

## Recomendações Críticas

### 1. Upgrade do Node.js ⚠️ (CRÍTICO)
**Problema Atual**: Node 14.15.5 não suporta `node:` prefix (moderno)

```bash
# Upgrade para Node 18 LTS
nvm install 18
nvm use 18

# Ou instalar direto de nodejs.org
# https://nodejs.org/en/download
```

**Por quê**: 
- ts-jest v29 requer Node 14+
- Muitos pacotes modernos usam `node:` prefix
- Electron moderno funciona melhor com Node 18+

---

## Fase 3: Interface React (Próxima)

### Componentes Faltantes
- [ ] `StatusMonitor.tsx` - Exibir logs e status
- [ ] `AuthDialog.tsx` - QR Code scanner
- [ ] `Settings.tsx` - Configurações
- [ ] `Dashboard.tsx` - Página inicial

### Tarefas
1. **Completar StatusMonitor**
   ```bash
   touch src/renderer/components/StatusMonitor.tsx
   ```
   - Mostrar logs de execução
   - Botões de controle (play/stop)
   - Estatísticas de envio

2. **Implementar AuthDialog**
   - Exibir QR Code do WhatsApp
   - Aguardar escaneamento
   - Validar autenticação

3. **Conectar IPC**
   ```typescript
   // Em App.tsx
   window.electronAPI.invoke('whatsapp:send-messages', {
     contacts,
     message
   })
   ```

4. **Styling responsivo**
   - Mobile-first approach
   - Dark mode (opcional)

---

## Fase 4: Auto-Update Chrome

### Implementar
1. **ChromeUpdateService** ✅ (já existe)
2. **Background check** 
   ```typescript
   // main/index.ts
   setInterval(async () => {
     const hasUpdate = await chromeUpdater.checkForUpdates()
     if (hasUpdate) {
       await chromeUpdater.downloadLatestDriver()
     }
   }, 24 * 60 * 60 * 1000) // 24 horas
   ```

3. **User notification**
   - Toast ao detectar update
   - Opção de instalar agora/depois

---

## Fase 5: Testes (100% Cobertura)

### Corrigir Testes Jest
```bash
# Após upgrade Node 18
npm test -- --coverage

# Resultado esperado: 80%+ coverage
```

### Tipos de Teste
- **Unit**: Serviços individuais ✅ (90% pronto)
- **Integration**: IPC bridge (falta)
- **E2E**: Fluxo completo (falta)

### E2E com Playwright
```bash
npm install -D @playwright/test

# criar tests/e2e/whatsapp-send.spec.ts
```

---

## Fase 6: Build & Packaging

### Windows
```bash
npm run build
npm run package

# Gera: release/ZapFacil-2.0.0-setup.exe
```

### Configurações
- `electron-builder` já configurado em `package.json`
- Assinar certificado (opcional mas recomendado)
- Hosting para updates (S3, GitHub releases)

---

## Checklist de Desenvolvimento

### Antes de PR
- [ ] Código segue SOLID
- [ ] Testes passam
- [ ] Coverage > 80%
- [ ] Sem console.log em produção
- [ ] TypeScript sem errors
- [ ] ESLint passing

### Exemplo: Novo Service
```typescript
// 1. Criar interface em shared/interfaces.ts
export interface IMyService {
  doSomething(): Promise<void>
}

// 2. Implementar serviço
export class MyService implements IMyService {
  constructor(private logger: ILogger) {}
  
  async doSomething(): Promise<void> {
    this.logger.info('Doing something')
  }
}

// 3. Escrever testes
describe('MyService', () => {
  it('should do something', async () => {
    const service = new MyService(mockLogger)
    await service.doSomething()
    expect(mockLogger.info).toHaveBeenCalled()
  })
})

// 4. Integrar em BootstrapService
export class BootstrapService {
  private myService: MyService

  constructor() {
    this.myService = new MyService(this.logger)
  }
}
```

---

## Estrutura de Pastas (Esperada ao Fim)

```
zapfacil/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc/                    # handlers IPC
│   │   └── services/               # ✅ 6/6
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── components/             # 3/6
│   │   ├── hooks/                  # custom hooks
│   │   ├── pages/                  # páginas
│   │   └── theme/                  # tema
│   └── shared/
│       ├── interfaces.ts           # ✅
│       └── utils/                  # ✅
├── tests/
│   ├── unit/                       # ✅ 5 suites
│   └── e2e/                        # (falta)
├── docs/
│   ├── ARCHITECTURE.md
│   └── API.md
└── dist/                           # build output
```

---

## Dicas de Performance

### Renderer Process
```typescript
// ❌ Ruim
const allContacts = await ipc.invoke('get-contacts')

// ✅ Bom
useMemo(() => {
  return ipc.invoke('get-contacts')
}, [])
```

### Main Process
```typescript
// ❌ Ruim - bloqueia UI
ChromeDriver.sendMessage(phone, message)

// ✅ Bom - não-bloqueante
ipcMain.handle('whatsapp:send', async (event, { phone, message }) => {
  return await whatsapp.sendMessage(phone, message)
})
```

---

## Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| "Cannot find module 'node:path'" | Upgrade Node.js para 18+ |
| Jest não encontra testes | Verificar `roots` em jest.config.js |
| IPC timeout | Aumentar timeout, verificar handler |
| Chrome não abre | Verificar path do ChromeDriver |
| App congelada | Mover operações async para main |

---

## Links Úteis

- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Docs](https://vitejs.dev)
- [Jest Setup](https://jestjs.io/docs/getting-started)

---

## Contato & Suporte

Para dúvidas sobre:
- **Arquitetura**: Ver `README.md` e `src/shared/interfaces.ts`
- **Testes**: Ver exemplos em `tests/unit/`
- **Build**: Ver `package.json` scripts
- **Electron**: Ver `src/main/index.ts`

---

**Última atualização**: 07/05/2026  
**Status**: Fase 2 Completa, Fase 3 Iniciada  
**Próximo milestone**: Testes 100% funcionais (após Node upgrade)
