// Automated Quarterly CA WhatsApp Dispatcher
// Builds GST/sales/expense reports for CA and sends via WhatsApp

import { getAllBills } from "./storage";
import { getAllPurchases } from "./expenses";
import { getSetting, setSetting } from "./storage";
import { Browser } from "@capacitor/browser";

const CA_CONTACTS_KEY = "ca_contacts";
const CA_LAST_SENT_KEY = "ca_last_sent";

export async function getCAContacts() {
const data = await getSetting(CA_CONTACTS_KEY);
return data || { phone1: "", name1: "", phone2: "", name2: "" };
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

export function getCurrentQuarter(date = new Date()) {
const month = date.getMonth();
const year = date.getFullYear();
if (month < 3) return { quarter: "Q4", year: year - 1, label: `Oct ${year-1} – Mar ${year}` };
if (month < 6) return { quarter: "Q1", year, label: `Apr ${year} – Jun ${year}` };
if (month < 9) return { quarter: "Q2", year, label: `Jul ${year} – Sep ${year}` };
return { quarter: "Q3", year, label: `Oct ${year} – Dec ${year}` };
}

export function getQuarterMonths(quarter, year) {
switch (quarter) {
case "Q1": return [`${year}-04`, `${year}-05`, `${year}-06`];
case "Q2": return [`${year}-07`, `${year}-08`, `${year}-09`];
case "Q3": return [`${year}-10`, `${year}-11`, `${year}-12`];
case "Q4": return [`${year+1}-01`, `${year+1}-02`, `${year+1}-03`];
default: return [];
}
}

export async function buildQuarterlyReport(quarter, year) {
const months = getQuarterMonths(quarter, year);
const allBills = await getAllBills();
const allPurchases = await getAllPurchases();

const quarterBills = allBills.filter((b) => months.some((m) => b.date?.startsWith(m)));
const quarterPurchases = allPurchases.filter((p) => months.some((m) => p.date?.startsWith(m)));

const totalSales = quarterBills.reduce((s, b) => s + (b.total || 0), 0);
const cashSales = quarterBills.filter((b) => b.paymentMethod === "cash").reduce((s, b) => s + b.total, 0);
const upiSales = quarterBills.filter((b) => b.paymentMethod === "upi").reduce((s, b) => s + b.total, 0);

const itemSales = {};
quarterBills.forEach((b) => {
b.items?.forEach((item) => {
  const key = item.name + (item.portion ? ` (${item.portion})` : "");
  if (!itemSales[key]) itemSales[key] = { name: key, qty: 0, amount: 0 };
  itemSales[key].qty += item.qty;
  itemSales[key].amount += item.price * item.qty;
});
});

const totalExpenses = quarterPurchases.reduce((s, p) => s + (p.amount || 0), 0);
const cashExpenses = quarterPurchases.filter((p) => p.paymentMethod === "cash").reduce((s, p) => s + p.amount, 0);
const onlineExpenses = quarterPurchases.filter((p) => p.paymentMethod !== "cash").reduce((s, p) => s + p.amount, 0);

const expenseByCategory = {};
quarterPurchases.forEach((p) => {
const cat = p.category || "Other";
if (!expenseByCategory[cat]) expenseByCategory[cat] = 0;
expenseByCategory[cat] += p.amount || 0;
});

const expenseByVendor = {};
quarterPurchases.forEach((p) => {
const v = p.vendor || "Unknown";
if (!expenseByVendor[v]) expenseByVendor[v] = 0;
expenseByVendor[v] += p.amount || 0;
});

const GST_RATE = 0.05;
const taxableSales = totalSales;
const cgst = Math.round(taxableSales * GST_RATE / 2);
const sgst = Math.round(taxableSales * GST_RATE / 2);
const totalGST = cgst + sgst;

const netProfit = totalSales - totalExpenses;

return {
quarter,
year,
months,
period: `${months[0]} to ${months[2]}`,
billCount: quarterBills.length,
purchaseCount: quarterPurchases.length,
sales: { total: totalSales, cash: cashSales, upi: upiSales },
expenses: { total: totalExpenses, cash: cashExpenses, online: onlineExpenses, byCategory: expenseByCategory, byVendor: expenseByVendor },
gst: { rate: GST_RATE * 100, taxableSales, cgst, sgst, total: totalGST },
profit: netProfit,
itemSales: Object.values(itemSales).sort((a, b) => b.amount - a.amount),
};
}

export function formatCAReport(report) {
const lines = [];
lines.push("══════════════════");
lines.push("🍲 MEHFIL-E-NIHARI");
lines.push(`📊 Quarterly GST Report — ${report.quarter} ${report.year}`);
lines.push(`📅 Period: ${report.period}`);
lines.push("══════════════════");
lines.push("");
lines.push("💰 SALES SUMMARY");
lines.push("────────────────");
lines.push(`Total Sales: ₹${report.sales.total.toLocaleString("en-IN")}`);
lines.push(`  💵 Cash: ₹${report.sales.cash.toLocaleString("en-IN")}`);
lines.push(`  📱 UPI:  ₹${report.sales.upi.toLocaleString("en-IN")}`);
lines.push(`Bills: ${report.billCount}`);
lines.push("");
lines.push(`🧾 GST @ ${report.gst.rate}%`);
lines.push("────────────────");
lines.push(`Taxable Sales: ₹${report.gst.taxableSales.toLocaleString("en-IN")}`);
lines.push(`CGST (2.5%): ₹${report.gst.cgst.toLocaleString("en-IN")}`);
lines.push(`SGST (2.5%): ₹${report.gst.sgst.toLocaleString("en-IN")}`);
lines.push(`Total GST: ₹${report.gst.total.toLocaleString("en-IN")}`);
lines.push("");
lines.push("📦 EXPENSES");
lines.push("────────────────");
lines.push(`Total Expenses: ₹${report.expenses.total.toLocaleString("en-IN")}`);
lines.push(`  💵 Cash: ₹${report.expenses.cash.toLocaleString("en-IN")}`);
lines.push(`  💳 Online: ₹${report.expenses.online.toLocaleString("en-IN")}`);
lines.push(`Entries: ${report.purchaseCount}`);
lines.push("");
lines.push("Generated by Mehfil-E-Nihari POS");
return lines.join("\\n");
}

export async function sendCAToWhatsApp(phone, reportText) {
const phoneClean = phone.replace(/\\D/g, "");
const encoded = encodeURIComponent(reportText);
const url = `https://wa.me/${phoneClean}?text=${encoded}`;
await Browser.open({ url });
}

export function sendToBothCA(contacts, reportText) {
const sent = [];
if (contacts.phone1) {
sendCAToWhatsApp(contacts.phone1, reportText);
sent.push(contacts.name1 || contacts.phone1);
}
if (contacts.phone2) {
setTimeout(() => {
  sendCAToWhatsApp(contacts.phone2, reportText);
}, 2000);
sent.push(contacts.name2 || contacts.phone2);
}
return sent;
}

export async function isQuarterDue() {
const lastSent = await getLastSent();
const current = getCurrentQuarter();
if (!lastSent) return true;
return lastSent.quarter !== current.quarter;
}