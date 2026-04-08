<#
.SYNOPSIS
    SAM - Software Asset Management - Windows Server 2019 Installation Script
.DESCRIPTION
    Fully automated installation routine for SAM on Windows Server 2019.
    Downloads latest release from GitHub, installs Node.js (if needed),
    npm dependencies, creates SQLite database, seeds test data, builds
    the app, configures firewall, and optionally registers as Windows
    Service via NSSM.

    Default install location: C:\SAM
.NOTES
    Version: 4.5.1
    Requires: PowerShell 5.1+ (Windows Server 2019 default)
    Run as: Administrator
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

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoOwner = "schrotti77"
$RepoName  = "sam-windows"
$Branch    = "main"
$RepoUrl   = "https://github.com/$RepoOwner/$RepoName/archive/refs/heads/$Branch.zip"
$ZipFile   = Join-Path $env:TEMP "sam-latest.zip"
$ExtractDir = Join-Path $env:TEMP "sam-extract"

function Write-Step {
    param([int]$Step, [int]$Total, [string]$Text)
    Write-Host ""
    Write-Host "[$Step/$Total] $Text" -ForegroundColor Yellow
}

function Write-Ok {
    param([string]$Text = "OK")
    Write-Host "  $Text" -ForegroundColor Green
}

function Write-Err {
    param([string]$Text)
    Write-Host "  ERROR: $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "  $Text" -ForegroundColor Gray
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Retry {
    param(
        [scriptblock]$Block,
        [int]$MaxRetries = 3,
        [string]$Name = "command"
    )
    $attempt = 0
    while ($attempt -lt $MaxRetries) {
        $attempt++
        try {
            & $Block
            return $true
        } catch {
            if ($attempt -lt $MaxRetries) {
                Write-Info "Retry $attempt/$MaxRetries for $Name..."
                Start-Sleep -Seconds 3
            } else {
                throw
            }
        }
    }
    return $false
}

# ─── Banner ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  SAM v4.5 - Software Asset Management" -ForegroundColor Cyan
Write-Host "  Windows Server 2019 - Auto-Installer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Check Administrator ─────────────────────────────────────────
Write-Step 0 12 "Checking permissions..."
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Err "This script must be run as Administrator!"
    Write-Info "Right-click PowerShell -> 'Run as Administrator'"
    exit 1
}
Write-Ok "Running as Administrator"

# ─── Step 1: PowerShell version ───────────────────────────────────
Write-Step 1 12 "Checking PowerShell version..."
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -lt 5) {
    Write-Err "PowerShell 5.0+ required. Current: $psVersion"
    exit 1
}
Write-Ok "PowerShell $psVersion"

# ─── Step 2: Node.js ──────────────────────────────────────────────
Write-Step 2 12 "Checking Node.js..."
if (-not $SkipNodeCheck) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeVersion = & node --version 2>$null
        $nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
        if ($nodeMajor -ge 18) {
            Write-Ok "Node.js $nodeVersion"
        } else {
            Write-Info "Node.js $nodeVersion found but 18+ recommended. Upgrading..."
            $upgradeNode = $true
        }
    } else {
        $upgradeNode = $true
    }

    if ($upgradeNode) {
        Write-Info "Downloading Node.js 20 LTS..."
        $nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        $nodeMsi = Join-Path $env:TEMP "node-installer.msi"

        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
            Write-Info "Installing Node.js..."
            Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
            $nodeVersion = & node --version 2>$null
            Write-Ok "Node.js $nodeVersion installed"
        } catch {
            Write-Err "Failed to install Node.js: $_"
            Write-Info "Install manually: https://nodejs.org"
            exit 1
        }
    }

    if (-not (Test-Command npm)) {
        Write-Err "npm not found after Node.js install"
        exit 1
    }
    $npmVersion = & npm --version 2>$null
    Write-Ok "npm $npmVersion"
} else {
    Write-Info "SKIPPED"
}

# ─── Step 3: Download latest SAM from GitHub ─────────────────────
Write-Step 3 12 "Downloading SAM from GitHub..."

