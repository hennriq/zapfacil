# Release Guide - ZapFacil

Guia completo para fazer release do ZapFacil com automação total via GitHub Actions.

## 📦 Processo de Release

### Pré-requisitos

1. **GitHub Secrets Configurados**:
   - `GH_TOKEN`: GitHub personal access token com `repo` scope
   - `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID` (para macOS)
   - `SLACK_WEBHOOK` (opcional, para notificações)

2. **Repositório Setup**:
   ```bash
   git clone https://github.com/hennriq/zapfacil.git
   cd zapfacil
   npm install
   ```

3. **Verificações Locais**:
   ```bash
   npm run prerelease  # Roda lint, type-check, tests
   ```

### Processo Automático (Recomendado)

#### 1️⃣ Preparar Código

```bash
# Criar feature branch
git checkout -b feature/my-feature

# Fazer alterações, commits
git add .
git commit -m "feat: description"
git push origin feature/my-feature
```

#### 2️⃣ Pull Request & Code Review

- Criar PR contra `main` (ou `feature/electron`)
- GitHub Actions automaticamente roda CI:
  - ✅ Tests (100% coverage)
  - ✅ Linting
  - ✅ Type checking
  - ✅ E2E tests
  - ✅ Code coverage upload

#### 3️⃣ Merge PR

```bash
# Após aprovação, merge PR via GitHub UI ou:
git checkout main
git pull origin main
```

#### 4️⃣ Bump Version

```bash
# Update version em package.json (semver)
# Exemplos:
# - Patch: 2.0.0 -> 2.0.1 (bugfixes)
# - Minor: 2.0.0 -> 2.1.0 (features)
# - Major: 2.0.0 -> 3.0.0 (breaking changes)

npm version patch  # Auto incrementa version e cria commit
# ou
npm version minor
# ou
npm version major
```

#### 5️⃣ Criar Tag e Fazer Push

```bash
# Tag é criada automaticamente por npm version
# Fazer push:
git push origin main
git push origin --tags

# Ou manualmente:
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
```

#### 6️⃣ GitHub Actions Release Workflow

Quando tag `v*` é feita push, GitHub Actions automaticamente:

1. **Build em 3 plataformas**:
   - Windows (NSIS + portable)
   - macOS (DMG + ZIP)
   - Linux (AppImage + deb)

2. **Testes & Validações**:
   - ✅ Testes 100% coverage
   - ✅ Linting
   - ✅ Type checking
   - ✅ Build validation

3. **Artefatos**:
   - Cria instaladores para cada OS
   - Uploads artifacts como GitHub Release

4. **Publicação**:
   - Cria GitHub Release com todos os binários
   - Publica em electron-updater para auto-updates

5. **Notificações** (opcional):
   - Envia notificação ao Slack
   - Release notes automáticas

---

### ⏱️ Timeline Típica

| Etapa | Tempo |
|-------|-------|
| Feature development | ~1-2 dias |
| PR & Review | ~1 dia |
| CI/CD (tests) | ~3 minutos |
| Build Windows | ~3 minutos |
| Build macOS | ~5 minutos |
| Build Linux | ~3 minutos |
| Create Release | ~1 minuto |
| **Total** | **~15-20 minutos** |

---

## 🔧 Verificações de Qualidade

### Antes de Release

```bash
# 1. Testes com 100% coverage
npm run test:ci

# Deve ter output:
# ✓ Branches: 100%
# ✓ Functions: 100%
# ✓ Lines: 100%
# ✓ Statements: 100%

# 2. Linting
npm run lint
# Sem erros

# 3. Type checking
npm run type-check
# Sem erros

# 4. Build
npm run build
# Sem erros

# 5. E2E Tests
npm run test:e2e
# Todos passam
```

---

## 📋 Release Checklist

Antes de fazer push de tag:

- [ ] Todos os testes passam localmente
- [ ] Coverage é 100%
- [ ] Linting sem erros
- [ ] TypeScript sem erros
- [ ] Build bem-sucedido
- [ ] CHANGELOG atualizado com mudanças
- [ ] Version bump no package.json
- [ ] Commit feito: `git commit -m "Release vX.Y.Z"`
- [ ] Tag criada: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Tag feita push: `git push origin vX.Y.Z`

---

## 🎯 Monitoramento de Release

### GitHub Actions Dashboard
- URL: `https://github.com/hennriq/zapfacil/actions`
- Monitorar workflows: `release.yml` e `ci.yml`

### Release Page
- URL: `https://github.com/hennriq/zapfacil/releases`
- Todos os instaladores disponíveis aqui

### Code Coverage
- URL: `https://codecov.io/gh/hennriq/zapfacil`
- Tracking de cobertura ao longo do tempo

---

## ⚠️ Troubleshooting

### Build falha no Windows

```bash
# Verificar se NSIS está instalado
# Para CI, github actions já tem suporte

# Verificar logs:
npm run package:win -- --publish never
```

### Build falha no macOS

```bash
# Verificar certificados Apple
# GitHub Secrets deve ter:
# - APPLE_ID
# - APPLE_ID_PASSWORD
# - APPLE_TEAM_ID

# Testar localmente:
npm run package
```

### Tests falhando na CI

```bash
# Verificar logs no GitHub Actions
# Common issues:
# - Node version mismatch
# - Missing dependencies
# - Timeout em testes E2E

# Local:
npm run test:ci -- --detectOpenHandles
```

### Release não criado

```bash
# Verificar GitHub token
# GH_TOKEN deve ter permissões:
# - repo (full control)
# - read:user

# Verificar tag format:
# Deve ser: v2.1.0 (semver)
# GitHub Actions filtra: refs/tags/v*
```

---

## 🔐 Segredos GitHub

### Configurar GH_TOKEN

1. GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Scopes: `repo`, `read:user`, `user:email`
4. Add to repo secrets como `GH_TOKEN`

### Configurar Apple Signing (macOS)

1. Get Apple Team ID from developer.apple.com
2. Create app-specific password
3. Add to repo secrets:
   - `APPLE_ID`: your@email.com
   - `APPLE_ID_PASSWORD`: app-specific-password
   - `APPLE_TEAM_ID`: xxxxx

### Configurar Slack (Opcional)

1. Create Slack webhook: api.slack.com/apps
2. Add to repo secrets como `SLACK_WEBHOOK`

---

## 📊 Release Statistics

Monitorar métricas após cada release:

- **Download count**: GitHub releases page
- **Update adoption**: electron-updater analytics
- **Bug reports**: GitHub issues


---

## 🚀 Next Steps

Após release bem-sucedida:

1. ✅ Verificar que instaladores funcionam
2. ✅ Testar auto-update em clientes
3. ✅ Coletar feedback de usuários
4. ✅ Monitor crash reports
5. ✅ Plan próximo release se necessário

---

## 📞 Support

Para issues com release:

1. Verificar logs em GitHub Actions
2. Revisar GitHub secrets configuração
3. Testar localmente: `npm run package`
4. Abrir issue com detalhes de erro

---

**Last Updated**: 2026-05-08
**Versão Atual**: 2.0.0
**Status**: ✅ Production Ready
