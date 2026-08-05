#!/usr/bin/env node

/**
 * Install Git Hooks
 * Sets up pre-commit hooks for automated testing
 * 
 * Usage:
 *   npm run hooks:install
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = process.cwd()
const gitHooksDir = path.join(projectRoot, '.git', 'hooks')
const preCommitSrc = path.join(projectRoot, 'scripts', 'hooks', 'pre-commit.js')
const preCommitDest = path.join(gitHooksDir, 'pre-commit')

console.log('🔧 Installing git hooks...\n')

try {
  // Create hooks directory if it doesn't exist
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true })
    console.log('✓ Created .git/hooks directory')
  }

  // Copy pre-commit hook
  if (fs.existsSync(preCommitSrc)) {
    fs.copyFileSync(preCommitSrc, preCommitDest)
    console.log('✓ Copied pre-commit hook')

    // Make it executable
    execSync(`chmod +x ${preCommitDest}`)
    console.log('✓ Made pre-commit hook executable')
  } else {
    console.warn('⚠️  pre-commit.js not found at', preCommitSrc)
  }

  console.log('\n✅ Git hooks installed successfully!')
  console.log('Now tests will run automatically before each commit.')
} catch (error) {
  console.error('❌ Failed to install git hooks')
  console.error(error.message)
  process.exit(1)
}
