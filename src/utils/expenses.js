// Daily Purchases & Expense Tracking
// Stores purchase entries, vendor tracking, and owner-only reports

import { getAll, setItem, deleteItem } from './storage';

const PURCHASES_STORE = 'purchases';

// ── Default vendors for quick select ─────────────────────────
export const DEFAULT_VENDORS = [
  'Imran Gosht', 'Zahiru', 'Tariq', 'Mukhtar Gosht',
  'Suresh sabzi', 'Ramesh Dairy', 'Amul Dealer',
  'LPG Gas Agency', 'Other',
];

// ── Default expense categories ───────────────────────────────
export const EXPENSE_CATEGORIES = [
  'Raw Material', 'Gas / LPG', 'Vegetables', 'Dairy',
  'Spices & Masala', 'Packaging', 'Staff Salary',
  'Rent', 'Electricity', 'Transport', 'Maintenance', 'Other',
];

// ── Save a purchase entry ────────────────────────────────────
export async function savePurchase(entry) {
  const record = {
    ...entry,
    id: entry.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
  };
  await setItem(PURCHASES_STORE, record.id, record);
  return record;
}

// ── Delete a purchase entry ──────────────────────────────────
export async function deletePurchase(id) {
  await deleteItem(PURCHASES_STORE, id);
}

// ── Get all purchases ────────────────────────────────────────
export async function getAllPurchases() {
  const all = await getAll(PURCHASES_STORE);
  return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ── Get purchases for a specific date ────────────────────────
export async function getPurchasesByDate(date) {
  const all = await getAllPurchases();
  return all.filter((p) => p.date === date);
}

// ── Get purchases for a date range ───────────────────────────
export async function getPurchasesByRange(startDate, endDate) {
  const all = await getAllPurchases();
  return all.filter((p) => p.date >= startDate && p.date <= endDate);
}

// ── Get all unique vendors from purchase history ─────────────
export async function getVendors() {
  const all = await getAllPurchases();
  const vendorSet = new Set(DEFAULT_VENDORS);
  all.forEach((p) => { if (p.vendor) vendorSet.add(p.vendor); });
  return [...vendorSet].sort();
}

// ── Generate owner expense report ────────────────────────────
export async function generateExpenseReport(date) {
  const purchases = await getPurchasesByDate(date);
  return buildReport(purchases, date);
}

export async function generateMonthlyExpenseReport(yearMonth) {
  // yearMonth format: "2026-08"
  const all = await getAllPurchases();
  const monthly = all.filter((p) => p.date.startsWith(yearMonth));
  return buildReport(monthly, yearMonth);
}

function buildReport(purchases, label) {
  const totalAmount = purchases.reduce((s, p) => s + (p.amount || 0), 0);
  const cashTotal = purchases.filter((p) => p.paymentMethod === 'cash').reduce((s, p) => s + (p.amount || 0), 0);
  const paytmTotal = purchases.filter((p) => p.paymentMethod === 'paytm').reduce((s, p) => s + (p.amount || 0), 0);
  const onlineTotal = purchases.filter((p) => p.paymentMethod === 'online').reduce((s, p) => s + (p.amount || 0), 0);

  // By vendor
  const byVendor = {};
  purchases.forEach((p) => {
    const v = p.vendor || 'Unknown';
    if (!byVendor[v]) byVendor[v] = { name: v, total: 0, count: 0 };
    byVendor[v].total += p.amount || 0;
    byVendor[v].count += 1;
  });

  // By category
  const byCategory = {};
  purchases.forEach((p) => {
    const c = p.category || 'Other';
    if (!byCategory[c]) byCategory[c] = { name: c, total: 0, count: 0 };
    byCategory[c].total += p.amount || 0;
    byCategory[c].count += 1;
  });

  return {
    label,
    totalEntries: purchases.length,
    totalAmount,
    paymentBreakdown: { cash: cashTotal, paytm: paytmTotal, online: onlineTotal },
    byVendor: Object.values(byVendor).sort((a, b) => b.total - a.total),
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
    entries: purchases,
  };
}
