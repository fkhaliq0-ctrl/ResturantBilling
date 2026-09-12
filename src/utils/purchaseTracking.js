// ── Smart Consumption-Based Purchase Tracking ───────────
// Tracks inventory consumption per sale and auto-generates purchase suggestions

import { getAll, setItem, deleteItem } from './storage';

const CONSUMPTION_KEY = 'consumption_log';
const PURCHASE_LOG_KEY = 'purchase_log';

// ── Record consumption when a bill is saved ─────────────
export function recordConsumption(bill) {
  if (!bill?.items) return;

  const log = JSON.parse(localStorage.getItem(CONSUMPTION_KEY) || '[]');
  const today = new Date().toISOString().split('T')[0];

  bill.items.forEach(item => {
    log.push({
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: today,
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'General',
      qty: item.qty,
      unitPrice: item.price,
      totalCost: item.price * item.qty,
      billId: bill.id,
      timestamp: new Date().toISOString(),
    });
  });

  localStorage.setItem(CONSUMPTION_KEY, JSON.stringify(log));
}

// ── Get consumption summary for a date range ────────────
export function getConsumptionSummary(startDate, endDate) {
  const log = JSON.parse(localStorage.getItem(CONSUMPTION_KEY) || '[]');
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const filtered = log.filter(entry => entry.date >= start && entry.date <= end);

  // Group by item
  const byItem = {};
  filtered.forEach(entry => {
    if (!byItem[entry.itemId]) {
      byItem[entry.itemId] = {
        itemId: entry.itemId,
        itemName: entry.itemName,
        category: entry.category,
        totalQty: 0,
        totalCost: 0,
        orderCount: 0,
      };
    }
    byItem[entry.itemId].totalQty += entry.qty;
    byItem[entry.itemId].totalCost += entry.totalCost;
    byItem[entry.itemId].orderCount += 1;
  });

  // Sort by total cost (highest consumers first)
  const summary = Object.values(byItem).sort((a, b) => b.totalCost - a.totalCost);

  // Group by category
  const byCategory = {};
  filtered.forEach(entry => {
    if (!byCategory[entry.category]) byCategory[entry.category] = { totalQty: 0, totalCost: 0 };
    byCategory[entry.category].totalQty += entry.qty;
    byCategory[entry.category].totalCost += entry.totalCost;
  });

  return { summary, byCategory, totalItems: filtered.length, dateRange: { start, end } };
}

// ── Auto-generate purchase suggestions based on consumption ──
export function generatePurchaseSuggestions() {
  const { summary } = getConsumptionSummary(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  );

  // Get current inventory
  const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
  const inventoryMap = {};
  inventory.forEach(item => { inventoryMap[item.name] = item; });

  const suggestions = summary.map(consumed => {
    const inv = inventoryMap[consumed.itemName];
    const avgDailyQty = consumed.totalQty / 30;
    const currentStock = inv?.stock || 0;
    const reorderThreshold = inv?.reorderThreshold || Math.ceil(avgDailyQty * 3);
    const daysUntilEmpty = currentStock > 0 ? Math.floor(currentStock / avgDailyQty) : 0;

    return {
      itemName: consumed.itemName,
      category: consumed.category,
      avgDailyConsumption: Math.round(avgDailyQty * 10) / 10,
      currentStock,
      reorderThreshold,
      daysUntilEmpty,
      estimatedMonthlyCost: consumed.totalCost,
      priority: daysUntilEmpty <= 3 ? 'URGENT' : daysUntilEmpty <= 7 ? 'HIGH' : 'NORMAL',
      suggestedOrderQty: Math.ceil(avgDailyQty * 7 - currentStock), // 1 week supply
    };
  }).filter(s => s.suggestedOrderQty > 0 || s.priority === 'URGENT');

  return suggestions.sort((a, b) => {
    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── Record a purchase entry ─────────────────────────────
export function recordPurchase(purchase) {
  const log = JSON.parse(localStorage.getItem(PURCHASE_LOG_KEY) || '[]');
  log.push({
    ...purchase,
    id: purchase.id || Date.now(),
    recordedAt: new Date().toISOString(),
  });
  localStorage.setItem(PURCHASE_LOG_KEY, JSON.stringify(log));
  return true;
}

// ── Get purchase history ────────────────────────────────
export function getPurchaseHistory(startDate, endDate) {
  const log = JSON.parse(localStorage.getItem(PURCHASE_LOG_KEY) || '[]');
  if (!startDate) return log;
  return log.filter(p => p.date >= startDate && (!endDate || p.date <= endDate));
}
