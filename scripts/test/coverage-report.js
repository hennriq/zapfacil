#!/usr/bin/env node

/**
 * Test Coverage Report Generator
 * Generates comprehensive coverage reports and analysis
 * 
 * Usage:
 *   node scripts/test/coverage-report.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = process.cwd()
const coverageDir = path.join(projectRoot, 'coverage')

console.log('📊 Generating coverage report...\n')

try {
  // Run tests with coverage
  console.log('Running tests with coverage...')
  execSync('npm run test:coverage', {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  // Read coverage summary
  const summaryPath = path.join(coverageDir, 'coverage-summary.json')
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
    const global = summary.total

    console.log('\n📈 Coverage Summary:')
    console.log('─'.repeat(50))

    const formatPercent = (val) => `${val.toFixed(2)}%`.padEnd(8)

    console.log(`Statements:  ${formatPercent(global.statements.pct)} (${global.statements.covered}/${global.statements.total})`)
    console.log(`Branches:    ${formatPercent(global.branches.pct)} (${global.branches.covered}/${global.branches.total})`)
    console.log(`Functions:   ${formatPercent(global.functions.pct)} (${global.functions.covered}/${global.functions.total})`)
    console.log(`Lines:       ${formatPercent(global.lines.pct)} (${global.lines.covered}/${global.lines.total})`)

    console.log('─'.repeat(50))

    // Check coverage thresholds
    const thresholds = {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    }

    let allPassed = true
    Object.entries(thresholds).forEach(([key, threshold]) => {
      const actual = global[key].pct
      const status = actual >= threshold ? '✓' : '✗'
      const color = actual >= threshold ? '\x1b[32m' : '\x1b[31m'
      console.log(
        `${color}${status}\x1b[0m ${key.padEnd(12)}: ${actual.toFixed(2)}% (threshold: ${threshold}%)`
      )
      if (actual < threshold) allPassed = false
    })

    console.log('─'.repeat(50))

    // File coverage breakdown
    if (fs.existsSync(path.join(coverageDir, 'lcov-report/index.html'))) {
      console.log('\n📄 Detailed coverage report: ./coverage/lcov-report/index.html')
    }

    if (!allPassed) {
      console.log('\n⚠️  Some coverage thresholds not met')
      process.exit(1)
    } else {
      console.log('\n✅ All coverage thresholds met!')
      process.exit(0)
    }
  } else {
    console.log('Coverage summary not found')
    process.exit(1)
  }
} catch (error) {
  console.error('\n❌ Coverage report generation failed')
  console.error(error.message)
  process.exit(1)
}
