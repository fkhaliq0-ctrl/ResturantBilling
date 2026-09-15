import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

// In-memory sync state buffer for local multi-device relay
let syncQueue = [];

app.post('/api/sync', (req, res) => {
  const batch = req.body;
  console.log('📥 Received sync batch from POS client:', batch);
  
  if (Array.isArray(batch)) {
    syncQueue.push(...batch);
  } else {
    syncQueue.push(batch);
  }
  
  res.json({ 
    success: true, 
    serverTimestamp: Date.now(),
    queuedItems: syncQueue.length 
  });
});

app.get('/api/sync/pull', (req, res) => {
  res.json({ success: true, items: syncQueue });
});

const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), queueSize: syncQueue.length });
});

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 5181;
app.listen(PORT, () => {
  console.log('Mehfil-E-Nihari POS — Production Server Active');
  console.log('🌐 http://localhost:' + PORT);
  console.log('🔄 Cloud Sync Relay: /api/sync enabled');
});

// --- Custom Modular Additions ---
const { initializeOutletSync } = require('./multiOutletSync');
const { initializeDDriveSnapshots } = require('./dDriveBackup');
const { initializePurchaseTracking } = require('./smartPurchaseTracking');
const { initializeBluetoothPrinting } = require('./bluetoothPrinter');

// Initialize background services safely
try {
    initializeDDriveSnapshots();
    initializePurchaseTracking();
    initializeBluetoothPrinting();
    console.log('[System] All custom background modules loaded successfully.');
} catch (err) {
    console.error('[System Error] Failed to initialize background modules:', err);
}
// --------------------------------
