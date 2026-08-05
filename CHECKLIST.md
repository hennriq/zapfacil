# ✅ ZapFacil Development Checklist

## 📋 Pre-Development Checklist

Before starting to work on the project, complete this checklist:

- [ ] Node.js 18+ LTS installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] Git configured (`git config --list`)
- [ ] Repository cloned and feature/electron branch checked out
- [ ] `npm install --legacy-peer-deps` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Electron window opens correctly
- [ ] Read QUICKSTART.md (5 minutes)

---

## 🧪 Before Committing Code

Every commit must pass these checks:

### Code Quality
- [ ] No `console.log` statements in production code
- [ ] No `debugger` statements
- [ ] No commented-out code blocks
- [ ] All imports are used
- [ ] No unused variables

### TypeScript
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] All types are explicit (no `any` type)
- [ ] Interfaces used for all public APIs
- [ ] Enums for constants where appropriate

### Testing
- [ ] New code has test coverage (≥80%)
- [ ] All tests pass: `npm test`
- [ ] Coverage report is acceptable: `npm run test:coverage`

### Linting
- [ ] ESLint passes: `npm run lint`
- [ ] Code follows established patterns
- [ ] Comments are clear and helpful

### Git
- [ ] Branch is up to date with main
- [ ] Commit message is semantic: `feat:`, `fix:`, `docs:`, `test:`, etc.
- [ ] Changes are logically grouped

### Checklist
```bash
npm run build          # TypeScript ✓
npm test               # Tests ✓
npm run test:coverage  # Coverage ✓
npm run lint           # ESLint ✓
git status             # Clean ✓
```

---

## 🏗️ Adding a New Service

Follow this checklist when implementing a new service:

### 1. Design Phase
- [ ] Define responsibility (Single Responsibility Principle)
- [ ] Identify dependencies
- [ ] Create interface in `src/shared/interfaces.ts`
- [ ] Document with JSDoc comments

### 2. Implementation Phase
- [ ] Create service class in `src/main/services/`
- [ ] Implement interface
- [ ] Use Dependency Injection (constructor parameters)
- [ ] Add error handling with try/catch
- [ ] Use logger for important events

Example:
```typescript
export interface IMyService {
  doSomething(): Promise<void>
}

export class MyService implements IMyService {
  constructor(private logger: ILogger) {}

  async doSomething(): Promise<void> {
    try {
      this.logger.info('Starting operation')
      // implementation
      this.logger.info('Operation completed')
    } catch (error) {
      this.logger.error('Operation failed', error)
      throw error
    }
  }
}
```

### 3. Integration Phase
- [ ] Add getter to `BootstrapService`
- [ ] Add to `src/main/services/index.ts` exports
- [ ] Inject into other services if needed

### 4. Testing Phase
- [ ] Create `src/main/services/MyService.test.ts`
- [ ] Mock all dependencies
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Aim for >80% coverage

Example:
```typescript
describe('MyService', () => {
  let service: MyService
  let mockLogger: jest.Mocked<ILogger>

  beforeEach(() => {
    mockLogger = { info: jest.fn(), error: jest.fn(), /* ... */ }
    service = new MyService(mockLogger)
  })

  it('should complete successfully', async () => {
    await service.doSomething()
    expect(mockLogger.info).toHaveBeenCalledWith('Operation completed')
  })

  it('should handle errors', async () => {
    jest.spyOn(service, 'doSomething').mockRejectedValue(new Error('Failed'))
    await expect(service.doSomething()).rejects.toThrow()
  })
})
```

### 5. Documentation Phase
- [ ] Add example to API_REFERENCE.md
- [ ] Add usage to README.md if public-facing
- [ ] Update ARCHITECTURE.md if relevant
- [ ] Add inline code comments

---

## 🎨 Adding a React Component

Follow this checklist for new React components:

### 1. Component Planning
- [ ] Define props interface
- [ ] Identify state needs
- [ ] Plan IPC communication
- [ ] Sketch UI layout

### 2. Component Creation
- [ ] Create file: `src/renderer/components/MyComponent.tsx`
- [ ] Define props interface
- [ ] Use TypeScript strict mode
- [ ] Handle loading/error states
- [ ] Make responsive (mobile-first)

Example:
```typescript
interface MyComponentProps {
  title: string
  onAction: (data: any) => void
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <div className="my-component">
      <h2>{title}</h2>
      {/* content */}
    </div>
  )
}
```

### 3. Styling
- [ ] Add styles to `src/renderer/styles/components.css`
- [ ] Use CSS variables for theme
- [ ] Test on mobile viewport
- [ ] Add focus states for accessibility

### 4. Integration
- [ ] Import in App.tsx or parent component
- [ ] Pass required props
- [ ] Wire up IPC if needed
- [ ] Handle errors gracefully

### 5. Testing
- [ ] Create component tests if complex
- [ ] Test props variations
- [ ] Test user interactions
- [ ] Snapshot tests if UI is stable

