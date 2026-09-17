// Sales Logging Engine
// Reads and writes live checkout orders to data/salesLog.json
// Safe for both Node.js (desktop/server) and React Native (mobile)

const isMobile = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

let fs = null;
let path = null;

if (!isMobile) {
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('[SalesLog] Node modules not available');
  }
}

const SALES_LOG_PATH = path ? path.join(process.cwd(), 'data', 'salesLog.json') : '';

function initializeSalesLog() {
  if (isMobile || !fs || !path) return;
  try {
    if (!fs.existsSync(path.dirname(SALES_LOG_PATH))) {
      fs.mkdirSync(path.dirname(SALES_LOG_PATH), { recursive: true });
    }
    if (!fs.existsSync(SALES_LOG_PATH)) {
      fs.writeFileSync(SALES_LOG_PATH, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('[SalesLog] Init error:', err);
  }
}

export function readSalesLog() {
  if (isMobile || !fs || !path) return [];
  try {
    initializeSalesLog();
    const data = fs.readFileSync(SALES_LOG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[SalesLog] Read error:', error);
    return [];
  }
}

export function writeSalesLog(sales) {
  if (isMobile || !fs || !path) return;
  try {
    initializeSalesLog();
    fs.writeFileSync(SALES_LOG_PATH, JSON.stringify(sales, null, 2));
  } catch (error) {
    console.error('[SalesLog] Write error:', error);
  }
}

export function appendSaleLog(newSale) {
  if (isMobile) {
    console.log('[SalesLog] Mobile environment - relying on Firestore cloud sync.');
    return;
  }
  try {
    const sales = readSalesLog();
    sales.push(newSale);
    writeSalesLog(sales);
  } catch (error) {
    console.error('[SalesLog] Append error:', error);
  }
}

export function logSale(newSale) {
  return appendSaleLog(newSale);
}

initializeSalesLog();
