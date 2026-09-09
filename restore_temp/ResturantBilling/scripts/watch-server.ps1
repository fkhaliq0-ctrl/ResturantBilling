# ══════════════════════════════════════════════════════════════════════════════
# Mehfil-E-Nihari POS — Vite Dev Server Watcher
# ══════════════════════════════════════════════════════════════════════════════
# Keeps the Vite dev server alive. If it crashes or stops responding,
# this script automatically restarts it.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/watch-server.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/watch-server.ps1 -Port 5180
#   powershell -ExecutionPolicy Bypass -File scripts/watch-server.ps1 -Background
#
# Stop: Close the terminal, or press Ctrl+C, or run: taskkill /F /IM node.exe
# ══════════════════════════════════════════════════════════════════════════════

param(
    [int]$Port = 5180,
    [int]$HealthCheckInterval = 10,    # Seconds between health checks
    [int]$MaxFailures = 3,             # Consecutive failures before forced restart
    [int]$RestartDelay = 2,            # Seconds to wait before restarting
    [switch]$Background                # Run silently in background
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $PSScriptRoot) { $ProjectRoot = "E:\ResturantBilling" }
$LogFile = Join-Path $ProjectRoot "logs\watcher.log"
$PidFile = Join-Path $ProjectRoot "logs\vite.pid"

# ── Helpers ──────────────────────────────────────────────────────────────────

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    
    # Always write to file
    $logDir = Split-Path $LogFile -Parent
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $logLine -Encoding UTF8
    
    # Write to console (unless silent background mode)
    if (-not $Background) {
        switch ($Level) {
            "ERROR" { Write-Host $logLine -ForegroundColor Red }
            "WARN"  { Write-Host $logLine -ForegroundColor Yellow }
            "OK"    { Write-Host $logLine -ForegroundColor Green }
            default { Write-Host $logLine -ForegroundColor Gray }
        }
    }
}

function Test-ServerAlive {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Get-ViteProcess {
    # Find the Vite process running on our port
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq "node") {
                return $proc
            }
        }
    }
    return $null
}

function Start-ViteServer {
    Write-Log "Starting Vite dev server on port $Port..." "INFO"
    
    Push-Location $ProjectRoot
    
    # Start Vite via npm
    $proc = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory $ProjectRoot `
        -WindowStyle Hidden `
        -PassThru
    
    # Save PID
    $proc.Id | Out-File -FilePath $PidFile -Encoding UTF8
    
    Pop-Location
    
    # Wait for server to be ready
    $waited = 0
    $maxWait = 30
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        if (Test-ServerAlive) {
            Write-Log "Vite server is ready on http://localhost:$Port (PID: $($proc.Id))" "OK"
            return $proc
        }
    }
    
    Write-Log "Server did not respond within ${maxWait}s — may still be starting" "WARN"
    return $proc
}

function Stop-ViteServer {
    $proc = Get-ViteProcess
    if ($proc) {
        Write-Log "Stopping Vite server (PID: $($proc.Id))..." "INFO"
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        } catch {
            Write-Log "Failed to stop process: $_" "WARN"
        }
    }
    
    # Also kill anything on the port
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Clean up PID file
    if (Test-Path $PidFile) { Remove-Item $PidFile -Force }
}

# ── Main Watcher Loop ────────────────────────────────────────────────────────

Write-Log "═══════════════════════════════════════════════════════" "INFO"
Write-Log "Mehfil-E-Nihari POS — Vite Watcher Starting" "INFO"
Write-Log "Port: $Port | Health check: ${HealthCheckInterval}s | Max failures: $MaxFailures" "INFO"
Write-Log "═══════════════════════════════════════════════════════" "INFO"

# Kill any existing server on the port
$existing = Get-ViteProcess
if ($existing) {
    Write-Log "Found existing server (PID: $($existing.Id)) — restarting fresh" "WARN"
    Stop-ViteServer
    Start-Sleep -Seconds 1
}

# Start the server
$currentProcess = Start-ViteServer
$consecutiveFailures = 0
$restartCount = 0

# Register cleanup on exit
$cleanup = {
    Write-Log "Watcher shutting down..." "INFO"
    # Don't kill the server — let it survive
}

try {
    # ── Watch Loop ──────────────────────────────────────────
    while ($true) {
        Start-Sleep -Seconds $HealthCheckInterval
        
        # Check if our tracked process is still running
        $proc = Get-ViteProcess
        
        if (-not $proc) {
            # Server process is gone
            $consecutiveFailures++
            Write-Log "Server process not found! (Failure $consecutiveFailures/$MaxFailures)" "ERROR"
            
            if ($consecutiveFailures -ge $MaxFailures) {
                Write-Log "Max failures reached — force restarting server..." "WARN"
                Stop-ViteServer
                Start-Sleep -Seconds $RestartDelay
                $currentProcess = Start-ViteServer
                $restartCount++
                $consecutiveFailures = 0
                Write-Log "Restart #$restartCount complete" "OK"
            }
        } else {
            # Process exists, check if it responds to HTTP
            if (Test-ServerAlive) {
                # Everything is fine
                $consecutiveFailures = 0
            } else {
                # Process exists but doesn't respond — might be hung
                $consecutiveFailures++
                Write-Log "Server process alive but not responding! (Failure $consecutiveFailures/$MaxFailures)" "WARN"
                
                if ($consecutiveFailures -ge $MaxFailures) {
                    Write-Log "Server hung — force restarting..." "WARN"
                    Stop-ViteServer
                    Start-Sleep -Seconds $RestartDelay
                    $currentProcess = Start-ViteServer
                    $restartCount++
                    $consecutiveFailures = 0
                    Write-Log "Restart #$restartCount complete" "OK"
                }
            }
        }
    }
} finally {
    & $cleanup
}
