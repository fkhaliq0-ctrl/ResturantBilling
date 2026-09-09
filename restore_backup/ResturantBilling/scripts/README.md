# Mehfil-E-Nihari POS — Persistent Server Setup

## Problem
The Vite dev server stops when the terminal closes, causing `ERR_CONNECTION_REFUSED` errors on mobile devices and other clients.

## Solution
Two methods to keep the server running persistently:

---

## Method 1: PM2 (Recommended)

PM2 is a production-grade Node.js process manager that keeps the server alive.

### Quick Start
```bash
# Start the server
pm2 start ecosystem.config.cjs

# Or use the npm script
npm run 🚀 start
```

### Commands
```bash
pm2 status              # Check if server is running
pm2 logs mehfil-pos     # View live logs
pm2 restart mehfil-pos  # Restart the server
pm2 stop mehfil-pos     # Stop the server
pm2 delete mehfil-pos   # Remove from PM2
```

### Auto-Start on Boot
```bash
# Save current process list (survives reboot)
pm2 save

# Install startup script (Windows)
pm2-startup install
```

### Logs Location
- Error log: `logs/pm2-error.log`
- Output log: `logs/pm2-out.log`
- Watcher log: `logs/watcher.log`

---

## Method 2: PowerShell Watcher

A PowerShell script that monitors the server and restarts it if it crashes.

### Quick Start
```powershell
# Start in foreground (shows logs)
pwsh -ExecutionPolicy Bypass -File scripts/watch-server.ps1

# Start in background (silent)
pwsh -ExecutionPolicy Bypass -File scripts/watch-server.ps1 -Background

# Custom port
pwsh -ExecutionPolicy Bypass -File scripts/watch-server.ps1 -Port 3000
```

### Features
- Auto-detects server crashes
- HTTP health checks every 10 seconds
- Force restart after 3 consecutive failures
- Detailed logging to `logs/watcher.log`

---

## Method 3: Quick Start Batch File

Double-click `start-server.bat` from Windows Explorer:
- **Option 1**: PM2 mode (background, persistent)
- **Option 2**: Watcher mode (foreground, shows logs)
- **Option 3**: Quick start (no auto-restart)
- **Option 4**: Stop all servers
- **Option 5**: View server status

---

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :5180

# Kill process on port
taskkill /F /PID <PID>

# Restart PM2
pm2 restart mehfil-pos
```

### PM2 not found
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Logs not showing
```bash
# Check logs directory
dir logs

# View PM2 logs
pm2 logs mehfil-pos --lines 50
```

---

## Configuration

### PM2 Ecosystem (ecosystem.config.cjs)
- **Port**: 5180
- **Auto-restart**: Enabled
- **Max restarts**: 50
- **Memory limit**: 500MB
- **Restart delay**: 2 seconds
- **Exponential backoff**: 100ms → 15s

### PowerShell Watcher (scripts/watch-server.ps1)
- **Health check interval**: 10 seconds
- **Max failures**: 3
- **Restart delay**: 2 seconds
- **Timeout**: 30 seconds

---

## Environment Variables
```bash
NODE_ENV=development
PORT=5180
```

---

## Quick Reference
| Command | Description |
|---------|-------------|
| `pm2 start ecosystem.config.cjs` | Start server with PM2 |
| `pm2 status` | Check server status |
| `pm2 logs` | View live logs |
| `pm2 restart mehfil-pos` | Restart server |
| `pm2 stop mehfil-pos` | Stop server |
| `pm2 save` | Save process list |
| `pm2 startup` | Auto-start on boot |
