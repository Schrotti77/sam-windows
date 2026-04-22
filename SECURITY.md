# Security Guide for SAM

> SAM v4.5.0 — Software Asset Management

## ⚠️ Critical — Immediate Action Required

### 1. Change Default Credentials
After installation, **immediately** change the default password:

```
Default: john@doe.com / johndoe123
```

Go to Settings or use the database directly to set a strong password.

### 2. Set a Strong NEXTAUTH_SECRET
The `.env` file may contain a default secret. Generate a new one:

```powershell
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
notepad C:\SAM\.env
```

### 3. Remove Fallback Secret
The custom login route (`app/api/login/route.ts`) has a hardcoded fallback:

```typescript
// DANGEROUS — remove this:
process.env.NEXTAUTH_SECRET || 'fallback-secret'

// Safe:
const secret = process.env.NEXTAUTH_SECRET
if (!secret) throw new Error('NEXTAUTH_SECRET is required')
```

**Recommendation:** Use NextAuth.js (`/api/auth/[...nextauth]`) and remove the custom login route entirely.

## 🔒 Authentication

### NextAuth.js (Recommended)
- Endpoint: `/api/auth/[...nextauth]`
- JWT sessions with 7-day expiry
- Role-based access (IT_ADMIN)

### Custom JWT (Deprecated)
- Endpoint: `/api/login`
- Also sets HTTP-only cookie
- **Planned for removal in v4.6**

## 🎧 Network Security

### Firewall
The installer creates a Windows Firewall rule for port 3000 (or custom port).

```powershell
# Verify rule exists
Get-NetFirewallRule -DisplayName "SAM*"

# Remove rule (if needed)
Remove-NetFirewallRule -DisplayName "SAM - Software Asset Management*"
```

### Binding
By default SAM binds to all interfaces (`0.0.0.0:3000`). If running on a public server:

1. Use a reverse proxy (IIS, Nginx)
2. Enable HTTPS
3. Update `NEXTAUTH_URL` to use `https://`

## 📁 Database Security

### SQLite
- Database file: `data/sam.db`
- File permissions should restrict access to the service account only
- **No encryption at rest** — consider BitLocker or folder encryption

### Backups
```powershell
# Manual backup before updates
copy C:\SAM\data\sam.db C:\SAM\data\sam-backup-$(Get-Date -Format yyyyMMdd-HHmm).db
```

## 🔗 HTTPS (Production)

For production deployments, configure HTTPS:

### Option 1: IIS Reverse Proxy
```powershell
# Install IIS and ARR (Application Request Routing)
# Create reverse proxy rule forwarding to localhost:3000
# Bind SSL certificate to IIS site
```

### Option 2: Direct (not recommended)
```powershell
# Requires SSL certificate files
# Next.js can be started with custom server for HTTPS
```

## 📋 Security Checklist

- [ ] Default password changed
- [ ] `NEXTAUTH_SECRET` is random and strong
- [ ] Fallback secret removed from code
- [ ] Firewall rule active (only needed ports)
- [ ] HTTPS configured (production)
- [ ] Database file has restricted permissions
- [ ] Regular backups scheduled
- [ ] Windows Service runs under limited user account (not SYSTEM)

## 📧 Reporting Issues

If you discover a security vulnerability:
1. Do not open a public issue
2. Contact the maintainer directly
