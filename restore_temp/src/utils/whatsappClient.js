// WhatsApp Baileys Client — Frontend API wrapper
// Communicates with the local WhatsApp server on port 5180

const WA_SERVER = 'http://localhost:5180';

// ── Get connection status ────────────────────────────────────
export async function getWAStatus() {
  try {
    const res = await fetch(`${WA_SERVER}/api/status`);
    return await res.json();
  } catch {
    return { connected: false, status: 'server_offline', inWindow: false };
  }
}

// ── Get QR code ──────────────────────────────────────────────
export async function getWAQR() {
  try {
    const res = await fetch(`${WA_SERVER}/api/qr`);
    return await res.json();
  } catch {
    return { qr: null, status: 'server_offline' };
  }
}

// ── Connect ──────────────────────────────────────────────────
export async function connectWA() {
  try {
    const res = await fetch(`${WA_SERVER}/api/connect`, { method: 'POST' });
    return await res.json();
  } catch {
    return { ok: false, error: 'Server offline' };
  }
}

// ── Disconnect ───────────────────────────────────────────────
export async function disconnectWA() {
  try {
    const res = await fetch(`${WA_SERVER}/api/disconnect`, { method: 'POST' });
    return await res.json();
  } catch {
    return { ok: false, error: 'Server offline' };
  }
}

// ── Send message ─────────────────────────────────────────────
export async function sendWAMessage(phone, text) {
  try {
    const res = await fetch(`${WA_SERVER}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Server offline' };
  }
}

// ── Send bill notification ───────────────────────────────────
export async function sendBillNotification(phone, customerName, invoiceNo, amount) {
  try {
    const res = await fetch(`${WA_SERVER}/api/send-bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, customerName, invoiceNo, amount }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Server offline' };
  }
}

// ── Process queue ────────────────────────────────────────────
export async function processWAQueue() {
  try {
    const res = await fetch(`${WA_SERVER}/api/process-queue`, { method: 'POST' });
    return await res.json();
  } catch {
    return { ok: false, error: 'Server offline' };
  }
}

// ── Get sent log ─────────────────────────────────────────────
export async function getWALog() {
  try {
    const res = await fetch(`${WA_SERVER}/api/log`);
    return await res.json();
  } catch {
    return { log: [], queue: [] };
  }
}
