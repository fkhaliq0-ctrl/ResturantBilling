// Mehfil-E-Nihari — WhatsApp Baileys Background Server
// Time-window: 5 PM (17:00) – 11 PM (23:00) IST
// Silent background queue: messages dispatched automatically during window

import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WA_PORT || 5180;
const AUTH_DIR = join(__dirname, 'auth_info');
const WINDOW_START = 17; // 5 PM
const WINDOW_END = 23;   // 11 PM

// ── State ────────────────────────────────────────────────────
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected'; // disconnected, connecting, qr_ready, connected
let messageQueue = []; // queued messages for outside time window
let sentLog = [];      // last 50 sent messages
let stats = { sent: 0, failed: 0, queued: 0 };

// ── Time Window Check ────────────────────────────────────────
function isWithinWindow() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  return istHour >= WINDOW_START && istHour < WINDOW_END;
}

function getISTTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

// ── WhatsApp Connection ──────────────────────────────────────
async function connectWhatsApp() {
  if (sock) return;

  try {
    connectionStatus = 'connecting';
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Mehfil-E-Nihari POS', 'Safari', '3.0'],
      markOnlineOnConnect: false,
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        connectionStatus = 'qr_ready';
        console.log('[WA] QR Code ready — scan with WhatsApp');
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('[WA] Connection closed:', reason);

        if (reason === DisconnectReason.loggedOut) {
          console.log('[WA] Logged out — clearing auth');
          sock = null;
          qrCode = null;
          connectionStatus = 'disconnected';
        } else {
          // Reconnect
          sock = null;
          qrCode = null;
          connectionStatus = 'disconnected';
          setTimeout(connectWhatsApp, 5000);
        }
      }

      if (connection === 'open') {
        console.log('[WA] ✅ Connected!');
        qrCode = null;
        connectionStatus = 'connected';
        // Process queued messages
        processQueue();
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Incoming messages (optional handler)
    sock.ev.on('messages.upsert', ({ messages }) => {
      messages.forEach((msg) => {
        if (!msg.key.fromMe && msg.message) {
          console.log('[WA] Received from', msg.key.remoteJid);
        }
      });
    });

  } catch (err) {
    console.error('[WA] Connection error:', err.message);
    connectionStatus = 'disconnected';
    setTimeout(connectWhatsApp, 10000);
  }
}

// ── Send Message ─────────────────────────────────────────────
async function sendMessage(phone, text) {
  if (!sock || connectionStatus !== 'connected') {
    return { ok: false, error: 'WhatsApp not connected', queued: true };
  }

  if (!isWithinWindow()) {
    messageQueue.push({ phone, text, timestamp: Date.now() });
    stats.queued++;
    return { ok: true, queued: true, message: 'Queued for next window' };
  }

  try {
    const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text });
    stats.sent++;
    sentLog.unshift({
      phone,
      text: text.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      status: 'sent',
    });
    if (sentLog.length > 50) sentLog = sentLog.slice(0, 50);
    return { ok: true, sent: true };
  } catch (err) {
    stats.failed++;
    sentLog.unshift({
      phone,
      text: text.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: err.message,
    });
    return { ok: false, error: err.message };
  }
}

// ── Process Queue (called when window opens or connection restores) ─
async function processQueue() {
  if (!isWithinWindow() || messageQueue.length === 0) return;

  const queue = [...messageQueue];
  messageQueue = [];

  for (const entry of queue) {
    await sendMessage(entry.phone, entry.text);
  }
}

// ── Retry Queue (robust local queue with retry logic) ──────
let retryQueue = []; // { phone, text, retryCount, lastAttempt, nextRetryAt, billId }
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 30000; // 30 seconds base
const DAILY_REPORT_HOUR = 18; // 6 PM IST
let dailyReportSent = false;

// Add to queue with retry metadata
function queueWithRetry(phone, text, meta = {}) {
  const entry = {
    phone, text, ...meta,
    retryCount: 0,
    lastAttempt: null,
    nextRetryAt: Date.now(),
    status: 'pending',
    queuedAt: new Date().toISOString(),
  };
  retryQueue.push(entry);
  stats.queued++;
  console.log(`[WA-Queue] Queued message for ${phone} (queue: ${retryQueue.length})`);
  return entry;
}

