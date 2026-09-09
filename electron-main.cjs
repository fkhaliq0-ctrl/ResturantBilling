// ══════════════════════════════════════════════════════════════════════════════
// Mehfil-E-Nihari POS — Electron Desktop App
// ══════════════════════════════════════════════════════════════════════════════
// Loads the built Vite React app from dist/ and serves it in a native window.
// Auto-detects USB/network thermal printers and biometric scanners on launch.
// All data paths default to D:\ResturantBilling.
// ══════════════════════════════════════════════════════════════════════════════

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createServer } = require('node:http');
const { readFile, stat, readdir, writeFile, mkdir } = require('node:fs/promises');
const { join, extname, resolve } = require('node:path');
const { exec, spawn } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);

// ── Paths ───────────────────────────────────────────────────────────────────
const DIST_DIR = join(__dirname, 'dist');
const ASSETS_DIR = join(__dirname, 'assets');
const PORT = 15181;
const isDev = process.argv.includes('--dev');

// Drive D: data directory (primary data storage)
const DATA_DIR = 'D:\\ResturantBilling';
const DB_DIR = join(DATA_DIR, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const LOGS_DIR = join(DATA_DIR, 'logs');

// ── MIME Types ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.map': 'application/json; charset=utf-8',
};

// ── Hardware Auto-Detection ─────────────────────────────────────────────────
const detectedHardware = {
  printers: [],
  biometricDevices: [],
  networkPrinters: [],
  scanComplete: false,
};

async function detectPrinters() {
  console.log('🔍 Detecting thermal printers...');
  const printers = [];

  try {
    // Method 1: Windows WMIC printer query
    const { stdout } = await execAsync(
      'wmic printer get Name,PortName,PrinterStatus,DriverName /format:csv',
      { timeout: 10000 }
    );
    const lines = stdout.trim().split('\n').filter(l => l.trim());
    const headers = lines[0]?.split(',') || [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const printer = {};
      headers.forEach((h, idx) => {
        printer[h.trim()] = values[idx]?.trim() || '';
      });

      if (printer.Name) {
        const isThermal = /receipt|thermal|pos|epson|star|citizen|bixolon|tsp|tm-|58mm|80mm/i.test(
          printer.Name + ' ' + (printer.DriverName || '')
        );
        printers.push({
          name: printer.Name,
          port: printer.PortName || 'Unknown',
          driver: printer.DriverName || 'Unknown',
          status: printer.PrinterStatus === '3' ? 'ready' : 'offline',
          isThermal,
        });
      }
    }
  } catch (e) {
    console.log('   ⚠️ WMIC printer detection failed:', e.message);
  }

  try {
    // Method 2: PowerShell Get-Printer
    const { stdout } = await execAsync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object Name, PortName, DriverName, PrinterStatus | ConvertTo-Json"',
      { timeout: 10000 }
    );
    const psPrinters = JSON.parse(stdout);
    const psArr = Array.isArray(psPrinters) ? psPrinters : [psPrinters];

    for (const p of psArr) {
      if (p.Name && !printers.find(ep => ep.name === p.Name)) {
        const isThermal = /receipt|thermal|pos|epson|star|citizen|bixolon|tsp|tm-|58mm|80mm/i.test(
          p.Name + ' ' + (p.DriverName || '')
        );
        printers.push({
          name: p.Name,
          port: p.PortName || 'Unknown',
          driver: p.DriverName || 'Unknown',
          status: p.PrinterStatus === 0 ? 'ready' : 'offline',
          isThermal,
        });
      }
    }
  } catch (e) {
    console.log('   ⚠️ PowerShell printer detection failed:', e.message);
  }

  // Method 3: Check USB serial ports for thermal printer connections
  try {
    const { stdout: usbOut } = await execAsync(
      'wmic path Win32_SerialPort get DeviceID,Description /format:csv',
      { timeout: 5000 }
    );
    const usbLines = usbOut.trim().split('\n').filter(l => l.trim());
    for (let i = 1; i < usbLines.length; i++) {
      const parts = usbLines[i].split(',');
      if (parts[2] && /serial|usb|comm/i.test(parts[2])) {
        const portName = parts[1]?.trim();
        if (portName && !printers.find(p => p.port === portName)) {
          printers.push({
            name: `USB Port: ${portName}`,
            port: portName,
            driver: 'USB Serial',
            status: 'detected',
            isThermal: true,
          });
        }
      }
    }
  } catch {}

  // Method 4: Scan network for common POS printer ports (9100)
  try {
    const { stdout: ipOut } = await execAsync(
      'ipconfig',
      { timeout: 5000 }
    );
    const ipMatch = ipOut.match(/IPv4.*?:\s*(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      const baseIp = ipMatch[1].split('.').slice(0, 3).join('.');
      // Check common POS printers on the subnet
      for (let i = 1; i <= 5; i++) {
        const ip = `${baseIp}.${i + 200}`;
        try {
          await execAsync(
            `powershell -NoProfile -Command "Test-NetConnection -ComputerName ${ip} -Port 9100 -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded"`,
            { timeout: 3000 }
          );
        } catch {}
      }
    }
  } catch {}

  detectedHardware.printers = printers;
  console.log(`   ✅ Found ${printers.length} printer(s)`);
  return printers;
}

