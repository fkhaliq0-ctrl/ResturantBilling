// End-of-Day Closing Sheet
// Reconciles cash, coins, digital payments against daily sales

import { getAll, setItem, getItem } from './storage';
import { getAllPurchases } from './expenses';

const EOD_STORE = 'dailyClosing';

// ── Get today's sales breakdown ──────────────────────────────
export async function getDaySalesBreakdown(date) {
  const allBills = await getAll('bills');
  const dayBills = allBills.filter((b) => b.date === date);

  const totalSales = dayBills.reduce((s, b) => s + (b.total || 0), 0);
  const cashSales = dayBills.filter((b) => b.paymentMethod === 'cash').reduce((s, b) => s + b.total, 0);
  const upiSales = dayBills.filter((b) => b.paymentMethod === 'upi').reduce((s, b) => s + b.total, 0);
  const billCount = dayBills.length;

  // Item count
  const totalItems = dayBills.reduce((s, b) => s + (b.items?.length || 0), 0);

  // Expenses for the day
  const allPurchases = await getAllPurchases();
  const dayExpenses = allPurchases.filter((p) => p.date === date);
  const totalExpenses = dayExpenses.reduce((s, p) => s + (p.amount || 0), 0);
  const cashExpenses = dayExpenses.filter((p) => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);

  return {
    date,
    billCount,
    totalItems,
    totalSales,
    cashSales,
    upiSales,
    totalExpenses,
    cashExpenses,
    netCash: cashSales - cashExpenses,
  };
}

// ── Reconcile entered amounts against sales ──────────────────
export function reconcile(cashInHand, coins, upiCollected, breakdown) {
  const physicalCash = cashInHand + coins;
  const totalPayments = physicalCash + upiCollected;
  const expectedTotal = breakdown.totalSales;
  const difference = totalPayments - expectedTotal;

  const expectedCash = breakdown.cashSales;
  const cashDifference = physicalCash - expectedCash;
  const upiDifference = upiCollected - breakdown.upiSales;

  return {
    physicalCash,
    coins,
    cashInHand,
    upiCollected,
    totalPayments,
    expectedTotal,
    difference,
    cashDifference,
    upiDifference,
    balanced: difference === 0,
    status: difference === 0 ? 'balanced' : difference > 0 ? 'excess' : 'shortage',
  };
}

// ── Save daily closing record ────────────────────────────────
export async function saveDayClosing(record) {
  await setItem(EOD_STORE, record.date, {
    ...record,
    id: record.date,
    timestamp: new Date().toISOString(),
  });
  return record;
}

// ── Get closing record for a date ────────────────────────────
export async function getDayClosing(date) {
  return getItem(EOD_STORE, date);
}

// ── Check if today is already closed ─────────────────────────
export async function isTodayClosed(date) {
  const existing = await getDayClosing(date);
  return !!existing?.closed;
}

// ── Get all closing records ──────────────────────────────────
export async function getAllClosing() {
  const all = await getAll(EOD_STORE);
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}
