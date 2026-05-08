# GitHub Actions Setup

Guia para configurar GitHub Actions CI/CD para ZapFacil.

## 🔧 Configuração Necessária

### 1. Repository Secrets

Adicionar os seguintes secrets em `Settings > Secrets and variables > Actions`:

#### Obrigatórios

| Secret | Descrição | Como Obter |
|--------|-----------|-----------|
| `GH_TOKEN` | GitHub Personal Access Token | [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens?type=beta) |

**Escopos recomendados para GH_TOKEN:**
- `repo` (full control of private repositories)
- `read:user`
- `user:email`

#### Opcionais (macOS Signing)

| Secret | Descrição | Como Obter |
|--------|-----------|-----------|
| `APPLE_ID` | Apple ID Email | Sua conta Apple |
| `APPLE_ID_PASSWORD` | App-specific Password | [appleid.apple.com/account/manage](https://appleid.apple.com/account/manage) |
| `APPLE_TEAM_ID` | Apple Developer Team ID | [developer.apple.com](https://developer.apple.com/account) |

#### Opcionais (Notificações)

| Secret | Descrição | Como Obter |
|--------|-----------|-----------|
| `SLACK_WEBHOOK` | Slack Webhook URL | [api.slack.com/apps](https://api.slack.com/apps) |

### 2. Branch Protection Rules

Configurar em `Settings > Branches > Branch protection rules`:

Para branches `main` e `feature/electron`:

```
✓ Require status checks to pass before merging
  - GitHub Actions / test
  - GitHub Actions / e2e
  - Require branches to be up to date before merging

✓ Require code reviews before merging
  - Dismiss stale pull request approvals

✓ Require status checks to pass before merging
  - Include administrators
```

### 3. Repository Settings

Configurar em `Settings > Actions`:

```
✓ Allow GitHub Actions to create and approve pull requests
✓ Allow GitHub Actions to auto-fix and to push to any branch
```

## 📁 Workflows Inclusos

### `ci.yml` - Integração Contínua

**Trigger:** `push` ou `pull_request`

**Roda:**
- Linux + Node 18.x, 20.x
- Windows + Node 18.x, 20.x
- macOS + Node 18.x, 20.x

**Validações:**
- Type checking
- Linting
- Testes unitários (100% coverage)
- Testes E2E
- Upload coverage para Codecov

**Tempo:** ~5 minutos

### `release.yml` - Build & Release

**Trigger:** Tag `v*` ou manual

**Roda em:**
- Windows
- macOS
- Linux

**Etapas:**
1. Checkout código
2. Instalar dependências
3. Validações (tests, lint, types)
4. Build
5. Package para cada OS
6. Upload artifacts
7. Criar GitHub Release
8. Notificar Slack (se configurado)

**Tempo:** ~20 minutos

### `codeql.yml` - Análise de Segurança

**Trigger:** `push`, `pull_request`, ou diariamente

**Análise:**
- CodeQL JavaScript queries
- Security and quality checks

**Relatórios:** No GitHub Security tab

## 🚀 Usando os Workflows

### Trigger CI (Automático)

```bash
# Qualquer push dispara CI
git push origin feature/my-feature

# Qualquer PR dispara CI
# (criar PR no GitHub)
```

### Trigger Release (Manual)

```bash
# Criar tag dispara release
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0

# Ou manualmente no GitHub:
# Actions > Release > Run workflow > Execute
```

## 📊 Monitorar Workflows

### Dashboard

**URL:** `https://github.com/hennriq/zapfacil/actions`

Visualizar:
- Status de todos os workflows
- Logs de execução
- Artifacts gerados

### Notificações

GitHub envia notificações quando:
- ✅ Workflow completa com sucesso
- ❌ Workflow falha
- ⚠️ Review necessário

## 🔍 Debugging

### Visualizar Logs

1. Ir para `Actions` tab
2. Clicar no workflow que falhou
3. Expandir steps para ver detalhes
4. Procurar por erros

### Common Issues

#### Tests falhando

```yaml
# Verificar:
- Node version correto
- npm install foi executado
- Testes rodam localmente
```

#### Build falhando

```yaml
# Verificar:
- TypeScript compila localmente
- Vite build funciona
- Sem erros no npm run build
```

#### Release não criando

```yaml
# Verificar:
- GH_TOKEN configurado com escopos corretos
- Tag tem formato correto: v*
- Workflow tem acesso ao token
```

## 📝 Customizar Workflows

Para adicionar ou modificar workflows:

1. Editar arquivo em `.github/workflows/`
2. Seguir sintaxe YAML GitHub Actions
3. Commit e push
4. GitHub automaticamente detecta novos workflows

**Referência:** [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🔐 Best Practices

### Segredos

✅ **Fazer:**
- Usar GitHub Secrets para dados sensíveis
- Rotacionar tokens regularmente
- Usar token com escopos mínimos necessários

❌ **Não fazer:**
- Commitar secrets em código
- Usar secrets no output de logs
- Compartilhar secrets com outros

### Workflows

✅ **Fazer:**
- Versionar workflows com código
- Testar workflows em branches de feature
- Usar actions verificadas e mantidas

❌ **Não fazer:**
- Usar ações de fontes não confiáveis
- Executar steps desnecessários
- Deixar workflows ligados tempo demais

## 📚 Recursos Adicionais

- [GitHub Actions Official Docs](https://docs.github.com/en/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Scheduled Triggers](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events)

## ✅ Checklist de Setup

- [ ] GH_TOKEN criado e adicionado a secrets
- [ ] Branch protection rules configuradas
- [ ] Repository settings atualizadas
- [ ] Workflows validados em primeiro push
- [ ] Codecov integrado (se usar coverage)
- [ ] Slack webhook configurado (opcional)
- [ ] CI passa em feature branches
- [ ] Release workflow testado com tag

## 🎯 Próximos Passos

1. Testar CI em um feature branch
2. Fazer PR para validar workflows
3. Após merge, fazer test release com tag `v0.0.1-test`
4. Verificar que release workflow completa
5. Deletar tag de teste
6. Está pronto para production releases!

---

**Última Atualização:** 2026-05-08
**Status:** ✅ Configurado e Pronto
