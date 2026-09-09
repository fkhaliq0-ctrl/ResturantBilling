// Automated Quarterly CA WhatsApp Dispatcher
// Builds GST/sales/expense reports for CA and sends via WhatsApp

import { getAllBills } from './storage';
import { getAllPurchases } from './expenses';
import { getSetting, setSetting } from './storage';

const CA_CONTACTS_KEY = 'ca_contacts';
const CA_LAST_SENT_KEY = 'ca_last_sent';

// ── CA Contact Management ────────────────────────────────────
export async function getCAContacts() {
  const data = await getSetting(CA_CONTACTS_KEY);
  return data || { phone1: '', name1: '', phone2: '', name2: '' };
}

export async function saveCAContacts(contacts) {
  await setSetting(CA_CONTACTS_KEY, contacts);
}

export async function getLastSent() {
  return getSetting(CA_LAST_SENT_KEY);
}

export async function markAsSent(quarter) {
  await setSetting(CA_LAST_SENT_KEY, { quarter, timestamp: new Date().toISOString() });
}

// ── Quarter Detection ────────────────────────────────────────
export function getCurrentQuarter(date = new Date()) {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  if (month < 3) return { quarter: 'Q4', year: year - 1, label: `Oct ${year-1} – Mar ${year}` };
  if (month < 6) return { quarter: 'Q1', year, label: `Apr ${year} – Jun ${year}` };
  if (month < 9) return { quarter: 'Q2', year, label: `Jul ${year} – Sep ${year}` };
  return { quarter: 'Q3', year, label: `Oct ${year} – Dec ${year}` };
}

export function getQuarterMonths(quarter, year) {
  switch (quarter) {
    case 'Q1': return [`${year}-04`, `${year}-05`, `${year}-06`];
    case 'Q2': return [`${year}-07`, `${year}-08`, `${year}-09`];
    case 'Q3': return [`${year}-10`, `${year}-11`, `${year}-12`];
    case 'Q4': return [`${year+1}-01`, `${year+1}-02`, `${year+1}-03`];
    default: return [];
  }
}

