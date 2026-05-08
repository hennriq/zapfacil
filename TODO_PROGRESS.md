# TODO_PROGRESS

- [x] Corrigir sintaxe em `src/main/index.ts` (handler `contacts:export-csv`)
- [x] Executar `npm test` e corrigir pendências de CI:
  - [x] Corrigir `ChromeUpdateService.test.ts` (mocks execFile + fallback stable)
  - [x] Investigar “Jest did not exit...”
- [x] Remover “Sobre” do menu/UX de Configurações
- [x] Pausar envio ao detectar QR Code (`data-testid="link-device-qr-code"`) e solicitar login
- [ ] Cancelar envio: interromper loading e parar tentativas Selenium (sem encerrar Chrome)
- [x] Garantir dark mode completo (badges/linhas/botões/scrollbars)
- [ ] Remover/ajustar `.md` não utilizados