if ($Update) {
    Write-Info "Update mode - downloading latest version..."
}

# Cleanup old temp files
Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
Remove-Item $ExtractDir -Force -Recurse -ErrorAction SilentlyContinue

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    # Check if running from C:\SAM (self-update) or fresh install
    $runningFromInstall = ($PWD.Path -eq $InstallDir) -or (Test-Path "$InstallDir\install.ps1")

    if ($runningFromInstall -and -not $Update) {
        Write-Info "Already in install directory. Skipping download."
        Write-Info "Use -Update to download the latest version."
    } else {
        Write-Info "URL: $RepoUrl"
        Invoke-Retry -MaxRetries 3 -Name "Download SAM" -Block {
            Invoke-WebRequest -Uri $RepoUrl -OutFile $ZipFile -UseBasicParsing
        }

        if (-not (Test-Path $ZipFile)) {
            Write-Err "Download failed"
            exit 1
        }

        $zipSize = (Get-Item $ZipFile).Length / 1KB
        Write-Ok "Downloaded ($([math]::Round($zipSize, 1)) KB)"

        # Extract
        Write-Info "Extracting..."
        Expand-Archive -Path $ZipFile -DestinationPath $ExtractDir -Force

        # Find extracted folder (GitHub zip creates sam-windows-main/ folder)
        $extractedFolder = Get-ChildItem $ExtractDir -Directory | Select-Object -First 1
        if (-not $extractedFolder) {
            Write-Err "Extraction failed - no folder found"
            exit 1
        }

        # Create/prepare install directory
        if (Test-Path $InstallDir) {
            if ($Update) {
                Write-Info "Updating existing installation at $InstallDir..."
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
                Write-Err "Install directory already exists: $InstallDir"
                Write-Info "Use -Update to update an existing installation"
                exit 1
            }
        } else {
            Write-Info "Creating $InstallDir..."
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
            Copy-Item "$($extractedFolder.FullName)\*" $InstallDir -Recurse -Force
        }

        Write-Ok "Files extracted to $InstallDir"
    }

    # Cleanup temp files
    Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
    Remove-Item $ExtractDir -Force -Recurse -ErrorAction SilentlyContinue

} catch {
    Write-Err "Download/extract failed: $_"
    Write-Info "Download manually: $RepoUrl"
    exit 1
}

# ─── Change to install directory ─────────────────────────────────
Set-Location $InstallDir
Write-Info "Working directory: $PWD"

# ─── Step 4: Data directory ───────────────────────────────────────
Write-Step 4 12 "Setting up data directory..."
$dataDir = Join-Path $InstallDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}
Write-Ok "Data directory: $dataDir"

# ─── Step 5: .env file ───────────────────────────────────────────
Write-Step 5 12 "Configuring environment..."

$envFile = Join-Path $InstallDir ".env"
$needsEnvUpdate = $true

# Preserve existing .env on update
if ((Test-Path $envFile) -and $Update) {
    Write-Info "Preserving existing .env configuration"
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
    Write-Ok ".env created with secure NEXTAUTH_SECRET"
} else {
    Write-Ok ".env preserved"
}
Write-Info "Database: $dataDir\sam.db"

# ─── Step 6: npm install ─────────────────────────────────────────
Write-Step 6 12 "Installing dependencies..."
if (-not $Update -or -not (Test-Path "node_modules")) {
    try {
        & npm install --legacy-peer-deps 2>&1 | ForEach-Object { Write-Info $_ }
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
        Write-Ok "Dependencies installed"
    } catch {
        Write-Err "npm install failed: $_"
        exit 1
    }

    # React patch
    if (Test-Path "scripts/patch-react.js") {
        & node scripts/patch-react.js 2>$null
    }
} else {
    Write-Info "SKIPPED (node_modules exists)"
}

# ─── Step 7: Prisma generate ──────────────────────────────────────
Write-Step 7 12 "Generating Prisma client..."
try {
    & npx prisma generate 2>&1 | ForEach-Object { Write-Info $_ }
    if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }
    Write-Ok "Prisma client generated"
} catch {
    Write-Err "Prisma generate failed: $_"
    exit 1
}

