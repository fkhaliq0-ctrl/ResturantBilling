// Sales Logging Engine
// Reads and writes live checkout orders to data/salesLog.json
// Provides accurate daily totals for midnight reports

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALES_LOG_PATH = path.join(process.cwd(), 'data', 'salesLog.json');

// ── Initialize sales log file if it doesn't exist ──────────────
function initializeSalesLog() {
  if (!fs.existsSync(path.dirname(SALES_LOG_PATH))) {
    fs.mkdirSync(path.dirname(SALES_LOG_PATH), { recursive: true });
  }
  
  if (!fs.existsSync(SALES_LOG_PATH)) {
    fs.writeFileSync(SALES_LOG_PATH, JSON.stringify([], null, 2));
    console.log('[SalesLog] Initialized sales log file:', SALES_LOG_PATH);
  }
}

// ── Read all sales from log ─────────────────────────────────────
function readSalesLog() {
  try {
    initializeSalesLog();
    const data = fs.readFileSync(SALES_LOG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[SalesLog] Error reading sales log:', error);
    return [];
  }
}

// ── Write sales to log (safely replaces entire file) ────────────
function writeSalesLog(sales) {
  try {
    initializeSalesLog();
    fs.writeFileSync(SALES_LOG_PATH, JSON.stringify(sales, null, 2));
    return true;
  } catch (error) {
    console.error('[SalesLog] Error writing sales log:', error);
    return false;
  }
}

// ── Append a new sale entry (thread-safe) ───────────────────────
export function logSale(saleData) {
  try {
    const sales = readSalesLog();
    
    const newSale = {
      id: saleData.id || Date.now().toString(),
      timestamp: saleData.timestamp || new Date().toISOString(),
      date: saleData.date || new Date().toISOString().split('T')[0],
      invoiceNumber: saleData.invoiceNumber,
      total: saleData.total || 0,
      paymentMethod: saleData.paymentMethod || 'cash',
      items: saleData.items || [],
      customerName: saleData.customerName || null,
      customerPhone: saleData.customerPhone || null,
      tableNumber: saleData.tableNumber || null,
      orderType: saleData.orderType || 'dine-in',
      status: saleData.status || 'completed',
      ...saleData
    };
    
    sales.push(newSale);
    writeSalesLog(sales);
    
    console.log(`[SalesLog] Logged sale #${newSale.invoiceNumber} - ₹${newSale.total}`);
    return newSale;
  } catch (error) {
    console.error('[SalesLog] Error logging sale:', error);
    return null;
  }
}

// ── Get sales for a specific date ───────────────────────────────
export function getSalesByDate(date) {
  const sales = readSalesLog();
  return sales.filter(sale => sale.date === date);
}

// ── Get today's sales ───────────────────────────────────────────
export function getTodaySales() {
  const today = new Date().toISOString().split('T')[0];
  return getSalesByDate(today);
}

// ── Get sales totals for a date ───────────────────────────────────
export function getSalesTotals(date) {
  const sales = getSalesByDate(date);
  
  const totals = sales.reduce((acc, sale) => {
    acc.totalSales += sale.total || 0;
    acc.billCount += 1;
    acc.itemCount += sale.items?.length || 0;
    
    if (sale.paymentMethod === 'cash') {
      acc.cashSales += sale.total || 0;
    } else if (sale.paymentMethod === 'upi') {
      acc.upiSales += sale.total || 0;
    } else if (sale.paymentMethod === 'credit') {
      acc.creditSales += sale.total || 0;
    }
    
    return acc;
  }, {
    totalSales: 0,
    cashSales: 0,
    upiSales: 0,
    creditSales: 0,
    billCount: 0,
    itemCount: 0
  });
  
  return totals;
}

// ── Get sales for a date range ───────────────────────────────────
export function getSalesByDateRange(startDate, endDate) {
  const sales = readSalesLog();
  return sales.filter(sale => sale.date >= startDate && sale.date <= endDate);
}

// ── Get recent sales (last N entries) ─────────────────────────────
export function getRecentSales(limit = 50) {
  const sales = readSalesLog();
  return sales.slice(-limit).reverse();
}

// ── Update an existing sale entry ───────────────────────────────
export function updateSale(saleId, updatedData) {
  try {
    const sales = readSalesLog();
    const index = sales.findIndex(sale => sale.id === saleId);
    
    if (index === -1) {
      console.error('[SalesLog] Sale not found:', saleId);
      return false;
    }
    
    sales[index] = { ...sales[index], ...updatedData, updatedAt: new Date().toISOString() };
    writeSalesLog(sales);
    
    console.log(`[SalesLog] Updated sale #${sales[index].invoiceNumber}`);
    return true;
  } catch (error) {
    console.error('[SalesLog] Error updating sale:', error);
    return false;
  }
}

// ── Delete a sale entry ───────────────────────────────────────────
export function deleteSale(saleId) {
  try {
    const sales = readSalesLog();
    const filtered = sales.filter(sale => sale.id !== saleId);
    
    if (sales.length === filtered.length) {
      console.error('[SalesLog] Sale not found for deletion:', saleId);
      return false;
    }
    
    writeSalesLog(filtered);
    console.log(`[SalesLog] Deleted sale ${saleId}`);
    return true;
  } catch (error) {
    console.error('[SalesLog] Error deleting sale:', error);
    return false;
  }
}

// ── Get sales statistics for daily report ───────────────────────
export function getDailyReportData(date) {
  const sales = getSalesByDate(date);
  const totals = getSalesTotals(date);
  
  // Group by hour
  const hourlyBreakdown = {};
  sales.forEach(sale => {
    const hour = new Date(sale.timestamp).getHours();
    if (!hourlyBreakdown[hour]) {
      hourlyBreakdown[hour] = { count: 0, total: 0 };
    }
    hourlyBreakdown[hour].count += 1;
    hourlyBreakdown[hour].total += sale.total || 0;
  });
  
  // Top selling items
  const itemSales = {};
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { count: 0, total: 0 };
      }
      itemSales[item.name].count += item.qty || 1;
      itemSales[item.name].total += (item.price || 0) * (item.qty || 1);
    });
  });
  
  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }));
  
  return {
    date,
    totals,
    hourlyBreakdown,
    topItems,
    salesCount: sales.length
  };
}

// ── Archive old sales (optional cleanup) ───────────────────────
export function archiveSales(beforeDate) {
  try {
    const sales = readSalesLog();
    const active = sales.filter(sale => sale.date >= beforeDate);
    const archived = sales.filter(sale => sale.date < beforeDate);
    
    if (archived.length === 0) {
      console.log('[SalesLog] No sales to archive');
      return { archived: 0, active: active.length };
    }
    
    // Create archive file
    const archivePath = path.join(path.dirname(SALES_LOG_PATH), `salesLog_archive_${beforeDate}.json`);
    fs.writeFileSync(archivePath, JSON.stringify(archived, null, 2));
    
    // Update main log
    writeSalesLog(active);
    
    console.log(`[SalesLog] Archived ${archived.length} sales to ${archivePath}`);
    return { archived: archived.length, active: active.length };
  } catch (error) {
    console.error('[SalesLog] Error archiving sales:', error);
    return { archived: 0, active: 0, error: error.message };
  }
}

// Initialize on module load
initializeSalesLog();
