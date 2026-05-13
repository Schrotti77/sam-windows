# SAM - Software Asset Management

IT Asset Management System for Windows Server 2019+.

Current release: **v4.5.9**

## Features

- **Software Inventory** — Track software assets with metadata, ownership, lifecycle state and operational details.
- **License Management** — Monitor license compliance, expiry dates, seat counts and linked software records.
- **Vendor Management** — Manage vendor contact data and block unsafe deletes when dependent software or contracts exist.
- **Contract Management** — Create, edit, delete and review vendor contracts from the `/contracts` dashboard module.
- **Budget Management** — Track departmental/category budgets from the `/budgets` module; remaining budget is calculated server-side.
- **Software Assignments** — Assign software to users from the `/assignments` module and track active/revoked usage.
- **Cost Tracking** — Track software costs by department, category, billing cycle and date.
- **Dashboard and Reports** — Overview cards, charts and report APIs for assets, compliance and cost views.
- **Alerts** — Track expiring licenses and compliance issues.
- **Import/Export** — Full JSON export/restore including vendors, software, licenses, costs, alerts, contracts, budgets, assignments and users.
- **Windows Deployment** — PowerShell installer, update flow, PM2/NSSM service option and Windows-safe build wrapper.

## v4.5.x Highlights

### Contracts

- Dashboard route: `/contracts`
- API routes: `/api/contracts` and `/api/contracts/[id]`
- Supports list, create, edit and delete.
- Tracks contract number, title, vendor, start/end/renewal dates, value, payment terms, renewal terms, status and notes.
- Vendor deletion is blocked cleanly while dependent contracts exist.

### Budgets

- Dashboard route: `/budgets`
- API routes: `/api/budgets` and `/api/budgets/[id]`
- Supports list, create, edit and delete.
- Tracks name, department, category, budget amount, spent amount, fiscal year, date range and notes.
- `remainingAmount` is calculated by the API from `budgetAmount - spentAmount`; clients do not submit it.
- Fiscal year/date validation prevents inconsistent budget periods.

### Assignments

- Dashboard route: `/assignments`
- API routes: `/api/assignments` and `/api/assignments/[id]`
- Supports list, create, edit and delete.
- Links software to a user identifier, department, assignment date, revocation date, status and notes.
- `userId` is intentionally a plain string for the current internal/LAN deployment model.
- Software deletion is blocked cleanly while dependent assignments exist.

### CRUD and Validation Hardening

- Vendor/software/license/cost/alert/contract/budget/assignment mutations return controlled validation errors instead of accidental `500` responses.
- Foreign-key delete conflicts are reported cleanly.
- Vendor update diagnostics include detailed error information when a write fails.
- Fake/unfinished dashboard actions were replaced with real API calls or removed from active UI surfaces.

### Windows Update Hardening

- `install.ps1 -Update` stops the running SAM process before replacing files and rebuilding.
- Stale `.next` output is removed during update to avoid mixed old/new Next.js assets.
- `install.ps1` and `start.ps1` repair SQLite data-directory ACLs/read-only attributes to avoid `attempt to write a readonly database` errors after elevated installs or backups.
- Relative SQLite `DATABASE_URL` values are normalized to the installed `data/sam.db` path.

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** SQLite via Prisma ORM
- **Auth:** Custom JWT cookie route plus NextAuth dependency compatibility
- **Runtime:** Node.js on Windows, optionally managed by PM2 or NSSM

## Quick Install

### Option 1: One-Liner (Recommended)

Run PowerShell as Administrator:

```powershell
irm https://raw.githubusercontent.com/Schrotti77/sam-windows/main/install.ps1 | iex
```

### Option 2: Manual Clone

```powershell
git clone https://github.com/Schrotti77/sam-windows.git C:\SAM
cd C:\SAM
.\install.ps1
```

### Option 3: With Windows Service

```powershell
cd C:\SAM
.\install.ps1 -SetupService
```

## Installation Options

```powershell
# Standard install to C:\SAM
.\install.ps1

# Custom directory
.\install.ps1 -InstallDir "D:\Apps\SAM"

# Custom port
.\install.ps1 -Port 8080

# Install as Windows Service / auto-start on boot
.\install.ps1 -SetupService

# Update existing installation
.\install.ps1 -Update -InstallDir C:\SAM

# Combined: update + service
.\install.ps1 -Update -InstallDir C:\SAM -SetupService

# Skip Node.js check if already installed
.\install.ps1 -SkipNodeCheck

# Skip firewall configuration
.\install.ps1 -SkipFirewall
```

