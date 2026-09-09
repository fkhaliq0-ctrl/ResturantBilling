// Edit & Void Audit Log — invisible background trail
// Records every modification to bills for owner verification

import { getAll, setItem } from './storage';

const LOG_STORE = 'auditLogs';

// ── Record an audit entry ────────────────────────────────────────
export async function logEdit({ billId, action, before, after, details }) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    billId,
    action,          // 'item_removed' | 'item_qty_changed' | 'item_price_changed' | 'bill_voided'
    before,          // snapshot before change
    after,           // snapshot after change
    details,         // human-readable description
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  };

  try {
    await setItem(LOG_STORE, entry.id, entry);
  } catch {
    // Silent fail — log is background-only
  }

  return entry;
}

// ── Get all audit logs ───────────────────────────────────────────
export async function getAuditLogs() {
  try {
    const all = await getAll(LOG_STORE);
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch {
    return [];
  }
}

// ── Get audit logs for a specific bill ───────────────────────────
export async function getBillAuditLogs(billId) {
  const all = await getAuditLogs();
  return all.filter((log) => log.billId === billId);
}

// ── Generate comparison summary text (for WhatsApp) ──────────────
export function generateAuditReport(bill, logs) {
  const lines = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━');
  lines.push('📋 MEHFIL-E-NIHARI');
  lines.push('Edit & Void Audit Report');
  lines.push('━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Bill #${bill.id || '—'}`);
  lines.push(`Date: ${bill.date}  Time: ${bill.time}`);
  lines.push(`Original Total: ₹${bill.originalTotal || bill.total}`);
  lines.push('');

  if (logs.length === 0) {
    lines.push('✅ No edits or voids recorded.');
  } else {
    lines.push(`⚠️ ${logs.length} modification(s) detected:`);
    lines.push('');

    logs.forEach((log, idx) => {
      lines.push(`── Edit #${idx + 1} ──`);
      lines.push(`Time: ${new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
      lines.push(`Action: ${log.action.replace(/_/g, ' ').toUpperCase()}`);
      lines.push(`Item: ${log.before?.name || log.after?.name || '—'}`);

      if (log.action === 'item_removed') {
        lines.push(`  Removed: ${log.before.name} (${log.before.portion || 'Fixed'}) × ${log.before.qty} = ₹${log.before.price * log.before.qty}`);
      } else if (log.action === 'item_qty_changed') {
        lines.push(`  Before: ${log.before.name} × ${log.before.qty} = ₹${log.before.price * log.before.qty}`);
        lines.push(`  After:  ${log.after.name} × ${log.after.qty} = ₹${log.after.price * log.after.qty}`);
      } else if (log.action === 'item_price_changed') {
        lines.push(`  Before: ₹${log.before.price}`);
        lines.push(`  After:  ₹${log.after.price}`);
      } else if (log.action === 'bill_voided') {
        lines.push(`  ⛔ Bill voided — all items removed`);
      }
      lines.push('');
    });

    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Edited Total: ₹${bill.total}`);
    const diff = bill.total - (bill.originalTotal || bill.total);
    if (diff !== 0) {
      lines.push(`Difference: ${diff > 0 ? '+' : ''}₹${diff}`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
  }

  lines.push('');
  lines.push('This is an automated audit log from Mehfil-E-Nihari POS.');

  return lines.join('\n');
}

// ── Open WhatsApp with audit report ──────────────────────────────
export function sendAuditToWhatsApp(bill, logs, ownerPhone) {
  const report = generateAuditReport(bill, logs);
  const encoded = encodeURIComponent(report);
  const phone = ownerPhone.replace(/\D/g, '');
  const url = `https://wa.me/${phone}?text=${encoded}`;
  window.open(url, '_blank');
}

// ── Snapshot a bill's items for comparison ────────────────────────
export function snapshotBill(bill) {
  return {
    items: bill.items.map((i) => ({
      id: i.id,
      name: i.name,
      portion: i.portion || null,
      price: i.price,
      qty: i.qty,
      total: i.price * i.qty,
    })),
    total: bill.total,
  };
}
