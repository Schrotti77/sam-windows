<#
.SYNOPSIS
    SAM - Software Asset Management - Windows Server 2019 Installation Script
.DESCRIPTION
    Fully automated installation routine for SAM on Windows Server 2019.
    Downloads latest release from GitHub, installs Node.js (if needed),
    npm dependencies, creates SQLite database, seeds test data, builds
    app, configures firewall, and optionally registers as Windows
    Service via NSSM.

    Default install location: C:\SAM
.NOTES
    Version: 4.5.2
    Requires: PowerShell 5.1+ (Windows Server 2019 default)
    Run as: Administrator
    All commands run inline with iex for better error handling
    Installationslog: C:\SAM\logs\install.log
#>

[CmdletBinding()]
param(
    [switch]$SkipNodeCheck,
    [switch]$SkipFirewall,
    [switch]$SetupService,
    [string]$InstallDir = "C:\SAM",
    [string]$Port = "3000",
    [switch]$Update
)

# Note: We do NOT set $ErrorActionPreference = "Stop" globally.
# PowerShell 5.1 treats native stderr output (npm warnings, etc.)
# as ErrorRecord objects with "Stop" preference, causing immediate abort
# even when commands succeed. We rely on $LASTEXITCODE instead.
$ProgressPreference = "SilentlyContinue"

$RepoOwner = "schrotti77"
$RepoName = "sam-windows"
$Branch    = "main"
$RepoUrl   = "https://github.com/$RepoOwner/$RepoName/archive/refs/heads/$Branch.zip"
$ZipFile   = Join-Path $env:TEMP "sam-latest.zip"
$ExtractDir = Join-Path $env:TEMP "sam-extract"
$logDir    = Join-Path $InstallDir "logs"
$logFile   = Join-Path $logDir "install.log"

# ─── Logging Functions ─────────────────────────────────────
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logFilePath = Join-Path $logDir "install.log"
    Add-Content -Path $logFilePath -Value "[$timestamp] $Message" -Encoding UTF8
}

function Log-Step {
    param([int]$Step, [int]$Total, [string]$Text)
    Write-Host ""
    Write-Host "[$Step/$Total] $Text" -ForegroundColor Yellow
    Write-Log "[$Step/$Total] $Text"
}

function Log-Ok {
    param([string]$Text = "OK")
    Write-Host "  $Text" -ForegroundColor Green
    Write-Log "OK: $Text"
}

function Log-Err {
    param([string]$Text)
    Write-Host "  ERROR: $Text" -ForegroundColor Red
    Write-Log "ERROR: $Text"
}

function Log-Info {
    param([string]$Text)
    Write-Host "  $Text" -ForegroundColor Gray
    Write-Log "INFO: $Text"
}

function Log-Warn {
    param([string]$Text)
    Write-Host "  WARN: $Text" -ForegroundColor Yellow
    Write-Log "WARN: $Text"
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# ─── Logging to TEMP first, move to C:\SAM\logs after extract ─────
# Avoids creating C:\SAM before Step 3 checks if it already exists.
$tempLogDir = Join-Path $env:TEMP "sam-install-logs"
New-Item -ItemType Directory -Path $tempLogDir -Force | Out-Null
$logDir = $tempLogDir

# ─── Banner ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  SAM v4.5 - Software Asset Management" -ForegroundColor Cyan
Write-Host "  Windows Server 2019 - Auto-Installer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Log "=== Installation started ==="
Write-Log "InstallDir: $InstallDir"
Write-Log "LogFile: $logFile"

# ─── Check Administrator ─────────────────────────────────────────
Log-Step 0 12 "Checking permissions..."
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Log-Err "This script must be run as Administrator!"
    Write-Info "Right-click PowerShell -> 'Run as Administrator'"
    exit 1
}
Log-Ok "Running as Administrator"

# ─── Step 1: PowerShell version ───────────────────────────────────
Log-Step 1 12 "Checking PowerShell version..."
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -lt 5) {
    Log-Err "PowerShell 5.0+ required. Current: $psVersion"
    exit 1
}
Log-Ok "PowerShell $psVersion"