---

## 🐛 Bug Fix Checklist

When fixing a bug:

- [ ] Reproduce the bug consistently
- [ ] Write a failing test that demonstrates the bug
- [ ] Fix the code to make the test pass
- [ ] Run all tests to ensure no regressions
- [ ] Update documentation if behavior changed
- [ ] Use commit message: `fix: description`

Example:
```bash
npm test -- MyComponent.test.ts # See test fail
# ... fix code ...
npm test -- MyComponent.test.ts # Test passes
npm test                        # All tests pass
git commit -m "fix: correct component rendering"
```

---

## 🚀 Release Checklist

Before release to production:

### Code Review
- [ ] All PR reviews passed
- [ ] No open TODOs in code
- [ ] No debug-only features
- [ ] Performance acceptable

### Testing
- [ ] Unit test coverage ≥80%
- [ ] Manual testing completed
- [ ] Cross-browser testing (Windows)
- [ ] Performance testing done

### Documentation
- [ ] README updated if features changed
- [ ] CHANGELOG created/updated
- [ ] API docs updated if needed
- [ ] Deployment guide reviewed

### Build
- [ ] `npm run build` succeeds
- [ ] `npm run package` creates executable
- [ ] Executable tested on clean Windows machine
- [ ] File signing verified

### Deployment
- [ ] Release notes written
- [ ] Version bumped (MAJOR.MINOR.PATCH)
- [ ] Git tag created: `v2.0.0`
- [ ] Artifacts uploaded to release server

---

## 📚 Documentation Checklist

For every significant change:

- [ ] Code comments explain WHY, not WHAT
- [ ] Public APIs have JSDoc comments
- [ ] Complex logic has explanation
- [ ] Examples added to README if new feature
- [ ] API_REFERENCE.md updated if new service
- [ ] ARCHITECTURE.md updated if patterns change

---

## 🔍 Code Review Checklist

When reviewing someone's code:

### Functionality
- [ ] Code does what it claims
- [ ] Handles edge cases
- [ ] Error handling is proper
- [ ] No performance issues

### Quality
- [ ] Follows SOLID principles
- [ ] No code duplication
- [ ] Tests are included
- [ ] Comments are clear

### Security
- [ ] No hardcoded credentials
- [ ] Input is validated
- [ ] No SQL injection risk
- [ ] IPC messages are safe

### Style
- [ ] Matches project conventions
- [ ] ESLint would pass
- [ ] Consistent with codebase
- [ ] Readable variable names

---

## 🧹 Weekly Maintenance

Regular tasks to keep project healthy:

- [ ] Update npm packages: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review open issues/PRs
- [ ] Run full test suite
- [ ] Check test coverage trends
- [ ] Review performance metrics
- [ ] Update documentation if needed

---

## 🚨 Emergency Procedures

### If main branch is broken
1. Create hotfix branch: `git checkout -b hotfix/fix-name`
2. Fix the issue
3. Test thoroughly
4. Create PR with label "hotfix"
5. Fast-track review and merge

### If npm dependencies conflict
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### If tests are timing out
1. Check for infinite loops
2. Increase Jest timeout: `jest.setTimeout(10000)`
3. Check for unresolved promises
4. Review mock implementations

### If build fails
```bash
npm run clean          # Delete dist/ build/
npm run build          # Rebuild
npm run package        # Re-package
```

---

## 📱 Mobile/Responsive Checklist

For UI changes:

- [ ] Tested on mobile viewport (375px)
- [ ] Tested on tablet viewport (768px)
- [ ] Tested on desktop viewport (1920px)
- [ ] Touch targets are ≥44px
- [ ] No horizontal scroll
- [ ] Fonts readable on small screens
- [ ] Images scale properly

---

## ♿ Accessibility Checklist

For any interactive component:

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus states are visible
- [ ] Form labels are associated
- [ ] Color contrast ≥4.5:1
- [ ] alt text for images (if any)
- [ ] Error messages clear

---

## 💾 Git Workflow Checklist

For every commit:

```bash
# Before commit
git status                 # Review changes
git diff                   # Double-check diffs
npm test                   # All tests pass
npm run lint               # Linting passes

# Commit with semantic message
git add .
git commit -m "type(scope): description

Longer explanation if needed."

# Types: feat, fix, docs, test, refactor, style, chore, perf
# Scope: main, renderer, services, components, etc.

# Before push
git log --oneline -5       # Review commits
git push origin feature/electron
```

---

## 🎓 Learning Resources

Keep handy:

- [ ] QUICKSTART.md - Get running fast
- [ ] README.md - Project overview
- [ ] ARCHITECTURE.md - Design patterns
- [ ] API_REFERENCE.md - Service usage
- [ ] PROJECT_STRUCTURE.md - File layout

---

**Last Updated**: 07/05/2026  
**Version**: 2.0  
**Status**: Active Development
