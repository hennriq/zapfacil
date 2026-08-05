# 🚀 Guia de Início Rápido - ZapFacil

## Setup em 5 Minutos

### 1. Clone & Install
```bash
git clone https://github.com/seu-repo/zapfacil.git
cd zapfacil

# Checkout feature/electron
git checkout feature/electron

# Install dependencies (importante: --legacy-peer-deps)
npm install --legacy-peer-deps
```

### 2. Upgrade Node.js (CRÍTICO)
```bash
# Verificar versão atual
node --version
# Se for 14.x, fazer upgrade:

# Opção 1: nvm (recomendado)
nvm install 18
nvm use 18

# Opção 2: Direto do nodejs.org
# https://nodejs.org/en/download
# Download Node 18 LTS e instalar

# Verificar upgrade
node --version  # deve ser 18.x
```

### 3. Run em Desenvolvimento
```bash
# Inicia Electron + Vite dev server
npm run dev

# Em outro terminal, opcionalmente:
npm run test
```

### 4. Fazer Build
```bash
# Compilar TypeScript + React
npm run build

# Criar instalador Windows
npm run package
# Gera: release/ZapFacil-2.0.0-setup.exe
```

---

## 📁 Estrutura de Pastas

```
zapfacil/
├── src/
│   ├── main/              ← Main process (Node.js)
│   │   ├── index.ts       ← Electron entry
│   │   └── services/      ← Business logic
│   ├── renderer/          ← React (Frontend)
│   │   ├── App.tsx        ← Main component
│   │   └── components/    ← UI components
│   └── shared/            ← Shared code
├── tests/                 ← Unit tests
├── docs/                  ← Documentação
└── package.json
```

---

## 🔧 Scripts Úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev server (hot reload) |
| `npm run build` | Build para produção |
| `npm run package` | Criar instalador |
| `npm test` | Rodar testes Jest |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint check |

---

## ✅ Checklists

### ✓ Primeira Execução
- [ ] Node 18+ instalado (`node -v`)
- [ ] `npm install --legacy-peer-deps` completado
- [ ] `npm run dev` funciona
- [ ] Electron window abre
- [ ] React components renderizam

### ✓ Antes de Commitar
- [ ] Sem `console.log` em produção
- [ ] TypeScript sem errors
- [ ] ESLint passing (`npm run lint`)
- [ ] Testes passam (`npm test`)

---

## 🐛 Troubleshooting

### "Cannot find module 'node:path'"
```bash
# Solução: Upgrade Node.js
nvm install 18
nvm use 18
npm install
```

### "electron module not found"
```bash
# Solução: Reinstalar deps
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
```

### App congelada ao enviar mensagens
```typescript
// Use ipcMain.handle (não-bloqueante)
ipcMain.handle('whatsapp:send', async (event, data) => {
  return await whatsAppService.sendMessage(data)
})
```

### Chromedriver não encontrado
```bash
# ChromeDriver será baixado automaticamente
# Se falhar, verificar: AppData\Local\ZapFacil\chromedriver\
```

---

## 📚 Documentação

- **README.md** - Visão geral e features
- **ARCHITECTURE.md** - Padrões SOLID
- **NEXT_STEPS.md** - Próximas fases
- **SUMMARY.md** - Sumário executivo
- **Código** - Bem comentado

---

## 💡 Tips

1. **Dev rápido**: Use `npm run dev` com hot reload
2. **Debug**: Abrir DevTools com F12
3. **Testes**: Escrever tests antes de features
4. **Commits**: Usar conventional commits (`feat:`, `fix:`, etc)
5. **Performance**: Manter operações longas no main process

---

## 🤝 Contribuindo

1. Create branch: `git checkout -b feature/my-feature`
2. Fazer changes + testes
3. Push: `git push origin feature/my-feature`
4. PR com descrição clara

---

## 📞 Suporte

Para dúvidas:
1. Ver `NEXT_STEPS.md` (troubleshooting section)
2. Verificar `ARCHITECTURE.md` (padrões implementados)
3. Ver exemplos em `tests/unit/` (como testar)

---

**Versão**: 2.0  
**Data**: 07/05/2026  
**Status**: Production-ready (após Node upgrade)