# ─── Step 2: Node.js ──────────────────────────────────────────────
Log-Step 2 12 "Checking Node.js..."
if (-not $SkipNodeCheck) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeVersion = node --version 2>&1
        $nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
        if ($nodeMajor -ge 18) {
            Log-Ok "Node.js $nodeVersion"
        } else {
            Log-Warn "Node.js $nodeVersion found but 18+ recommended. Upgrading..."
            $upgradeNode = $true
        }
    } else {
        $upgradeNode = $true
    }

    if ($upgradeNode) {
        Log-Info "Downloading Node.js 20 LTS..."
        $nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        $nodeMsi = Join-Path $env:TEMP "node-installer.msi"

        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
            Log-Info "Installing Node.js..."
            Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
            $nodeVersion = node --version 2>&1
            Log-Ok "Node.js $nodeVersion installed"
        } catch {
            Log-Err "Failed to install Node.js: $_"
            Log-Info "Install manually: https://nodejs.org"
            exit 1
        }
    }

    if (-not (Test-Command npm)) {
        Log-Err "npm not found after Node.js install"
        exit 1
    }
    $npmVersion = npm --version 2>&1
    Log-Ok "npm $npmVersion"
} else {
    Log-Info "SKIPPED"
}

# ─── Step 3: Download latest SAM from GitHub ─────────────────────
Log-Step 3 12 "Downloading SAM from GitHub..."

if ($Update) {
    Log-Info "Update mode - downloading latest version..."
}

# Cleanup old temp files
Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
Remove-Item $ExtractDir -Force -Recurse -ErrorAction SilentlyContinue

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    # Check if running from C:\SAM (self-update) or fresh install
    $runningFromInstall = ($PWD.Path -eq $InstallDir) -or (Test-Path "$InstallDir\install.ps1")

    if ($runningFromInstall -and -not $Update) {
        Log-Info "Already in install directory. Skipping download."
        Log-Info "Use -Update to download latest version."
    } else {
        Log-Info "URL: $RepoUrl"
        Invoke-WebRequest -Uri $RepoUrl -OutFile $ZipFile -UseBasicParsing

        if (-not (Test-Path $ZipFile)) {
            Log-Err "Download failed"
            exit 1
        }

        $zipSize = (Get-Item $ZipFile).Length / 1KB
        Log-Ok "Downloaded ($([math]::Round($zipSize, 1)) KB)"

        # Extract
        Log-Info "Extracting..."
        Expand-Archive -Path $ZipFile -DestinationPath $ExtractDir -Force

        # Find extracted folder (GitHub zip creates sam-windows-main/ folder)
        $extractedFolder = Get-ChildItem $ExtractDir -Directory | Select-Object -First 1
        if (-not $extractedFolder) {
            Log-Err "Extraction failed - no folder found"
            exit 1
        }

        # Create/prepare install directory
        if (Test-Path $InstallDir) {
            if ($Update) {
                Log-Info "Updating existing installation at $InstallDir..."
                # Backup .env and database
                $backupDir = Join-Path $env:TEMP "sam-backup-$(Get-Random)"
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
                if (Test-Path "$InstallDir\.env") { Copy-Item "$InstallDir\.env" $backupDir -Force }
                if (Test-Path "$InstallDir\data\sam.db") { Copy-Item "$InstallDir\data\sam.db" $backupDir -Force }

                # Copy new files over existing (preserving node_modules, .next, data)
                Copy-Item "$($extractedFolder.FullName)\*" $InstallDir -Recurse -Force -Exclude "node_modules",".next","data"

                # Restore backup
                if (Test-Path "$backupDir\.env") { Copy-Item "$backupDir\.env" $InstallDir -Force }
                if (Test-Path "$backupDir\sam.db") {
                    New-Item -ItemType Directory -Path "$InstallDir\data" -Force | Out-Null
                    Copy-Item "$backupDir\sam.db" "$InstallDir\data" -Force
                }
                Remove-Item $backupDir -Recurse -Force -ErrorAction SilentlyContinue
            } else {
                Log-Err "Install directory already exists: $InstallDir"
                Log-Info "Use -Update to update an existing installation"
                exit 1
            }
        } else {
            Log-Info "Creating $InstallDir..."
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
            Copy-Item "$($extractedFolder.FullName)\*" $InstallDir -Recurse -Force
        }

        Log-Ok "Files extracted to $InstallDir"
    }

    # Cleanup temp files
    Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
    Remove-Item $ExtractDir -Force -Recurse -ErrorAction SilentlyContinue

} catch {
    Log-Err "Download/extract failed: $_"
    Log-Info "Download manually: $RepoUrl"
    exit 1
}

