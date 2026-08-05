#!/usr/bin/env node

/**
 * Pre-commit Hook - Run Tests Before Commit
 * This file should be copied to .git/hooks/pre-commit
 * 
 * Usage:
 *   chmod +x scripts/hooks/pre-commit.js
 *   cp scripts/hooks/pre-commit.js .git/hooks/pre-commit
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '../..')

console.log('🔍 Running pre-commit checks...\n')

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only', {
    cwd: projectRoot,
  })
    .toString()
    .split('\n')
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))

  if (stagedFiles.length === 0) {
    console.log('✓ No TypeScript files staged')
    process.exit(0)
  }

  console.log(`📝 Found ${stagedFiles.length} staged TypeScript file(s)`)

  // 1. Lint check
  console.log('\n📏 Running ESLint...')
  try {
    execSync('npm run lint -- --fix', {
      cwd: projectRoot,
      stdio: 'inherit',
    })
    console.log('✓ ESLint passed')
  } catch (error) {
    console.error('✗ ESLint failed')
    process.exit(1)
  }

  // 2. Type check
  console.log('\n🔷 Running TypeScript type check...')
  try {
    execSync('npm run type-check', {
      cwd: projectRoot,
      stdio: 'inherit',
    })
    console.log('✓ Type check passed')
  } catch (error) {
    console.error('✗ Type check failed')
    process.exit(1)
  }

  // 3. Unit tests for changed files
  console.log('\n🧪 Running unit tests...')
  try {
    execSync('npm run test:ci', {
      cwd: projectRoot,
      stdio: 'inherit',
    })
    console.log('✓ Tests passed')
  } catch (error) {
    console.error('✗ Tests failed')
    process.exit(1)
  }

  // 4. Re-add fixed files
  console.log('\n📦 Adding fixed files to staging...')
  execSync('git add .' , {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  console.log('\n✅ All pre-commit checks passed!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Pre-commit check failed')
  console.error(error.message)
  process.exit(1)
}
