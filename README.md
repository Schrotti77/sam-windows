# SAM - Software Asset Management

IT Asset Management System for Windows Server 2019.

## Features

- **Software Inventory** — Track all software assets with metadata
- **License Management** — Monitor license compliance, expiry dates, seat counts
- **Vendor Management** — Manage vendor contacts and contracts
- **Cost Tracking** — Track software costs and budgets
- **Dashboard** — Overview with charts and compliance metrics
- **Alerts** — Automated alerts for expiring licenses and compliance issues
- **Reports** — Export reports (CSV/JSON)
- **Import/Export** — Bulk import from CSV

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** SQLite (via Prisma ORM)
- **Auth:** NextAuth.js (JWT)

## Quick Install

### Option 1: One-Liner (Recommended)

```powershell
# Download and run (as Administrator):
irm https://raw.githubusercontent.com/Schrotti77/sam-windows/main/install.ps1 | iex
```

### Option 2: Manual Clone

```powershell
# 1. Clone from GitHub
git clone https://github.com/Schrotti77/sam-windows.git C:\SAM

# 2. Run as Administrator
cd C:\SAM
.\install.ps1
```

### Option 3: With Windows Service

```powershell
# Install as auto-starting service (requires Administrator)
.\install.ps1 -SetupService
```

## Installation Options

```powershell
# Standard install (C:\SAM)
.\install.ps1

# Custom directory
.\install.ps1 -InstallDir "D:\Apps\SAM"

# Custom port
.\install.ps1 -Port 8080

# Install as Windows Service (auto-start on boot)
.\install.ps1 -SetupService

# Update existing installation
.\install.ps1 -Update

# Combined: update + service
.\install.ps1 -Update -SetupService

# Skip Node.js check (if already installed)
.\install.ps1 -SkipNodeCheck

# Skip firewall configuration
.\install.ps1 -SkipFirewall
```

## Usage

```powershell
# Start (production mode)
.\start.ps1

# Start (development mode with hot-reload)
.\start.ps1 -Dev

# Stop
.\stop.ps1
```

## Access

- **URL:** http://localhost:3000
- **Default Login:** john@doe.com / johndoe123

## Windows Service

```powershell
# Install as auto-starting service
.\install.ps1 -SetupService

# Manage service
net start SAM
net stop SAM

# Or via NSSM
nssm start SAM
nssm stop SAM
nssm restart SAM
```

## Installation Log

The installer writes detailed logs to `C:\SAM\logs\install.log`:
- All commands are executed inline with `iex` for better error handling
- Errors are captured with timestamps
- Output is logged for troubleshooting

To view the log:
```powershell
notepad C:\SAM\logs\install.log
```

## Project Structure

```
C:\SAM\
├── app/                    # Next.js 14 App Router
│   ├── (dashboard)/        # Protected dashboard pages
│   ├── api/                # API routes
│   ├── login/              # Login page
│   └── register/           # Registration page
├── components/             # React components
├── lib/                    # Utilities, auth, database
├── prisma/                 # Database schema (SQLite)
├── scripts/                # Seed & utility scripts
├── data/                   # SQLite database files
├── logs/                   # Installation log and service logs
├── install.ps1             # Automated installer
├── start.ps1               # Start script
└── stop.ps1                # Stop script
```

## System Requirements

- Windows Server 2019 (or Windows 10+)
- PowerShell 5.1+
- Node.js 18+ (auto-installed if missing)
- 2 GB RAM minimum
- Port 3000 (configurable)

## Troubleshooting

### Installation fails

1. Check the installation log: `C:\SAM\logs\install.log`
2. Ensure running as Administrator
3. Verify Node.js >= 18 is installed: `node --version`
4. Verify npm is available: `npm --version`

### Database issues

```powershell
# Reset database
cd C:\SAM
del data\sam.db
npx prisma db push
npm run seed
```

### Build issues

```powershell
# Clean rebuild
cd C:\SAM
Remove-Item .next -Recurse -Force
npm run build
```

### Port already in use

```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process (if needed)
.\stop.ps1
```

## Support

For issues, check the installation log or contact support.