# ─── Move log from TEMP to C:\SAM\logs (after install dir confirmed) ──
$finalLogDir = Join-Path $InstallDir "logs"
New-Item -ItemType Directory -Path $finalLogDir -Force | Out-Null
$tempLogFile = Join-Path $tempLogDir "install.log"
$finalLogFile = Join-Path $finalLogDir "install.log"
if (Test-Path $tempLogFile) {
    Copy-Item $tempLogFile $finalLogFile -Force
    Remove-Item $tempLogDir -Recurse -Force -ErrorAction SilentlyContinue
}
$logDir = $finalLogDir

# ─── Change to install directory ─────────────────────────────────
Set-Location $InstallDir
Log-Info "Working directory: $PWD"

# ─── Step 4: Data directory ───────────────────────────────────────
Log-Step 4 12 "Setting up data directory..."
$dataDir = Join-Path $InstallDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}
Log-Ok "Data directory: $dataDir"

# ─── Step 5: .env file ───────────────────────────────────────────
Log-Step 5 12 "Configuring environment..."

$envFile = Join-Path $InstallDir ".env"
$needsEnvUpdate = $true

# Preserve existing .env on update
if ((Test-Path $envFile) -and $Update) {
    Log-Info "Preserving existing .env configuration"
    $needsEnvUpdate = $false
}

if ($needsEnvUpdate) {
    # Generate secure NEXTAUTH_SECRET
    $secretBytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($secretBytes)
    $authSecret = [BitConverter]::ToString($secretBytes).Replace("-", "").ToLower()

    # SQLite absolute path (forward slashes for Prisma)
    $installDirForward = $InstallDir -replace '\\', '/'
    $dbPath = "file:$installDirForward/data/sam.db"

    $envContent = @"
# SAM - Software Asset Management v4.5
# Generated by install.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# SQLite Database
DATABASE_URL="$dbPath"

# NextAuth
NEXTAUTH_SECRET="$authSecret"

# Application URL
NEXTAUTH_URL="http://localhost:$Port"
"@
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Log-Ok ".env created with secure NEXTAUTH_SECRET"
} else {
    Log-Ok ".env preserved"
}
Log-Info "Database: $dataDir\sam.db"

# ─── Step 6: npm install ─────────────────────────────────────────
Log-Step 6 12 "Installing dependencies..."
if (-not $Update -or -not (Test-Path "node_modules")) {
    & npm install --legacy-peer-deps 2>&1 | ForEach-Object { Log-Info $_.ToString() }
    if ($LASTEXITCODE -ne 0) {
        Log-Err "npm install failed (exit code $LASTEXITCODE)"
        exit 1
    }
    Log-Ok "Dependencies installed"

    # React patch
    if (Test-Path "scripts/patch-react.js") {
        node scripts/patch-react.js 2>$null
    }
} else {
    Log-Info "SKIPPED (node_modules exists)"
}

# ─── Step 7: Prisma generate ──────────────────────────────────────
Log-Step 7 12 "Generating Prisma client..."
& npx prisma generate 2>&1 | ForEach-Object { Log-Info $_.ToString() }
if ($LASTEXITCODE -ne 0) {
    Log-Err "Prisma generate failed (exit code $LASTEXITCODE)"
    exit 1
}
Log-Ok "Prisma client generated"

# ─── Step 8: Create database ─────────────────────────────────────
Log-Step 8 12 "Creating SQLite database..."
& npx prisma db push 2>&1 | ForEach-Object { Log-Info $_.ToString() }
if ($LASTEXITCODE -ne 0) {
    Log-Err "Database creation failed (exit code $LASTEXITCODE)"
    exit 1
}
Log-Ok "Database created"

# ─── Step 9: Seed database ────────────────────────────────────────
Log-Step 9 12 "Seeding test data..."
if (Test-Path "scripts/seed.js") {
    if (-not (Test-Path "$dataDir\sam.db") -or (Get-Item "$dataDir\sam.db").Length -lt 1024) {
        & node scripts/seed.js 2>&1 | ForEach-Object { Log-Info $_.ToString() }
        if ($LASTEXITCODE -ne 0) { Log-Warn "Seeding had warnings, continuing..." }
        else { Log-Ok "Database seeded" }
    } else {
        Log-Info "Database already has data, skipping seed"
    }
}

# ─── Step 10: Build ───────────────────────────────────────────────
Log-Step 10 12 "Building application..."
& npm run build 2>&1 | ForEach-Object { Log-Info $_.ToString() }
if ($LASTEXITCODE -ne 0) {
    Log-Err "Build failed (exit code $LASTEXITCODE)"
    exit 1
}
Log-Ok "Build complete"

