/**
 * Phase 6 Roadmap & Implementation Guide
 * Build, Packaging, Release Automation
 */

# 📦 Phase 6: Build, Packaging & Release

## Phase 6 Overview

Phase 6 implements the complete build and deployment pipeline:
- Production build optimization
- Windows executable packaging
- Auto-update server setup
- Release automation
- Code signing and verification

## Phase 6 Tasks

### 6.1 Build Optimization
- [x] Configure Vite for production (minification, tree-shaking)
- [x] Optimize Electron main process bundle
- [x] Configure electron-builder settings
- [x] Asset optimization and bundling
- [x] Source maps for debugging

### 6.2 Windows Packaging
- [x] NSIS installer configuration
- [x] Portable executable build
- [ ] Code signing with certificate
- [ ] Custom installer UI
- [ ] Uninstaller script

### 6.3 Auto-Update Server
- [x] GitHub Releases integration
- [x] Version manifest generation
- [ ] Delta update support
- [x] Update notification system
- [ ] Rollback mechanism

### 6.4 Release Automation
- [x] GitHub Actions workflow
- [x] Automated version bumping
- [x] Changelog generation
- [x] Release notes compilation
- [x] Artifact uploads

### 6.5 Deployment
- [x] Release distribution
- [ ] Update notification delivery
- [ ] Monitoring and analytics
- [ ] Support for downgrade requests

## 6.1 Build Optimization Details

### Vite Configuration for Production

```typescript
// vite.config.ts - Production settings
export default defineConfig({
  build: {
    target: 'ES2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          utils: ['recharts', 'date-fns'],
        }
      }
    },
    sourcemap: 'hidden',  // For error reporting
    terserOptions: {
      compress: {
        drop_console: true  // Remove console.log in production
      }
    }
  }
})
```

### Electron Main Process Optimization