> PowerShell uses single-dash switches. Use `-Update`, not `--Update`.

## Usage

```powershell
# Start production mode
.\start.ps1

# Start development mode with hot reload
.\start.ps1 -Dev

# Stop
.\stop.ps1
```

### Background with PM2

```powershell
npm i -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 status
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

## API Overview

### Core Resources

- `GET /api/software` — list software inventory
- `POST /api/software` — create software
- `GET /api/software/[id]` — get one software item
- `PUT /api/software/[id]` — update software
- `DELETE /api/software/[id]` — delete software when no dependent records block it
- `GET /api/vendors` — list vendors
- `POST /api/vendors` — create vendor
- `PUT /api/vendors/[id]` — update vendor
- `DELETE /api/vendors/[id]` — delete vendor when no dependent software/contracts block it
- `GET /api/licenses` / `POST /api/licenses` — license list/create
- `PUT /api/licenses/[id]` / `DELETE /api/licenses/[id]` — license update/delete
- `GET /api/costs` / `POST /api/costs` — cost list/create
- `PUT /api/costs/[id]` / `DELETE /api/costs/[id]` — cost update/delete
- `GET /api/alerts` / `POST /api/alerts` — alert list/create
- `PUT /api/alerts/[id]` / `DELETE /api/alerts/[id]` — alert update/delete
- `POST /api/alerts/[id]/resolve` — mark alert resolved

### v4.5 Modules

- `GET /api/contracts` / `POST /api/contracts` — contract list/create
- `GET /api/contracts/[id]` / `PUT /api/contracts/[id]` / `DELETE /api/contracts/[id]` — contract read/update/delete
- `GET /api/budgets` / `POST /api/budgets` — budget list/create
- `GET /api/budgets/[id]` / `PUT /api/budgets/[id]` / `DELETE /api/budgets/[id]` — budget read/update/delete
- `GET /api/assignments` / `POST /api/assignments` — assignment list/create
- `GET /api/assignments/[id]` / `PUT /api/assignments/[id]` / `DELETE /api/assignments/[id]` — assignment read/update/delete

### Dashboard, Auth and Data Movement

- `GET /api/dashboard/stats` — dashboard statistics
- `GET /api/dashboard/compliance` — compliance overview
- `GET /api/dashboard/costs` — cost/report data
- `GET /api/export` — full JSON export
- `POST /api/import` — restore/import from a SAM export
- `POST /api/login` — custom JWT login, sets `auth-token` cookie
- `POST /api/logout` — logout
- `GET /api/me` — current user
- `POST /api/signup` — user registration

## Import / Export

The JSON export format is currently version **3.1** and includes:

- users
- vendors
- software
- licenses
- costs
- alerts
- contracts
- budgets
- assignments

Import supports ID remapping between vendors/software and dependent records. The importer handles contracts, budgets and assignments, normalizes older budget date shapes and avoids duplicate budget/assignment records on repeated imports where possible.

## Authentication and Security Model

SAM is normally deployed as an internal Windows/LAN tool. API write protection is therefore opt-in for hardened deployments:

```powershell
$env:SAM_REQUIRE_AUTH="true"
.\start.ps1
```

When `SAM_REQUIRE_AUTH=true`, protected API mutations and import/export require a valid `auth-token` cookie from `/api/login`. When it is not set to `true`, API writes are allowed for internal deployments.

Security notes:

- Change the default password after first login.
- Generate a strong `NEXTAUTH_SECRET` for production.
- Keep SAM behind your LAN/VPN/reverse-proxy controls; do not expose it directly to the public internet without a hardened auth/reverse-proxy setup.
- See `SECURITY.md` for detailed security guidance.

## Database

SAM uses SQLite; no external database server is required.

- Production install path: `C:\SAM\data\sam.db`
- Configured through `DATABASE_URL` in `.env`
- Installer/start scripts normalize relative SQLite paths and repair writable ACLs for `data` and `sam.db*` files.
- The seed script is idempotent: running `node scripts\seed.js` repeatedly updates demo records instead of duplicating them.
- Demo dates are generated relative to the current date so dashboard monthly costs and renewal/expiration examples stay useful.

## Build Instructions

On Windows, prefer the wrapper:

```powershell
.\build.cmd
```

`build.cmd` uses a temporary `subst` drive mapping to avoid Windows path-casing issues such as `C:\SAM` vs `C:\sam`, which can otherwise cause Next/React build failures. `install.ps1` and `start.ps1` call the wrapper automatically.

## Verify the Installation

After install and before handoff:

```powershell
npm run verify:install
```

After the app is running:

```powershell
$env:SMOKE_BASE_URL="http://localhost:3000"
npm run verify:running
```

Focused checks:

```powershell
npm run test:db
npm run test:vendor-update
npm run test:reports
npm run test:crud
npm run test:contracts
npm run test:contracts-ui
npm run test:budgets
npm run test:budgets-ui
npm run test:assignments
npm run test:assignments-ui
npm run test:import-export
npm run test:api-auth
npm run test:seed
```

Build/type checks:

```powershell
npx tsc --noEmit
.\build.cmd
```

## Installation Log

The installer writes detailed logs to `C:\SAM\logs\install.log`:

- Commands, output and errors are logged with timestamps.
- Update runs stop the old process, clean stale build output and regenerate Prisma/client assets.
- Database ACL repair warnings are logged but do not stop installation unless a later required step fails.

To view the log:

```powershell
notepad C:\SAM\logs\install.log
```

## Project Structure

```text
C:\SAM\
├── app/                    # Next.js 14 App Router
│   ├── (dashboard)/        # Dashboard pages: software, vendors, contracts, budgets, assignments, reports
│   ├── api/                # API routes
│   ├── login/              # Login page
│   └── register/           # Registration page
├── components/             # React components
├── lib/                    # Utilities, auth, database, validators
├── prisma/                 # Database schema
├── data/                   # Production SQLite database files
├── scripts/                # Seed, smoke and regression scripts
├── logs/                   # Installation and service logs
├── install.ps1             # Automated installer/update script
├── start.ps1               # Start script
├── stop.ps1                # Stop script
└── build.cmd               # Windows-safe build wrapper
```

## Database Schema

- **User** — Accounts: email, password, role
- **Vendor** — Software vendors and contact details
- **Software** — Software assets and metadata
- **License** — License tracking: seats, expiry, compliance
- **Contract** — Vendor contracts: value, dates, terms, status
- **SoftwareCost** — Cost entries: billing, department, category
- **Budget** — Department/category budgets with fiscal-year tracking
- **ComplianceAlert** — Alerts: severity, resolved status
- **SoftwareAssignment** — User-to-software assignments

## System Requirements

- Windows Server 2019 or Windows 10/11
- PowerShell 5.1+
- Node.js 18+; Node.js 22 LTS recommended
- npm 9+
- 2 GB RAM minimum
- Port 3000 by default; configurable with `-Port`

## Backup

```powershell
# Manual backup
Copy-Item C:\SAM\data\sam.db C:\SAM\data\sam-backup-$(Get-Date -Format yyyyMMdd).db
```

For restore/migration between SAM instances, prefer the built-in JSON export/import flow when the application is running.

## Troubleshooting

### Installation fails

1. Check the installation log: `C:\SAM\logs\install.log`
2. Ensure PowerShell is running as Administrator.
3. Verify Node.js >= 18 is installed: `node --version`
4. Verify npm is available: `npm --version`
5. If updating, make sure the command uses `-Update`, not `--Update`.

### Database issues

```powershell
cd C:\SAM
npx prisma generate
npx prisma db push
node scripts\seed.js
```

If writes fail with `attempt to write a readonly database`, run:

```powershell
cd C:\SAM
.\start.ps1
```

`start.ps1` repairs the `data` ACL/read-only state before launching. A full update also performs the same repair:

```powershell
cd C:\SAM
.\install.ps1 -Update -InstallDir C:\SAM
```

### Build issues

```powershell
cd C:\SAM
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
.\build.cmd
```

### Port already in use

```powershell
netstat -ano | findstr :3000
.\stop.ps1
```

## Development

```powershell
# Dev mode with hot reload
cd C:\SAM
npm run dev

# Production build on Windows
.\build.cmd

# Database changes
npx prisma db push
npm run db:seed
```

## Documentation

- [ROADMAP.md](ROADMAP.md) — Improvement suggestions and planned features
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [SECURITY.md](SECURITY.md) — Security guidance and hardening

## Version

Current: **v4.5.9**
