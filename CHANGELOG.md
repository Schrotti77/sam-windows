# Changelog

All notable changes to SAM (Software Asset Management) will be documented in this file.

## [4.5.0] — 2024-12-??

### Added
- Full Next.js 14 App Router migration from previous version
- shadcn/ui component library integration
- Software inventory with 60+ metadata fields
- License management (compliance tracking, seat counts, expiry dates)
- Vendor management (contacts, contracts, account managers)
- Cost tracking with billing period support (monthly/yearly)
- Budget management with fiscal year tracking
- Compliance alerts with severity levels
- Dashboard with statistics cards and charts (Recharts)
- Full database export/import with cross-DB ID remapping
- Windows Service support via NSSM
- Automated installer (`install.ps1`) with Node.js auto-install
- Firewall rule auto-configuration
- Update mechanism preserving `.env` and database

### Changed
- Migrated from previous stack to Next.js 14 + Prisma + SQLite
- Switched to Tailwind CSS for styling

### Security
- Password hashing with bcrypt (salt rounds: 12)
- JWT-based authentication
- HTTP-only auth cookies

## [Planned] 4.6.0

### Security
- Remove hardcoded fallback secret in custom login route
- Add rate limiting to authentication endpoints
- Zod input validation on all API routes

### Features
- Automatic compliance alert generation (license expiry, over-usage, contract renewal)
- Audit logging (who changed what when)
- Database pagination on all list endpoints
- Request logging with Winston/Pino
- Automatic database backups

### Fixed
- Remove `ignoreBuildErrors: true` from Next.js config
- Clean up dead code (`lib/types.ts`)
- Consolidate auth systems (NextAuth.js only)

## [Planned] 4.7.0

### Features
- Health check endpoint (`/api/health`)
- React Query / SWR for frontend caching
- Software form split into tabbed sections
- Database index optimization
- Log rotation
- Email notifications for alerts

### DevEx
- Playwright E2E tests
- API documentation
- Improved error handling

## [Planned] 5.0.0

### Architecture
- Optional PostgreSQL support (replacing SQLite)
- Expanded RBAC (VIEWER, EDITOR, ADMIN roles)
- Department-based multi-tenancy
- REST API v2 with consistent response envelope
- Dark mode