// ── Build Quarterly Report ───────────────────────────────────
export async function buildQuarterlyReport(quarter, year) {
  const months = getQuarterMonths(quarter, year);
  const allBills = await getAllBills();
  const allPurchases = await getAllPurchases();

  // Filter bills for the quarter
  const quarterBills = allBills.filter((b) => months.some((m) => b.date?.startsWith(m)));
  const quarterPurchases = allPurchases.filter((p) => months.some((m) => p.date?.startsWith(m)));

  // Sales breakdown
  const totalSales = quarterBills.reduce((s, b) => s + (b.total || 0), 0);
  const cashSales = quarterBills.filter((b) => b.paymentMethod === 'cash').reduce((s, b) => s + b.total, 0);
  const upiSales = quarterBills.filter((b) => b.paymentMethod === 'upi').reduce((s, b) => s + b.total, 0);

  // Item-wise sales
  const itemSales = {};
  quarterBills.forEach((b) => {
    b.items?.forEach((item) => {
      const key = item.name + (item.portion ? ` (${item.portion})` : '');
      if (!itemSales[key]) itemSales[key] = { name: key, qty: 0, amount: 0 };
      itemSales[key].qty += item.qty;
      itemSales[key].amount += item.price * item.qty;
    });
  });

  // Expense breakdown
  const totalExpenses = quarterPurchases.reduce((s, p) => s + (p.amount || 0), 0);
  const cashExpenses = quarterPurchases.filter((p) => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
  const onlineExpenses = quarterPurchases.filter((p) => p.paymentMethod !== 'cash').reduce((s, p) => s + p.amount, 0);

  // Expense by category
  const expenseByCategory = {};
  quarterPurchases.forEach((p) => {
    const cat = p.category || 'Other';
    if (!expenseByCategory[cat]) expenseByCategory[cat] = 0;
    expenseByCategory[cat] += p.amount || 0;
  });

  // Expense by vendor
  const expenseByVendor = {};
  quarterPurchases.forEach((p) => {
    const v = p.vendor || 'Unknown';
    if (!expenseByVendor[v]) expenseByVendor[v] = 0;
    expenseByVendor[v] += p.amount || 0;
  });

  // GST estimation (assuming 5% on food items)
  const GST_RATE = 0.05;
  const taxableSales = totalSales;
  const cgst = Math.round(taxableSales * GST_RATE / 2);
  const sgst = Math.round(taxableSales * GST_RATE / 2);
  const totalGST = cgst + sgst;

  // Net profit estimate
  const netProfit = totalSales - totalExpenses;

  return {
    quarter,
    year,
    months,
    period: `${months[0]} to ${months[2]}`,
    billCount: quarterBills.length,
    purchaseCount: quarterPurchases.length,
    sales: {
      total: totalSales,
      cash: cashSales,
      upi: upiSales,
    },
    expenses: {
      total: totalExpenses,
      cash: cashExpenses,
      online: onlineExpenses,
      byCategory: expenseByCategory,
      byVendor: expenseByVendor,
    },
    gst: {
      rate: GST_RATE * 100,
      taxableSales,
      cgst,
      sgst,
      total: totalGST,
    },
    profit: netProfit,
    itemSales: Object.values(itemSales).sort((a, b) => b.amount - a.amount),
  };
}

// ── Format report as WhatsApp message ────────────────────────
export function formatCAReport(report) {
  const lines = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('🍽️ MEHFIL-E-NIHARI');
  lines.push(`📊 Quarterly GST Report — ${report.quarter} ${report.year}`);
  lines.push(`📅 Period: ${report.period}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Sales Summary
  lines.push('💰 SALES SUMMARY');
  lines.push('─────────────────');
  lines.push(`Total Sales: ₹${report.sales.total.toLocaleString('en-IN')}`);
  lines.push(`  💵 Cash: ₹${report.sales.cash.toLocaleString('en-IN')}`);
  lines.push(`  📱 UPI:  ₹${report.sales.upi.toLocaleString('en-IN')}`);
  lines.push(`Bills: ${report.billCount}`);
  lines.push('');

  // GST
  lines.push(`🧾 GST @ ${report.gst.rate}%`);
  lines.push('─────────────────');
  lines.push(`Taxable Sales: ₹${report.gst.taxableSales.toLocaleString('en-IN')}`);
  lines.push(`CGST (2.5%): ₹${report.gst.cgst.toLocaleString('en-IN')}`);
  lines.push(`SGST (2.5%): ₹${report.gst.sgst.toLocaleString('en-IN')}`);
  lines.push(`Total GST: ₹${report.gst.total.toLocaleString('en-IN')}`);
  lines.push('');

  // Expenses
  lines.push('📦 EXPENSES');
  lines.push('─────────────────');
  lines.push(`Total Expenses: ₹${report.expenses.total.toLocaleString('en-IN')}`);
  lines.push(`  💵 Cash: ₹${report.expenses.cash.toLocaleString('en-IN')}`);
  lines.push(`  🏦 Online: ₹${report.expenses.online.toLocaleString('en-IN')}`);
  lines.push(`Entries: ${report.purchaseCount}`);
  lines.push('');

  // Expense by category
  if (Object.keys(report.expenses.byCategory).length > 0) {
    lines.push('📂 Expense Breakdown:');
    Object.entries(report.expenses.byCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, amt]) => {
        lines.push(`  • ${cat}: ₹${amt.toLocaleString('en-IN')}`);
      });
    lines.push('');
  }

  // Top items
  if (report.itemSales.length > 0) {
    lines.push('🍽️ Top Selling Items:');
    report.itemSales.slice(0, 10).forEach((item, i) => {
      lines.push(`  ${i+1}. ${item.name} — ${item.qty} pcs — ₹${item.amount.toLocaleString('en-IN')}`);
    });
    lines.push('');
  }

  // Net
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`💵 Net Profit: ₹${report.profit.toLocaleString('en-IN')}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('Generated by Mehfil-E-Nihari POS');
  lines.push(new Date().toLocaleString('en-IN'));

  return lines.join('\n');
}

// ── Send to CA via WhatsApp ──────────────────────────────────
export function sendCAToWhatsApp(phone, reportText) {
  const phoneClean = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(reportText);
  const url = `https://wa.me/${phoneClean}?text=${encoded}`;
  window.open(url, '_blank');
}

// ── Send to both CA numbers ──────────────────────────────────
export function sendToBothCA(contacts, reportText) {
  const sent = [];
  if (contacts.phone1) {
    sendCAToWhatsApp(contacts.phone1, reportText);
    sent.push(contacts.name1 || contacts.phone1);
  }
  // WhatsApp can only open one tab at a time, so open first then schedule second
  if (contacts.phone2) {
    setTimeout(() => {
      sendCAToWhatsApp(contacts.phone2, reportText);
    }, 2000);
    sent.push(contacts.name2 || contacts.phone2);
  }
  return sent;
}

// ── Check if quarterly report is due ─────────────────────────
export async function isQuarterDue() {
  const lastSent = await getLastSent();
  const current = getCurrentQuarter();
  if (!lastSent) return true;
  return lastSent.quarter !== current.quarter;
}
