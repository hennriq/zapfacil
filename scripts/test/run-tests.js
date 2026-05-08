#!/usr/bin/env node

/**
 * Test Runner - Comprehensive testing pipeline
 * Runs unit tests, integration tests, and E2E tests with reporting
 * 
 * Usage:
 *   node scripts/test/run-tests.js [all|unit|integration|e2e]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const testType = process.argv[2] || 'all'

const tests = {
  unit: {
    name: 'Unit Tests',
    command: 'jest tests/unit --coverage',
    icon: '🧪',
  },
  integration: {
    name: 'Integration Tests',
    command: 'jest tests/integration --coverage',
    icon: '🔗',
  },
  e2e: {
    name: 'E2E Tests',
    command: 'jest tests/e2e --coverage',
    icon: '🚀',
  },
}

const runTests = (type) => {
  if (type === 'all') {
    console.log('\n📋 Running all tests...\n')
    Object.entries(tests).forEach(([key, test]) => {
      console.log(`${test.icon} ${test.name}`)
      console.log('─'.repeat(50))
      try {
        execSync(test.command, {
          cwd: projectRoot,
          stdio: 'inherit',
        })
        console.log(`✓ ${test.name} passed\n`)
      } catch (error) {
        console.error(`✗ ${test.name} failed\n`)
        process.exit(1)
      }
    })
    console.log('✅ All tests passed!')
  } else if (tests[type]) {
    const test = tests[type]
    console.log(`\n${test.icon} Running ${test.name}...\n`)
    try {
      execSync(test.command, {
        cwd: projectRoot,
        stdio: 'inherit',
      })
      console.log(`\n✅ ${test.name} passed!`)
    } catch (error) {
      console.error(`\n❌ ${test.name} failed`)
      process.exit(1)
    }
  } else {
    console.error(`❌ Invalid test type: ${type}`)
    console.error('Valid types: all, unit, integration, e2e')
    process.exit(1)
  }
}

console.log('\n🧪 ZapFacil Test Runner')
console.log('═'.repeat(50))

runTests(testType)
