#!/usr/bin/env node

/**
 * Diagnostic Script - Check Project Health
 * Runs basic checks to identify project issues
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ZapFacil Project Health Check\n');
console.log('─'.repeat(50));

const checks = [];

// 1. Check Node version
const nodeVersion = process.version;
console.log(`✓ Node version: ${nodeVersion}`);
checks.push({ name: 'Node version', status: 'OK', value: nodeVersion });

// 2. Check npm version
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm -v', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  console.log(`✓ npm version: ${npmVersion}`);
  checks.push({ name: 'npm', status: 'OK', value: npmVersion });
} catch (e) {
  console.log(`✗ npm not accessible`);
  checks.push({ name: 'npm', status: 'ERROR', value: e.message });
}

// 3. Check node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);
console.log(`${hasNodeModules ? '✓' : '✗'} node_modules: ${hasNodeModules ? 'installed' : 'MISSING'}`);
checks.push({ name: 'node_modules', status: hasNodeModules ? 'OK' : 'MISSING', value: hasNodeModules ? 'Present' : 'Run npm install' });

// 4. Check TypeScript
try {
  const tsVersion = require('typescript/package.json').version;
  console.log(`✓ TypeScript: ${tsVersion}`);
  checks.push({ name: 'TypeScript', status: 'OK', value: tsVersion });
} catch (e) {
  console.log(`✗ TypeScript not installed`);
  checks.push({ name: 'TypeScript', status: 'ERROR', value: 'Not installed' });
}

// 5. Check Vite
try {
  const viteVersion = require('vite/package.json').version;
  console.log(`✓ Vite: ${viteVersion}`);
  checks.push({ name: 'Vite', status: 'OK', value: viteVersion });
} catch (e) {
  console.log(`✗ Vite not installed`);
  checks.push({ name: 'Vite', status: 'ERROR', value: 'Not installed' });
}

// 6. Check React
try {
  const reactVersion = require('react/package.json').version;
  console.log(`✓ React: ${reactVersion}`);
  checks.push({ name: 'React', status: 'OK', value: reactVersion });
} catch (e) {
  console.log(`✗ React not installed`);
  checks.push({ name: 'React', status: 'ERROR', value: 'Not installed' });
}

// 7. Check Electron
try {
  const electronVersion = require('electron/package.json').version;
  console.log(`✓ Electron: ${electronVersion}`);
  checks.push({ name: 'Electron', status: 'OK', value: electronVersion });
} catch (e) {
  console.log(`✗ Electron not installed`);
  checks.push({ name: 'Electron', status: 'ERROR', value: 'Not installed' });
}

// 8. Check Jest
try {
  const jestVersion = require('jest/package.json').version;
  console.log(`✓ Jest: ${jestVersion}`);
  checks.push({ name: 'Jest', status: 'OK', value: jestVersion });
} catch (e) {
  console.log(`✗ Jest not installed`);
  checks.push({ name: 'Jest', status: 'ERROR', value: 'Not installed' });
}

// 9. Check key source files
const sourceFiles = [
  'src/renderer/index.tsx',
  'src/main/index.ts',
  'src/preload.ts',
  'tsconfig.json',
  'vite.config.ts',
  'jest.config.js',
];

console.log('\n📁 Source files:');
sourceFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n─'.repeat(50));
console.log('\n✅ Health check complete!\n');

// Show recommendations
const missingPackages = checks.filter(c => c.status === 'ERROR');
if (missingPackages.length > 0) {
  console.log('⚠️  Recommendations:');
  console.log('   Run: npm install --legacy-peer-deps\n');
}