async function detectBiometricDevices() {
  console.log('🔍 Detecting biometric devices...');
  const devices = [];

  try {
    // Check for USB fingerprint readers via WMI
    const { stdout } = await execAsync(
      'wmic path Win32_USBControllerDevice get DeviceID,Description /format:csv',
      { timeout: 8000 }
    );
    const lines = stdout.trim().split('\n').filter(l => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const desc = (parts[2] || '').toLowerCase();
      if (/fingerprint|biometric|face|iris|reader|scanner/i.test(desc)) {
        devices.push({
          name: parts[2]?.trim() || 'Unknown Biometric Device',
          id: parts[1]?.trim() || '',
          type: /fingerprint/i.test(desc) ? 'fingerprint' : 'face',
          connected: true,
        });
      }
    }
  } catch (e) {
    console.log('   ⚠️ Biometric detection via WMI failed:', e.message);
  }

  // Check Windows Hello capability
  try {
    const { stdout } = await execAsync(
      'powershell -NoProfile -Command "Get-WmiObject -Class Win32_PhysicalFace -ErrorAction SilentlyContinue | Select-Object Name"',
      { timeout: 5000 }
    );
    if (stdout.trim() && stdout.trim() !== 'Name\n----') {
      devices.push({
        name: 'Windows Hello (Built-in)',
        id: 'windows-hello',
        type: 'face',
        connected: true,
      });
    }
  } catch {}

  detectedHardware.biometricDevices = devices;
  console.log(`   ✅ Found ${devices.length} biometric device(s)`);
  return devices;
}

async function detectAllHardware() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔌 Hardware Auto-Detection');
  console.log('═══════════════════════════════════════════════════════════\n');

  await Promise.all([
    detectPrinters(),
    detectBiometricDevices(),
  ]);

  detectedHardware.scanComplete = true;

  // Save detection results to Drive D:
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(
      join(DATA_DIR, 'hardware-scan.json'),
      JSON.stringify(detectedHardware, null, 2)
    );
    console.log(`   📁 Hardware scan saved: ${join(DATA_DIR, 'hardware-scan.json')}`);
  } catch (e) {
    console.log('   ⚠️ Could not save hardware scan:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  return detectedHardware;
}

// ── Ensure Drive D: directories exist ───────────────────────────────────────
async function ensureDataDirectories() {
  const dirs = [DATA_DIR, DB_DIR, BACKUP_DIR, LOGS_DIR];
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch {}
  }
  console.log(`📁 Data directories ready: ${DATA_DIR}`);
}

// ── File Server ─────────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  // Hardware detection API
  if (pathname === '/api/hardware') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(detectedHardware));
    return;
  }

  // Re-scan hardware API
  if (pathname === '/api/hardware/scan') {
    detectAllHardware().then(hw => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(hw));
    });
    return;
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      app: 'Mehfil-E-Nihari POS',
      version: app.getVersion(),
      dataDir: DATA_DIR,
      hardware: {
        printers: detectedHardware.printers.length,
        biometricDevices: detectedHardware.biometricDevices.length,
      },
    }));
    return;
  }

  let filePath = join(DIST_DIR, pathname);
  if (!filePath.startsWith(DIST_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const ext = extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': content.byteLength });
      res.end(content);
      return;
    }
  } catch { /* SPA fallback */ }

  try {
    const indexContent = await readFile(join(DIST_DIR, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexContent);
  } catch {
    res.writeHead(500);
    res.end('App not built. Run: npm run build');
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let server = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Mehfil-E-Nihari POS',
    backgroundColor: '#0a0a0a',
    show: false,
    icon: join(__dirname, 'assets', 'mm.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('🪟 Mehfil-E-Nihari POS — Desktop App Ready');
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC Handlers for renderer ───────────────────────────────────────────────
ipcMain.handle('get-hardware', () => detectedHardware);
ipcMain.handle('scan-hardware', () => detectAllHardware());
ipcMain.handle('get-data-dir', () => DATA_DIR);

// ── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Ensure D: drive directories exist
  await ensureDataDirectories();

  // Auto-detect hardware on launch
  await detectAllHardware();

  // Start internal server
  server = createServer(handleRequest);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log(`║     🍲 Mehfil-E-Nihari POS — Desktop App                ║`);
    console.log(`║     📂 Serving: ${DIST_DIR}`);
    console.log(`║     💾 Data:   ${DATA_DIR}`);
    console.log(`║     🌐 Internal: http://localhost:${PORT}`);
    console.log(`║     🔌 Printers: ${detectedHardware.printers.length} | 🔐 Biometric: ${detectedHardware.biometricDevices.length}`);
    console.log(`╚══════════════════════════════════════════════════════════╝\n`);
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (server) server.close();
});

