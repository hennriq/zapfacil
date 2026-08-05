/**
 * Comprehensive Testing Documentation
 * Phase 5 - Testing & Coverage
 */

# 🧪 Phase 5: Testing & Coverage

## Overview

Phase 5 implements a comprehensive testing infrastructure with:
- ✅ Unit tests for all services
- ✅ Integration tests for IPC communication
- ✅ E2E tests for complete workflows
- ✅ Coverage reporting and monitoring
- ✅ Pre-commit hooks for quality assurance
- ✅ CI/CD integration

## Test Structure

```
tests/
├── setup.ts                 # Jest configuration & mocks
├── utils.ts                 # Testing utilities & helpers
├── unit/
│   ├── services/            # Service unit tests
│   │   ├── BootstrapService.test.ts
│   │   ├── ChromeUpdateService.test.ts
│   │   ├── ContactImportService.test.ts
│   │   ├── LoggerService.test.ts
│   │   ├── PhoneValidationService.test.ts
│   │   └── WhatsAppAutomationService.test.ts
│   └── utils/
│       └── WebUtility.test.ts
├── integration/
│   └── ipc.test.ts          # IPC communication tests
└── e2e/
    ├── app.e2e.test.ts      # App lifecycle tests
    └── workflows.test.ts    # Complete workflow tests
```

## Test Commands

### Run Tests

```bash
# Run all tests with coverage
npm test

# Run specific test type
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # E2E tests only
npm run test:all        # Run all tests sequentially

# Run tests in watch mode
npm run test:watch

# CI/CD test run
npm run test:ci

# Generate coverage report
npm run test:coverage   # Creates HTML report in ./coverage
npm run test:report     # Detailed coverage analysis
```

## Coverage Thresholds

### Global Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Services Thresholds (Stricter)
- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

## Testing Utilities

Located in `tests/utils.ts`:

```typescript
// Create mock data
createMockContact()
createMockContacts(5)
createMockValidationResult()
createMockSendResult()
createMockLogEntry()

// Async helpers
waitFor(condition, timeout)
createDelayedPromise(value, delay)

// Test data sets
TEST_DATA.validPhones
TEST_DATA.invalidEmails
TEST_DATA.validCSVContent

// Utilities
expectErrorMessage(error, text)
expectObjectShape(obj, shape)
spyOnConsole()
resetAllMocks()
```

## Unit Tests

### Services Coverage

1. **PhoneValidationService**
   - ✅ Phone number validation (Brazilian format)
   - ✅ Phone number formatting
   - ✅ Country code extraction
   - ✅ Error handling

2. **LoggerService**
   - ✅ Log level management
   - ✅ Context-based logging
   - ✅ Log history
   - ✅ File logging

3. **ChromeUpdateService**
   - ✅ Version detection
   - ✅ Update checking
   - ✅ Download & installation
   - ✅ Error recovery

4. **ContactImportService**
   - ✅ CSV import
   - ✅ Data validation
   - ✅ CSV export
   - ✅ Duplicate detection

5. **WhatsAppAutomationService**
   - ✅ Message sending
   - ✅ Contact validation
   - ✅ Session management
   - ✅ Error handling

6. **BootstrapService**
   - ✅ Service initialization
   - ✅ Service coordination
   - ✅ Shutdown sequence
   - ✅ Singleton pattern

## Integration Tests

Located in `tests/integration/ipc.test.ts`:

Validates IPC communication between main and renderer processes:

- ✅ `app:get-status` - Get app status
- ✅ `contacts:import-csv` - Import contacts
- ✅ `contacts:export-csv` - Export contacts
- ✅ `chrome-driver:check-update` - Check for updates
- ✅ `chrome-driver:update` - Download & install
- ✅ `whatsapp:initialize` - Initialize WhatsApp
- ✅ `whatsapp:send-messages` - Send messages
- ✅ `app:shutdown` - Graceful shutdown
- ✅ IPC event listeners - Listen for updates

## E2E Tests

Located in `tests/e2e/workflows.test.ts`:

Tests complete application workflows:

### 1. Contact Management
- Import from CSV with validation
- Export to CSV file
- Handle validation warnings
- Duplicate detection

### 2. Message Sending
- Send to multiple contacts
- Handle partial failures
- Automatic retry logic
- Error recovery

### 3. Authentication
- WhatsApp initialization
- QR code timeout handling
- Session management
- Error recovery

### 4. Chrome Driver Update
- Detect available updates
- Download & install
- Schedule regular checks
- Handle failures

### 5. Logging & Monitoring
- Capture application logs
- Filter logs by level
- Maintain log history
- Error tracking

### 6. Application Lifecycle
- Complete initialization sequence
- Graceful shutdown
- Resource cleanup
- Error handling

## Coverage Reports

### Generate HTML Report
```bash
npm run test:coverage
# Opens: ./coverage/lcov-report/index.html
```

### View Coverage Summary
```bash
npm run test:report
```

### Output Example
```
📈 Coverage Summary:
──────────────────────────────────────────────
Statements:  82.50% (330/400)
Branches:    80.10% (160/200)
Functions:   85.30% (103/121)
Lines:       83.20% (332/399)
──────────────────────────────────────────────
✓ statements: 82.50% (threshold: 80%)
✓ branches:   80.10% (threshold: 80%)
✓ functions:  85.30% (threshold: 80%)
✓ lines:      83.20% (threshold: 80%)
──────────────────────────────────────────────
✅ All coverage thresholds met!
```

## Pre-commit Hooks

Automatically run before each commit:

```bash
npm run hooks:install  # Install git hooks
npm run hooks:precommit # Run pre-commit checks manually
```

### Pre-commit Checklist
1. ✅ ESLint - Code style validation
2. ✅ TypeScript - Type checking
3. ✅ Unit Tests - Functionality verification
4. ✅ Auto-fix - Fix lint issues
5. ✅ Re-stage - Add fixes to commit

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install --legacy-peer-deps
      - run: npm run test:ci
      - run: npm run test:report
```

## Best Practices

1. **Write Tests First**
   - Use TDD approach
   - Test behavior, not implementation

2. **Organize Tests**
   - Group related tests with `describe`
   - Use clear test names
   - Follow AAA pattern (Arrange, Act, Assert)

3. **Mock External Dependencies**
   - Mock Electron APIs
   - Mock HTTP requests
   - Use jest.fn() for tracking calls

4. **Keep Tests Fast**
   - Isolate tests
   - Avoid real file I/O
   - Mock time-dependent operations

5. **Maintain Coverage**
   - Aim for 80%+ coverage
   - 90%+ for core services
   - Regular review of uncovered lines

## Troubleshooting

### Tests not running
```bash
# Clear Jest cache
npm test -- --clearCache

# Check Node version (need 14+)
node --version
```

### Coverage thresholds failing
```bash
# Generate detailed report
npm run test:report

# Review uncovered lines in HTML report
open coverage/lcov-report/index.html
```

### Specific test failing
```bash
# Run single test file
npm test -- PhoneValidationService.test.ts

# Run with verbose output
npm test -- --verbose
```

## Next Steps (Phase 6)

- Build and packaging optimization
- Release automation
- Installer signing and verification
- Auto-update server setup
- Release notes generation