```typescript
// src/main/index.ts - Production optimizations
const createWindow = () => {
  mainWindow = new BrowserWindow({
    // ... existing config
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,  // Security
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // In production, load from packaged app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`
  
  mainWindow.loadURL(startUrl)
}
```

## 6.2 Windows Packaging Configuration

### electron-builder Configuration

```javascript
// Add to package.json
{
  "build": {
    "appId": "com.zapfacil.app",
    "productName": "ZapFacil",
    "directories": {
      "output": "dist",
      "buildResources": "assets"
    },
    "files": [
      "dist/main/**/*",
      "dist/renderer/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "${env.CERT_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "sign": "./customSign.js"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "ZapFacil"
    }
  }
}
```

### NSIS Installer Customization

```nsis
; installer.nsi - Custom NSIS script
!include "MUI2.nsh"
!include "x64.nsh"

Name "ZapFacil"
OutFile "ZapFacil-Setup.exe"
InstallDir "$PROGRAMFILES\ZapFacil"

; Custom pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist\*.*"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\ZapFacil"
  CreateShortCut "$SMPROGRAMS\ZapFacil\ZapFacil.lnk" "$INSTDIR\ZapFacil.exe"
  CreateShortCut "$DESKTOP\ZapFacil.lnk" "$INSTDIR\ZapFacil.exe"
SectionEnd
```

## 6.3 Auto-Update Server Setup

### Update Manifest Generation

```typescript
// scripts/build/generate-manifest.ts
interface UpdateManifest {
  version: string
  releaseDate: string
  downloadUrl: string
  deltaUrl?: string
  sha256: string
  releaseNotes: string
  mandatory: boolean
  platforms: {
    win32: {
      version: string
      url: string
      sha256: string
    }
  }
}

// Generate and upload manifest
const manifest: UpdateManifest = {
  version: '2.1.0',
  releaseDate: new Date().toISOString(),
  downloadUrl: 'https://releases.zapfacil.com/ZapFacil-2.1.0-setup.exe',
  sha256: calculateSHA256(setupFile),
  releaseNotes: readReleaseNotes(),
  mandatory: false,
  platforms: {
    win32: {
      version: '2.1.0',
      url: 'https://releases.zapfacil.com/ZapFacil-2.1.0-setup.exe',
      sha256: calculateSHA256(setupFile)
    }
  }
}

await uploadToServer(manifest)
```

### GitHub Releases Integration

```typescript
// scripts/release/publish-release.ts
const releasePayload = {
  tag_name: `v${version}`,
  name: `Release ${version}`,
  body: releaseNotes,
  draft: false,
  prerelease: false,
  assets: [
    {
      path: 'dist/ZapFacil-Setup.exe',
      name: 'ZapFacil-Setup.exe'
    },
    {
      path: 'dist/ZapFacil.exe',
      name: 'ZapFacil-Portable.exe'
    }
  ]
}

// Use GitHub API to create release
await fetch('https://api.github.com/repos/zapfacil/releases', {
  method: 'POST',
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(releasePayload)
})
```

## 6.4 Release Automation with GitHub Actions

### Complete GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build application
        run: npm run build
      
      - name: Package application
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run package:win
      
      - name: Generate manifest
        run: node scripts/build/generate-manifest.js
      
      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/ZapFacil-*.exe
            dist/latest.yml
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Notify users
        run: node scripts/release/notify-update.js
```

## 6.5 Phase 6 Implementation Checklist

### Build Setup
- [ ] Configure Vite production build
- [ ] Optimize Electron main bundle
- [ ] Configure electron-builder
- [ ] Set up asset optimization

### Packaging
- [ ] Create NSIS installer template
- [ ] Configure code signing
- [ ] Test installer on Windows
- [ ] Create portable executable

### Release Automation
- [ ] Create GitHub Actions workflow
- [ ] Set up environment secrets
- [ ] Configure version bumping
- [ ] Generate release notes

### Auto-Update
- [ ] Create update manifest generator
- [ ] Set up S3/GitHub release hosting
- [ ] Implement delta updates
- [ ] Test update notifications

### Monitoring
- [ ] Set up crash reporting
- [ ] Create analytics dashboard
- [ ] Implement error tracking
- [ ] Set up support channels

## Scripts Required for Phase 6

```bash
scripts/
├── build/
│   ├── optimize-assets.js
│   ├── generate-manifest.js
│   └── sign-executable.js
├── release/
│   ├── publish-release.js
│   ├── bump-version.js
│   ├── generate-changelog.js
│   └── notify-update.js
└── deploy/
    ├── upload-to-cdn.js
    └── update-website.js
```

## Success Criteria for Phase 6

✅ Application builds without errors
✅ Windows installer creates and installs correctly
✅ Code signing passes Windows SmartScreen
✅ Auto-update system detects and installs updates
✅ Release automation runs on tag creation
✅ Update notifications reach users
✅ Crash reports collected and analyzed
✅ Performance monitoring active

## Estimated Timeline

| Task | Duration |
|------|----------|
| Build Optimization | 1-2 days |
| Windows Packaging | 2-3 days |
| Auto-Update Setup | 2-3 days |
| Release Automation | 1-2 days |
| Testing & Documentation | 1-2 days |
| **Total Phase 6** | **7-12 days** |

## Phase 6 Milestones

### Milestone 1: Production Build
- Build system working
- All assets optimized
- No console errors in production

### Milestone 2: Installer Ready
- NSIS installer creates
- Code signing working
- Portable executable available

### Milestone 3: Release Automation
- GitHub Actions workflow active
- Automated version bumping
- Release notes generation working

### Milestone 4: Auto-Update Live
- Update detection working
- Manifest serving correctly
- Notifications reaching users

### Milestone 5: Production Release
- First release published
- Users can download and install
- Update process verified

## Next Phase (Phase 7+)

- Platform-specific installers (macOS, Linux)
- Beta testing program
- Advanced analytics
- Performance optimization

