import { useState, useEffect, useRef } from 'react';
import {
  createBackup, downloadBackup, restoreBackup,
  billsToCSV, purchasesToCSV, auditLogsToCSV,
  downloadCSV, getStoreCounts,
} from '../utils/backup';
import { getAllBills } from '../utils/storage';
import { getAllPurchases } from '../utils/expenses';
import { getAuditLogs } from '../utils/auditLog';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function BackupRestore({ onBack }) {
  const [storeCounts, setStoreCounts] = useState({});
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupDone, setBackupDone] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');
  const [exporting, setExporting] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    const counts = await getStoreCounts();
    setStoreCounts(counts);
  };

  // ── One-Tap Backup ──────────────────────────────────────────
  const handleBackup = async () => {
    setBacking(true);
    setBackupDone(false);
    try {
      const backup = await createBackup();
      downloadBackup(backup);
      playCheckoutSuccess();
      setBackupDone(true);
    } catch (err) {
      playErrorSound();
      alert('Backup failed: ' + err.message);
    }
    setBacking(false);
  };

  // ── Restore from File ───────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMsg('');
    try {
      const content = await file.text();
      const result = await restoreBackup(content);
      playCheckoutSuccess();
      setRestoreMsg(`✅ Restored! ${Object.entries(result.restored).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      await loadCounts();
    } catch (err) {
      playErrorSound();
      setRestoreMsg('❌ Restore failed: ' + err.message);
    }
    setRestoring(false);
    e.target.value = ''; // Reset file input
  };

  // ── CSV Exports ─────────────────────────────────────────────
  const handleExportBills = async () => {
    setExporting('bills');
    playButtonPress();
    try {
      const bills = await getAllBills();
      const csv = billsToCSV(bills);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `MehfilENihari_Sales_${date}.csv`);
    } catch (err) {
      playErrorSound();
      alert('Export failed: ' + err.message);
    }
    setExporting('');
  };

  const handleExportPurchases = async () => {
    setExporting('purchases');
    playButtonPress();
    try {
      const purchases = await getAllPurchases();
      const csv = purchasesToCSV(purchases);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `MehfilENihari_Expenses_${date}.csv`);
    } catch (err) {
      playErrorSound();
      alert('Export failed: ' + err.message);
    }
    setExporting('');
  };

  const handleExportAudit = async () => {
    setExporting('audit');
    playButtonPress();
    try {
      const logs = await getAuditLogs();
      const csv = auditLogsToCSV(logs);
      const date = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `MehfilENihari_AuditLog_${date}.csv`);
    } catch (err) {
      playErrorSound();
      alert('Export failed: ' + err.message);
    }
    setExporting('');
  };

  const totalRecords = Object.values(storeCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button
          onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">💾 Backup & Export</h1>
        <p className="text-gray-400 text-sm">Protect your restaurant data</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Data Summary ────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📊 Data Overview</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'bills', label: 'Bills', icon: '🧾' },
              { key: 'purchases', label: 'Purchases', icon: '📋' },
              { key: 'auditLogs', label: 'Audit Logs', icon: '📝' },
              { key: 'closingStock', label: 'Stock Records', icon: '📦' },
              { key: 'items', label: 'Menu Items', icon: '🍽️' },
              { key: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((s) => (
              <div key={s.key} className="bg-slate-800/50 rounded-xl p-2 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="text-white font-bold text-lg">{storeCounts[s.key] || 0}</p>
                <p className="text-gray-500 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs text-center mt-2">
            Total: {totalRecords} records across {Object.keys(storeCounts).length} tables
          </p>
        </div>

        {/* ── One-Tap Backup ──────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-1">🔒 One-Tap Backup</h3>
          <p className="text-gray-400 text-xs mb-3">
            Exports all data as an encrypted JSON file to your downloads folder
          </p>

          {backupDone && (
            <div className="p-3 rounded-xl bg-green-500/20 text-green-400 text-center font-bold text-sm mb-3 animate-slide-up">
              ✅ Backup downloaded! Save it to a safe location.
            </div>
          )}

          <button
            onClick={handleBackup}
            disabled={backing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
              text-white text-lg font-bold btn-press shadow-xl
              active:from-amber-600 active:to-orange-700 transition-all
              disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {backing ? (
              <span className="animate-pulse">⏳ Creating backup...</span>
            ) : (
              <>💾 Create Full Backup</>
            )}
          </button>
        </div>

        {/* ── Restore ──────────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-1">♻️ Restore from Backup</h3>
          <p className="text-gray-400 text-xs mb-3">
            Upload a previous backup file to restore all restaurant data
          </p>

          {restoreMsg && (
            <div className={`p-3 rounded-xl text-center font-bold text-sm mb-3 animate-slide-up ${
              restoreMsg.startsWith('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {restoreMsg}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => {
              playButtonPress();
              fileInputRef.current?.click();
            }}
            disabled={restoring}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 
              text-white text-lg font-bold btn-press shadow-xl
              active:from-blue-600 active:to-indigo-700 transition-all
              disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {restoring ? (
              <span className="animate-pulse">⏳ Restoring...</span>
            ) : (
              <>📂 Select Backup File to Restore</>
            )}
          </button>
        </div>

        {/* ── CSV / Excel Export ───────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-1">📊 CSV / Excel Export</h3>
          <p className="text-gray-400 text-xs mb-3">
            Quick export to view data in Excel, Google Sheets, or any spreadsheet app
          </p>

          <div className="space-y-2">
            <button
              onClick={handleExportBills}
              disabled={exporting === 'bills'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
                text-white font-bold btn-press shadow-lg flex items-center justify-center gap-2
                disabled:opacity-50 transition-all"
            >
              {exporting === 'bills' ? '⏳ Exporting...' : <>🧾 Export Sales (Bills CSV)</>}
            </button>

            <button
              onClick={handleExportPurchases}
              disabled={exporting === 'purchases'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 
                text-white font-bold btn-press shadow-lg flex items-center justify-center gap-2
                disabled:opacity-50 transition-all"
            >
              {exporting === 'purchases' ? '⏳ Exporting...' : <>📋 Export Expenses (Purchases CSV)</>}
            </button>

            <button
              onClick={handleExportAudit}
              disabled={exporting === 'audit'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 
                text-white font-bold btn-press shadow-lg flex items-center justify-center gap-2
                disabled:opacity-50 transition-all"
            >
              {exporting === 'audit' ? '⏳ Exporting...' : <>📝 Export Audit Log CSV</>}
            </button>
          </div>
        </div>

        {/* ── Info ────────────────────────────────────────── */}
        <div className="bg-slate-700/20 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            💡 Backup files are encrypted with XOR obfuscation.<br />
            Store backups on an external drive or cloud storage.<br />
            CSV files open directly in Excel / Google Sheets.
          </p>
        </div>
      </div>
    </div>
  );
}