# ─── Step 11: Firewall ────────────────────────────────────────────
Log-Step 11 12 "Configuring Windows Firewall..."
if (-not $SkipFirewall) {
    try {
        $ruleName = "SAM - Software Asset Management (Port $Port)"
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName $ruleName `
            -Direction Inbound -Protocol TCP -LocalPort $Port `
            -Action Allow -Profile Domain,Private `
            -Description "Allow HTTP access to SAM on port $Port" | Out-Null
        Log-Ok "Firewall rule created for port $Port"
    } catch {
        Log-Warn "WARN: Could not set firewall rule: $_"
    }
} else {
    Log-Info "SKIPPED"
}

# ─── Step 12: Windows Service (optional) ─────────────────────────
if ($SetupService) {
    Log-Step 12 12 "Setting up Windows Service (NSSM)..."

    $nssmExe = "C:\Windows\nssm.exe"
    $serviceName = "SAM"

    if (-not (Test-Path $nssmExe)) {
        Log-Info "Downloading NSSM..."
        try {
            $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
            $nssmZip = Join-Path $env:TEMP "nssm.zip"
            $nssmExtract = Join-Path $env:TEMP "nssm-extract"

            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
            Expand-Archive -Path $nssmZip -DestinationPath $nssmExtract -Force

            $nssmBin = Get-ChildItem $nssmExtract -Recurse -Filter "nssm.exe" |
                Where-Object { $_.FullName -match "win64" } | Select-Object -First 1

            if ($nssmBin) {
                Copy-Item $nssmBin.FullName -Destination $nssmExe -Force
                Log-Ok "NSSM installed"
            } else {
                Log-Warn "WARN: Could not find nssm.exe in archive"
            }
            Remove-Item $nssmZip -Force -ErrorAction SilentlyContinue
            Remove-Item $nssmExtract -Force -Recurse -ErrorAction SilentlyContinue
        } catch {
            Log-Warn "WARN: NSSM download failed: $_"
        }
    }

    if (Test-Path $nssmExe) {
        $nodeExe = (Get-Command node).Source

        # Remove existing service
        nssm stop $serviceName 2>&1 | Out-Null
        nssm remove $serviceName confirm 2>&1 | Out-Null

        # Install service
        nssm install $serviceName $nodeExe "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" "start" "--prefix" $InstallDir 2>&1 | Out-Null
        nssm set $serviceName AppDirectory $InstallDir 2>&1 | Out-Null
        nssm set $serviceName DisplayName "SAM - Software Asset Management" 2>&1 | Out-Null
        nssm set $serviceName Description "Software Asset Management web application" 2>&1 | Out-Null
        nssm set $serviceName Start SERVICE_AUTO_START 2>&1 | Out-Null

        # Logs
        $logsDir = Join-Path $InstallDir "logs"
        if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }
        nssm set $serviceName AppStdout "$logsDir\service-stdout.log" 2>&1 | Out-Null
        nssm set $serviceName AppStderr "$logsDir\service-stderr.log" 2>&1 | Out-Null

        Log-Ok "Windows Service '$serviceName' registered"
        Log-Info "Start: net start $serviceName"
        Log-Info "Stop: net stop $serviceName"
    }
} else {
    Write-Host ""
}

# ─── Done ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Location:   $InstallDir" -ForegroundColor White
Write-Host "  Access:     http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Login:      john@doe.com / johndoe123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Commands:" -ForegroundColor White
Write-Host "    cd $InstallDir" -ForegroundColor Gray
Write-Host "    .\start.ps1            Start app (production)" -ForegroundColor Gray
Write-Host "    .\start.ps1 -Dev       Start app (development)" -ForegroundColor Gray
Write-Host "    .\stop.ps1             Stop app" -ForegroundColor Gray
Write-Host ""
Write-Log "=== Installation complete ==="
Write-Host ""

if (-not $SetupService) {
    Write-Host "  Optional:" -ForegroundColor Yellow
    Write-Host "    .\install.ps1 -SetupService    Install as Windows Service" -ForegroundColor Gray
    Write-Host ""
}

if ($Update) {
    Write-Host "  Updated successfully!" -ForegroundColor Green
    Write-Host "  Run .\start.ps1 to restart." -ForegroundColor Gray
    Write-Host ""
}
