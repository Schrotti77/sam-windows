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

```powershell
# Download and run (as Administrator):
 irm https://raw.githubusercontent.com/schrotti77/sam-windows/main/install.ps1 | iex
```

Or manually:

```powershell
# 1. Download from GitHub
# 2. Extract to C:\SAM
# 3. Run as Administrator:
cd C:\SAM
.\install.ps1
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