# ─── Step 8: Create database ─────────────────────────────────────
Write-Step 8 12 "Creating SQLite database..."
try {
    & npx prisma db push 2>&1 | ForEach-Object { Write-Info $_ }
    if ($LASTEXITCODE -ne 0) { throw "db push failed" }
    Write-Ok "Database created"
} catch {
    Write-Err "Database creation failed: $_"
    exit 1
}

# ─── Step 9: Seed database ────────────────────────────────────────
Write-Step 9 12 "Seeding test data..."
if (Test-Path "scripts/seed.js") {
    if (-not (Test-Path "$dataDir\sam.db") -or (Get-Item "$dataDir\sam.db").Length -lt 1024) {
        try {
            & node scripts/seed.js 2>&1 | ForEach-Object { Write-Info $_ }
            if ($LASTEXITCODE -ne 0) { Write-Info "Seeding had warnings, continuing..." }
            else { Write-Ok "Database seeded" }
        } catch {
            Write-Info "WARN: Seeding failed (non-fatal): $_"
        }
    } else {
        Write-Info "Database already has data, skipping seed"
    }
}

# ─── Step 10: Build ───────────────────────────────────────────────
Write-Step 10 12 "Building application..."
try {
    & npm run build 2>&1 | ForEach-Object { Write-Info $_ }
    if ($LASTEXITCODE -ne 0) { throw "build failed" }
    Write-Ok "Build complete"
} catch {
    Write-Err "Build failed: $_"
    exit 1
}

# ─── Step 11: Firewall ────────────────────────────────────────────
Write-Step 11 12 "Configuring Windows Firewall..."
if (-not $SkipFirewall) {
    try {
        $ruleName = "SAM - Software Asset Management (Port $Port)"
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName $ruleName `
            -Direction Inbound -Protocol TCP -LocalPort $Port `
            -Action Allow -Profile Domain,Private `
            -Description "Allow HTTP access to SAM on port $Port" | Out-Null
        Write-Ok "Firewall rule created for port $Port"
    } catch {
        Write-Info "WARN: Could not set firewall rule: $_"
    }
} else {
    Write-Info "SKIPPED"
}

# ─── Step 12: Windows Service (optional) ─────────────────────────
if ($SetupService) {
    Write-Step 12 12 "Setting up Windows Service (NSSM)..."

    $nssmExe = "C:\Windows\nssm.exe"
    $serviceName = "SAM"

    if (-not (Test-Path $nssmExe)) {
        Write-Info "Downloading NSSM..."
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
                Write-Ok "NSSM installed"
            } else {
                Write-Info "WARN: Could not find nssm.exe in archive"
            }
            Remove-Item $nssmZip -Force -ErrorAction SilentlyContinue
            Remove-Item $nssmExtract -Force -Recurse -ErrorAction SilentlyContinue
        } catch {
            Write-Info "WARN: NSSM download failed: $_"
        }
    }

    if (Test-Path $nssmExe) {
        $nodeExe = (Get-Command node).Source

        # Remove existing service
        & $nssmExe stop $serviceName 2>$null
        & $nssmExe remove $serviceName confirm 2>$null

        # Install service
        & $nssmExe install $serviceName $nodeExe "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" "start" "--prefix" $InstallDir
        & $nssmExe set $serviceName AppDirectory $InstallDir
        & $nssmExe set $serviceName DisplayName "SAM - Software Asset Management"
        & $nssmExe set $serviceName Description "Software Asset Management web application"
        & $nssmExe set $serviceName Start SERVICE_AUTO_START

        # Logs
        $logsDir = Join-Path $InstallDir "logs"
        if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }
        & $nssmExe set $serviceName AppStdout "$logsDir\service-stdout.log"
        & $nssmExe set $serviceName AppStderr "$logsDir\service-stderr.log"

        Write-Ok "Windows Service '$serviceName' registered"
        Write-Info "Start: net start $serviceName"
        Write-Info "Stop:  net stop $serviceName"
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