// Process retry queue
async function processRetryQueue() {
  if (connectionStatus !== 'connected') return;
  if (!isWithinWindow() && retryQueue.length === 0) return;

  const now = Date.now();
  const ready = retryQueue.filter(m => m.status === 'pending' && m.nextRetryAt <= now);

  for (const entry of ready) {
    try {
      const jid = entry.phone.replace(/\D/g, '') + '@s.whatsapp.net';
      await sock.sendMessage(jid, { text: entry.text });
      entry.status = 'sent';
      stats.sent++;
      sentLog.unshift({
        phone: entry.phone, text: entry.text.substring(0, 100) + '...',
        timestamp: new Date().toISOString(), status: 'sent',
      });
    } catch (err) {
      entry.retryCount++;
      entry.lastAttempt = new Date().toISOString();
      if (entry.retryCount >= MAX_RETRIES) {
        entry.status = 'failed';
        stats.failed++;
        sentLog.unshift({
          phone: entry.phone, text: entry.text.substring(0, 100) + '...',
          timestamp: new Date().toISOString(), status: 'failed', error: err.message,
        });
        console.log(`[WA-Queue] ❌ Failed after ${MAX_RETRIES} retries: ${entry.phone}`);
      } else {
        entry.status = 'retry';
        entry.nextRetryAt = now + RETRY_DELAY_BASE * entry.retryCount;
        console.log(`[WA-Queue] ⏳ Retry ${entry.retryCount}/${MAX_RETRIES} for ${entry.phone} (next: ${Math.round(RETRY_DELAY_BASE * entry.retryCount / 1000)}s)`);
      }
    }
  }

  // Remove sent entries older than 1 hour
  retryQueue = retryQueue.filter(m => m.status !== 'sent' || Date.now() - new Date(m.queuedAt).getTime() < 3600000);
}

// ── Daily Owner Report ───────────────────────────────────
async function sendDailyReport() {
  if (!sock || connectionStatus !== 'connected') return;
  if (dailyReportSent) return;

  const ownerPhone = process.env.OWNER_PHONE || '';
  if (!ownerPhone) { console.log('[WA-Report] No OWNER_PHONE set — skipping'); return; }

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = sentLog.filter(l => l.timestamp && l.timestamp.startsWith(today));
  const sentToday = todayLogs.filter(l => l.status === 'sent').length;
  const failedToday = todayLogs.filter(l => l.status === 'failed').length;
  const queueLen = retryQueue.filter(m => m.status === 'pending' || m.status === 'retry').length;

  const report = [
    '📊 *DAILY SALES REPORT — Mehfil-E-Nihari*',
    `📅 ${today}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `📨 WhatsApp Dispatch Today:`,
    `   ✅ Sent: ${sentToday}`,
    `   ❌ Failed: ${failedToday}`,
    `   ⏳ Pending: ${queueLen}`,
    '',
    `📡 Server Status: ${connectionStatus}`,
    `⏰ Report Time: ${getISTTime().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '_Auto-generated by Mehfil-E-Nihari POS_',
    '',
    '📱 Official App Download: https://drive.google.com/file/d/1sL9_Hari4tIWb9JfNEa-HojJpyBRiVg0/view?usp=sharing',
  ].join('\n');

  try {
    const jid = ownerPhone.replace(/\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: report });
    dailyReportSent = true;
    console.log('[WA-Report] ✅ Daily report sent to owner');
  } catch (err) {
    console.error('[WA-Report] ❌ Failed:', err.message);
  }
}

// Check hour for daily report
setInterval(() => {
  const hour = (new Date().getUTCHours() + 5 + Math.floor((new Date().getUTCMinutes() + 30) / 60)) % 24;
  if (hour >= DAILY_REPORT_HOUR && !dailyReportSent) {
    sendDailyReport();
  }
  // Reset daily report flag at midnight
  if (hour === 0) dailyReportSent = false;
}, 60000);

// ── Queue Checker (runs every 30 seconds) ────────────────────
setInterval(() => {
  if (isWithinWindow() && (retryQueue.length > 0 || messageQueue.length > 0) && connectionStatus === 'connected') {
    console.log(`[WA] Processing queue: ${retryQueue.length} retry + ${messageQueue.length} queued`);
    processQueue();
    processRetryQueue();
  }
}, 30000);

