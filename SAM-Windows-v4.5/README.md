# SAM - Software Asset Management (Windows)

## Requirements
- Node.js 18+ (recommended: 22 LTS)
- npm 9+ (comes with Node.js)
- Windows 10/11 or Windows Server 2019+

## Quick Install

### Option 1: PowerShell (Recommended)
```powershell
cd C:\SAM
.\install.ps1
```

### Option 2: Manual
```cmd
cd C:\SAM
npm install --legacy-peer-deps
npm dedupe --legacy-peer-deps
npx prisma generate
npx prisma db push
node scripts\seed.js
build.cmd
```

## IMPORTANT: Build Instructions

**Always use `build.cmd` instead of `npm run build` directly.**

The `build.cmd` script avoids a Windows-specific path casing issue
(e.g., `C:\SAM` vs `C:\sam`) that can cause build failures.
The `install.ps1` script handles this automatically.

If you must build manually:
```cmd
build.cmd
```

## Start the Application

### Foreground
```cmd
npm run start
```

### Background (PM2)
```cmd
npm i -g pm2
pm2 start ecosystem.config.js
```

## Access
- URL: http://localhost:3000
- Login: john@doe.com / johndoe123

## Database
Uses SQLite (file: `prisma/sam.db`). No external database needed.

## Troubleshooting

### "n.cache is not a function" or React errors during build
This is caused by Windows path casing. Solutions:
1. Use `build.cmd` instead of `npm run build`
2. Or use `install.ps1` which handles this automatically
3. Or manually: open PowerShell as Admin, run:
   ```powershell
   subst S: "C:\SAM"
   cd S:\
   npm run build
   subst S: /d
   ```

### Prisma errors
```cmd
npx prisma generate
npx prisma db push
```
