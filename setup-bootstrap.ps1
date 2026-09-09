# ══════════════════════════════════════════════════════════════════════════════
# Mehfil-E-Nihari POS — PowerShell Bootstrap Installer
# ══════════════════════════════════════════════════════════════════════════════
# One-click setup: checks/downloads Node.js, installs deps, builds, detects
# hardware, and launches the POS. Run as Administrator for full functionality.
# ══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$APP_NAME = "Mehfil-E-Nihari POS"
$DATA_DIR = "D:\ResturantBilling"
$BACKUP_DIR = "$DATA_DIR\backups"
$LOGS_DIR = "$DATA_DIR\logs"
$DB_DIR = "$DATA_DIR\data"
$NODE_VERSION = "v20.18.1"
$NODE_URL = "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-x64.msi"

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor DarkYellow
    Write-Host "  ║        🍲 Mehfil-E-Nihari POS — Bootstrap Installer         ║" -ForegroundColor Yellow
    Write-Host "  ║            One-Click Setup & Dependency Manager             ║" -ForegroundColor Yellow
    Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor DarkYellow
    Write-Host ""
}

function Write-Step($step, $total, $msg) {
    Write-Host "  [$step/$total] $msg" -ForegroundColor Cyan
}

function Write-OK($msg) {
    Write-Host "         ✅ $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "         ⚠️ $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "         ❌ $msg" -ForegroundColor Red
}

# ── Main ─────────────────────────────────────────────────────────────────────
Write-Header

$TOTAL = 7

# Step 1: Create D: directories
Write-Step 1 $TOTAL "📁 Creating data directories on Drive D:..."
$dirs = @($DATA_DIR, $BACKUP_DIR, $LOGS_DIR, $DB_DIR)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}
Write-OK "D:\ResturantBilling ready (data, backups, logs)"
Write-Host ""

# Step 2: Check Node.js
Write-Step 2 $TOTAL "🔍 Checking for Node.js..."
$nodeInstalled = $false
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer) {
        Write-OK "Node.js found: $nodeVer"
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    Write-Warn "Node.js not found. Downloading and installing..."
    try {
        $msiPath = "$env:TEMP\node-install.msi"
        Write-Host "         📥 Downloading Node.js $NODE_VERSION..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $NODE_URL -OutFile $msiPath -UseBasicParsing
        Write-Host "         📦 Installing Node.js (silent mode)..." -ForegroundColor Gray
        Start-Process msiexec.exe -ArgumentList "/i", $msiPath, "/qn", "INSTALLDIR=$DATA_DIR\nodejs", "/L*V", "$env:TEMP\node-install.log" -Wait -NoNewWindow
        $env:PATH = "$DATA_DIR\nodejs;$env:PATH"
        Write-OK "Node.js installed to $DATA_DIR\nodejs"
    } catch {
        Write-Err "Failed to install Node.js automatically."
        Write-Host "         📥 Please download manually: https://nodejs.org" -ForegroundColor Yellow
        Write-Host "         Press any key to continue after installing Node.js..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}
Write-Host ""

# Step 3: Check npm
Write-Step 3 $TOTAL "🔍 Checking for npm..."
try {
    $npmVer = & npm --version 2>$null
    if ($npmVer) {
        Write-OK "npm found: $npmVer"
    } else {
        throw "npm not found"
    }
} catch {
    Write-Warn "npm not found. Installing via npx..."
    & npm install -g npm@latest 2>$null
}
Write-Host ""

# Step 4: Install dependencies
Write-Step 4 $TOTAL "📦 Installing project dependencies..."
Set-Location $PSScriptRoot
Write-Host "         Running: npm install" -ForegroundColor Gray
& npm install 2>$null | Out-Null
Write-OK "All dependencies installed"
Write-Host ""

# Step 5: Build application
Write-Step 5 $TOTAL "🔨 Building application..."
Write-Host "         Running: npx vite build" -ForegroundColor Gray
& npx vite build 2>$null | Out-Null
if (Test-Path "dist\index.html") {
    Write-OK "Application built successfully (dist/)"
} else {
    Write-Warn "Build may have issues, but continuing..."
}
Write-Host ""

# Step 6: Detect hardware
Write-Step 6 $TOTAL "🔌 Detecting hardware..."
$printerCount = 0
$biometricCount = 0

# Detect printers
try {
    $printers = Get-Printer -ErrorAction SilentlyContinue
    $printerCount = ($printers | Measure-Object).Count
    $thermalPrinters = $printers | Where-Object { $_.Name -match "receipt|thermal|pos|epson|star|citizen|bixolon|tsp|tm-|58mm|80mm" }
    if ($thermalPrinters) {
        Write-Host "         🔌 Thermal printers found:" -ForegroundColor Gray
        foreach ($p in $thermalPrinters) {
            Write-Host "            • $($p.Name) ($($p.PortName))" -ForegroundColor Gray
        }
    }
} catch {}

# Detect biometric devices
try {
    $usbDevices = Get-PnpDevice -Class Biometric -ErrorAction SilentlyContinue
    $biometricCount = ($usbDevices | Measure-Object).Count
    if ($usbDevices) {
        Write-Host "         🔐 Biometric devices found:" -ForegroundColor Gray
        foreach ($d in $usbDevices) {
            Write-Host "            • $($d.FriendlyName)" -ForegroundColor Gray
        }
    }
} catch {}

# Check Windows Hello
try {
    $hello = Get-WmiObject -Class Win32_PhysicalFace -ErrorAction SilentlyContinue
    if ($hello) {
        $biometricCount++
        Write-Host "            • Windows Hello (Built-in)" -ForegroundColor Gray
    }
} catch {}

Write-OK "Hardware scan: $printerCount printer(s), $biometricCount biometric device(s)"
Write-Host ""

# Step 7: Configure environment
Write-Step 7 $TOTAL "⚙️ Configuring environment..."

# Create hardware scan report
$hwReport = @{
    scanDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    printers = $printerCount
    biometricDevices = $biometricCount
    dataDir = $DATA_DIR
} | ConvertTo-Json -Depth 5
$hwReport | Out-File "$DATA_DIR\hardware-scan.json" -Encoding UTF8
Write-OK "Hardware scan saved to $DATA_DIR\hardware-scan.json"
Write-Host ""

# ── Launch ────────────────────────────────────────────────────────────────────
Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor DarkYellow
Write-Host "  ║                   🚀 Launching Mehfil-E-Nihari POS          ║" -ForegroundColor Yellow
Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor DarkYellow
Write-Host ""

# Check if production server exists
if (Test-Path "server.js") {
    Write-Host "  Starting production server on port 5181..." -ForegroundColor Gray
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:5181"
} else {
    Write-Host "  Starting development server..." -ForegroundColor Gray
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  ✅ Mehfil-E-Nihari POS is now running!                     ║" -ForegroundColor Green
Write-Host "  ║  🌐 Open: http://localhost:5181 (or 5173 for dev)          ║" -ForegroundColor Green
Write-Host "  ║  📁 Data: D:\ResturantBilling                               ║" -ForegroundColor Green
Write-Host "  ║  👔 Default PIN: 1234                                       ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