// ── REST API ─────────────────────────────────────────────────

// Status
app.get('/api/status', (req, res) => {
  res.json({
    connected: connectionStatus === 'connected',
    status: connectionStatus,
    hasQR: !!qrCode,
    inWindow: isWithinWindow(),
    currentTime: getISTTime().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    window: `${WINDOW_START}:00 – ${WINDOW_END}:00 IST`,
    queueLength: messageQueue.length,
    stats,
  });
});

// QR Code
app.get('/api/qr', (req, res) => {
  if (qrCode) {
    res.json({ qr: qrCode });
  } else if (connectionStatus === 'connected') {
    res.json({ connected: true, message: 'Already connected' });
  } else {
    res.json({ qr: null, status: connectionStatus });
  }
});

// Send message
app.post('/api/send', async (req, res) => {
  const { phone, text, name } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: 'phone and text are required' });
  }
  const result = await sendMessage(phone, text);
  res.json(result);
});

// Send bill notification
app.post('/api/send-bill', async (req, res) => {
  const { phone, customerName, invoiceNo, amount } = req.body;
  if (!phone || !invoiceNo) {
    return res.status(400).json({ error: 'phone and invoiceNo are required' });
  }

  const text = [
    '🍽️ *MEHFIL-E-NIHARI*',
    '',
    `Dear ${customerName || 'Customer'},`,
    '',
    `✅ Your invoice has been generated.`,
    `📋 Invoice No: *${invoiceNo}*`,
    `💰 Amount: *₹${Number(amount).toLocaleString('en-IN')}*`,
    '',
    'Thank you for your business!',
    '— Mehfil-E-Nihari',
    '',
    '📱 Download official app: https://drive.google.com/file/d/1sL9_Hari4tIWb9JfNEa-HojJpyBRiVg0/view?usp=sharing',
  ].join('\n');

  const result = await sendMessage(phone, text);
  res.json(result);
});

// Process queue manually
app.post('/api/process-queue', async (req, res) => {
  if (connectionStatus !== 'connected') {
    return res.json({ ok: false, error: 'Not connected' });
  }
  const count = messageQueue.length;
  await processQueue();
  res.json({ ok: true, processed: count });
});

// Get sent log
app.get('/api/log', (req, res) => {
  res.json({ log: sentLog, queue: messageQueue });
});

// Queue status
app.get('/api/queue', (req, res) => {
  res.json({
    queue: retryQueue.map(m => ({
      phone: m.phone, status: m.status, retryCount: m.retryCount,
      queuedAt: m.queuedAt, nextRetryAt: m.nextRetryAt,
    })),
    totalPending: retryQueue.filter(m => m.status === 'pending' || m.status === 'retry').length,
    totalFailed: retryQueue.filter(m => m.status === 'failed').length,
  });
});

// Retry failed messages
app.post('/api/retry-failed', async (req, res) => {
  const failed = retryQueue.filter(m => m.status === 'failed');
  failed.forEach(m => {
    m.status = 'pending';
    m.retryCount = 0;
    m.nextRetryAt = Date.now();
  });
  res.json({ ok: true, retried: failed.length });
});

// Send daily report now
app.post('/api/daily-report', async (req, res) => {
  dailyReportSent = false; // Reset flag
  await sendDailyReport();
  res.json({ ok: true, sent: dailyReportSent });
});

// Connect
app.post('/api/connect', (req, res) => {
  if (connectionStatus === 'connected') {
    return res.json({ ok: true, message: 'Already connected' });
  }
  connectWhatsApp();
  res.json({ ok: true, message: 'Connecting...' });
});

// Disconnect
app.post('/api/disconnect', async (req, res) => {
  if (sock) {
    sock.end();
    sock = null;
  }
  qrCode = null;
  connectionStatus = 'disconnected';
  res.json({ ok: true });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍲 Mehfil-E-Nihari WhatsApp Server`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`⏰ Time window: ${WINDOW_START}:00 – ${WINDOW_END}:00 IST`);
  console.log(`   Current time: ${getISTTime().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
  console.log(`   Window active: ${isWithinWindow() ? '✅ YES' : '❌ NO (sleeping)'}\n`);

  // Auto-connect on startup
  connectWhatsApp();
});

