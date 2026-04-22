# SAM — Verbesserungsvorschläge & Roadmap

> Code-Analyse vom 22.04.2026 — Basis: SAM v4.5.0

## 🔴 Kritisch — Vor nächstem Release fixen

| # | Problem | Datei(en) | Lösung |
|---|---------|-----------|--------|
| 1 | **Hardcoded Fallback-Secret** | `app/api/login/route.ts:42` | `process.env.NEXTAUTH_SECRET || 'fallback-secret'` entfernen. Stattdessen: `if (!secret) throw new Error('NEXTAUTH_SECRET required')` |
| 2 | **Duplizierte Auth-Systeme** | `lib/auth.ts`, `app/api/login/route.ts`, `app/api/auth/[...nextauth]/route.ts` | Entscheiden: NextAuth.js **ODER** Custom JWT. Beides parallel = Wartungs-Nightmare. Empfehlung: NextAuth.js behalten, Custom Route entfernen |
| 3 | **`ignoreBuildErrors: true`** | `next.config.js:4` | Entfernen. TypeScript-Fehler werden sonst stillschweigend ignoriert |
| 4 | **Kein Rate-Limiting** | `app/api/login/route.ts` | `rate-limiter-flexible` oder zumindest IP-basierte Verzögerung einbauen |
| 5 | **Keine Backend-Validierung** | Alle API Routes | Zod ist installiert (`package.json`) — Schemas definieren und in POST/PUT/PATCH nutzen. Aktuell: blindes `request.json()` |
| 6 | **`.env` enthält Default-Secret** | `.env` | `sam-se...f456` ändern. Install-Skript generiert zwar eines, aber `.env` im Repo hat Default-Wert |

## 🟠 Hoch — Nächste Version (v4.6)

| # | Problem | Lösung |
|---|---------|--------|
| 7 | **Keine automatischen Alerts** | Cron-Job/Endpoint der täglich läuft: prüft `License.expirationDate`, `Contract.endDate`, `License.usedLicenses > totalLicenses` → erstellt `ComplianceAlert` Einträge |
| 8 | **Keine Audit-Logs** | Neue Tabelle `AuditLog` (userId, action, entity, entityId, oldData, newData, timestamp) + Middleware in API Routes |
| 9 | **Keine Pagination** | `skip`/`take` in alle `findMany` Queries + Frontend DataTable mit Pagination |
| 10 | **Kein Request-Logging** | Winston oder Pino einbinden. Alle API-Requests loggen (Method, Path, User, Duration, Status) |
| 11 | **SQLite ohne Backups** | `scripts/backup-db.ps1` erstellen: kopiert `data/sam.db` mit Timestamp nach `data/backups/` |
| 12 | **Toter Code** | `lib/types.ts` enthält `Expense`-Typen aus altem Projekt — löschen |
| 13 | **Keine API-Dokumentation** | Mindestens: Endpoints + Methoden in README dokumentieren. Optimal: OpenAPI/Swagger |
| 14 | **Software-POST/PUT 60+ Felder manuell** | Zentraler `createSoftwareData(body)` Helper der `null`-Defaults und Date-Parsing kapselt |

## 🟡 Mittel — v4.7

| # | Problem | Lösung |
|---|---------|--------|
| 15 | **Kein Health-Check** | `GET /api/health` — DB-Connection, Disk-Space, Memory |
| 16 | **Kein Caching** | React Query oder SWR einbinden. Reduziert DB-Load erheblich |
| 17 | **Software-Formular UX** | 60+ Felder in einem Dialog sind unbrauchbar. Tabs gruppieren: Identifikation, Lizenz, Installation, Wartung, Finanzen, Compliance |
| 18 | **Keine DB-Indexe** | `@index` für häufige Queries: `software.vendorId`, `license.softwareId`, `complianceAlert.isResolved`, `softwareCost.softwareId` |
| 19 | **Keine Log-Rotation** | Winston mit `DailyRotateFile` oder PowerShell-Task der `logs/*.log` archiviert |
| 20 | **Kein AD/LDAP** | `next-auth/providers/ldap` für Windows-AD-Integration (Single Sign-On) |
| 21 | **Keine E2E-Tests** | Playwright: Login → Dashboard → Software anlegen → Lizenz hinzufügen |
| 22 | **Keine Email-Benachrichtigungen** | Nodemailer + SMTP. Bei neuen Alerts Email an Admin |
| 23 | **`dynamic = 'force-dynamic'` überall** | Nur dort setzen wo wirklich nötig. Statische Seiten können gecacht werden |

## 🟢 Langfristig — v5.0

| # | Idee | Begründung |
|---|------|------------|
| 24 | **PostgreSQL-Option** | SQLite ist Single-Writer. Bei >5 gleichzeitigen Nutzern oder API-Last wird es zum Bottleneck. Prisma-Schema ist bereits DB-agnostisch |
| 25 | **RBAC erweitern** | Derzeit nur `IT_ADMIN`. Rollen: `VIEWER` (nur lesen), `EDITOR` (CRUD), `ADMIN` (alles + User-Management) |
| 26 | **Multi-Tenant / Abteilungen** | `departmentId` auf allen Entitäten. User sieht nur seine Abteilung |
| 27 | **REST API v2** | Consistente Response-Envelope: `{ success, data, error, meta }` |
| 28 | **Dark Mode** | `next-themes` ist installiert — nur noch implementieren |

---

## 📊 Architektur-Score

| Bereich | Score | Begründung |
|---------|-------|------------|
| Code-Struktur | 7/10 | Klare Trennung, aber Duplikationen |
| Sicherheit | 4/10 | Kritische Lücken (Fallback-Secret, kein Rate-Limit) |
| Performance | 5/10 | Kein Caching, keine Pagination, SQLite blocking |
| UX/Frontend | 6/10 | shadcn/ui ist gut, aber 60-Felder-Formular |
| DevOps | 6/10 | Gute PowerShell-Automation, aber fehlende Backups/Healthchecks |
| Dokumentation | 5/10 | README okay, aber keine API-Doku, keine Architektur-Doku |

**Gesamt: 5.5/10** — Solide Basis, aber Sicherheit und Backend-Stabilität brauchen Arbeit.

---

## 🛠 Empfohlene Priorisierung

### Sprint 1 (Sicherheit & Stabilität)
1. Fallback-Secret entfernen
2. `ignoreBuildErrors` deaktivieren
3. Zod-Validierung in alle API Routes
4. Rate-Limiting auf Login
5. Automatische DB-Backups

### Sprint 2 (Features)
6. Automatische Alerts (Cron)
7. Audit-Logging
8. Pagination
9. Software-Formular in Tabs aufteilen

### Sprint 3 (Polish)
10. React Query / SWR
11. Health-Check Endpoint
12. Email-Notifications
13. E2E-Tests
