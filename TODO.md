# TODO (Theme dark consistency)

# Roadmap (Mensageria e UX)
- [x] Permitir, na tela de mensageria, selecionar os contatos que receberao a mensagem
- [x] Permitir, na tela de mensageria, cancelar o envio de mensagem
- [x] Sugerir templates quando o usuario digitar `@`
- [x] Ao clicar em um template sugerido, inserir a mensagem substituindo o template selecionado
- [x] Remover da tela de configuracoes o menu "Sobre", pois nao agrega ao usuario final
- [ ] Em caso de erro ao encontrar elemento na tela, verificar se esta sendo exibido QR Code de login na sessao do WhatsApp (`data-testid="link-device-qr-code"`); se estiver, pausar o envio de mensagens e solicitar ao usuario que faca login no Chrome
- [ ] Ao clicar em cancelar envio, o selenium continua tentando enviar mensagem a tela ainda exibe o loading. O comportamento esperado é que o loading seja interrompido e o selenium pare de tentar encontrar elementos no chrome automatizado (o chrome não deve ser encerrado).
- [x] o botão de alterar do menu backup deve abrir uma janela para seleção do local no computador para salvar o backup
- [x] alterar status "conectado" no header da janela da aplicação apenas se for detectado que o whatsapp está aberto e logado. Caso o qr code esteja sendo exibido (`data-testid="link-device-qr-code"` no html da página), exibir desconectado.

- [x] Identificar componentes/estilos que ainda usam cores fixas (sem dark mode)
- [x] Atualizar CSS de `ContactsList` (arquivo .css) para respeitar `dark` via seletores `.dark ...`
- [x] Atualizar CSS de `MessageComposer` (arquivo .css) para respeitar `dark` via seletores `.dark ...`
- [x] Atualizar CSS de `StatusMonitor` (arquivo .css) para respeitar `dark` via seletores `.dark ...`
- [x] Garantir que elementos internos (badges, linhas, botões, scrollbars) também mudem no dark
- [ ] Remover/ajustar arquivos `.md` implementados/não utilizados conforme requerido
- [ ] Rodar `npm test` (e/ou testes unitários) e conferir cobertura

# TODO (Testes unitários / fix CI)
- [x] Corrigir TelemetryService.test.ts (injeção de dependência SettingsService)
- [x] Corrigir ChromeUpdateService.test.ts (mocks do execFile e fallback stable)
- [x] Verificar se Jest encerra corretamente (evitar “Jest did not exit...”) 

