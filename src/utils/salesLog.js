// Sales Logging Engine
// Stores live checkout orders in localStorage (browser) or memory (mobile)
// Compatible with Vite browser builds and Capacitor APK

const SALES_KEY = 'sales_log';
let memoryLog = [];

export function readSalesLog() {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(SALES_KEY);
      return data ? JSON.parse(data) : [];
    }
    return memoryLog;
  } catch {
    return [];
  }
}

export function writeSalesLog(sales) {
  memoryLog = sales;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    }
  } catch {
    // Storage full or unavailable — memory fallback
  }
}

export function appendSaleLog(newSale) {
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
