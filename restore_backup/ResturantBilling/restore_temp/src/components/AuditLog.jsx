import { useState, useEffect } from 'react';
import { getAuditLogs, generateAuditReport, sendAuditToWhatsApp } from '../utils/auditLog';
import { playButtonPress } from '../utils/audio';

const DEFAULT_OWNER_PHONE = '919999999999';

export default function AuditLog({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, removed, qty_changed, voided
  const [expandedLog, setExpandedLog] = useState(null);
  const [ownerPhone, setOwnerPhone] = useState(DEFAULT_OWNER_PHONE);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter((l) => l.action === filter);

  // Group logs by bill
  const billGroups = {};
  filteredLogs.forEach((log) => {
    const key = log.billId || 'unknown';
    if (!billGroups[key]) billGroups[key] = [];
    billGroups[key].push(log);
  });

  const handleSendAllToWhatsApp = () => {
    const fakeBill = {
      id: 'ALL',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      total: 0,
      originalTotal: 0,
    };
    const report = generateAuditReport(fakeBill, filteredLogs);
    const encoded = encodeURIComponent(report);
    const phone = ownerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleSendBillAudit = (billId) => {
    const billLogs = billGroups[billId] || [];
    const lastLog = billLogs[0];
    const fakeBill = {
      id: billId,
      date: lastLog?.date || new Date().toISOString().split('T')[0],
      time: '',
      total: billLogs.reduce((sum, l) => sum + (l.after?.total || 0), 0),
      originalTotal: billLogs.reduce((sum, l) => sum + (l.before?.total || 0), 0),
    };
    sendAuditToWhatsApp(fakeBill, billLogs.reverse(), ownerPhone);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'bill_voided': return '⛔';
      case 'item_removed': return '🗑️';
      case 'item_qty_changed': return '🔢';
      case 'item_price_changed': return '💲';
      default: return '✏️';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'bill_voided': return 'text-red-400 bg-red-500/20';
      case 'item_removed': return 'text-red-300 bg-red-500/10';
      case 'item_qty_changed': return 'text-amber-400 bg-amber-500/20';
      case 'item_price_changed': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button
          onClick={() => {
            playButtonPress();
            onBack();
          }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📝 Edit & Void Log</h1>
            <p className="text-gray-400 text-sm">{logs.length} total modification{logs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 p-3 shrink-0 overflow-x-auto">
        {[
          { key: 'all', label: '📋 All' },
          { key: 'item_removed', label: '🗑️ Removed' },
          { key: 'item_qty_changed', label: '🔢 Qty Changed' },
          { key: 'bill_voided', label: '⛔ Voided' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => {
              playButtonPress();
              setFilter(f.key);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap btn-press transition-all ${
              filter === f.key
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Send all to WhatsApp */}
      {filteredLogs.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 shrink-0">
          <input
            type="text"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="Owner phone"
            className="flex-1 py-2 px-3 rounded-xl bg-slate-700 border border-slate-600 
              text-white text-sm focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleSendAllToWhatsApp}
            className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm 
              btn-press whitespace-nowrap"
          >
            📱 Send All
          </button>
        </div>
      )}

      {/* Log list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg animate-pulse">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-6xl mb-4">✅</span>
            <p className="text-lg text-center">No edits or voids recorded.<br />All bills are original.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(billGroups).map(([billId, billLogs]) => (
              <div key={billId} className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold">
                    Bill #{billId === 'active-cart' ? 'Active Cart' : billId}
                    <span className="text-gray-400 font-normal text-sm ml-2">
                      ({billLogs.length} change{billLogs.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <button
                    onClick={() => handleSendBillAudit(billId)}
                    className="text-xs px-3 py-1 rounded-lg bg-green-600/20 text-green-400 
                      font-bold btn-press hover:bg-green-600/40 transition-colors"
                  >
                    📱
                  </button>
                </div>

                <div className="space-y-2">
                  {billLogs.map((log, idx) => {
                    const isExpanded = expandedLog === log.id;
                    return (
                      <div
                        key={log.id || idx}
                        className="bg-slate-800/50 rounded-xl overflow-hidden"
                      >
                        {/* Log header - clickable */}
                        <button
                          onClick={() => {
                            playButtonPress();
                            setExpandedLog(isExpanded ? null : log.id);
                          }}
                          className="w-full p-3 flex items-center gap-3 text-left"
                        >
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)} {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-400 text-xs flex-1 truncate">
                            {log.details}
                          </span>
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit', hour12: true,
                            })}
                          </span>
                          <span className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {/* Expanded comparison view */}
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2 animate-slide-up">
                            <p className="text-gray-500 text-xs">
                              {new Date(log.timestamp).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true,
                              })}
                            </p>

                            {/* Before / After comparison */}
                            <div className="grid grid-cols-2 gap-2">
                              {log.before && (
                                <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                                  <p className="text-red-400 text-xs font-bold mb-1">⬅ Before</p>
                                  <p className="text-white text-sm">{log.before.name}</p>
                                  {log.before.portion && (
                                    <p className="text-gray-400 text-xs">{log.before.portion}</p>
                                  )}
                                  <p className="text-gray-300 text-xs">
                                    ×{log.before.qty} @ ₹{log.before.price} = ₹{log.before.total}
                                  </p>
                                </div>
                              )}
                              {log.after ? (
                                <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                                  <p className="text-green-400 text-xs font-bold mb-1">After ➡</p>
                                  <p className="text-white text-sm">{log.after.name}</p>
                                  {log.after.portion && (
                                    <p className="text-gray-400 text-xs">{log.after.portion}</p>
                                  )}
                                  <p className="text-gray-300 text-xs">
                                    ×{log.after.qty} @ ₹{log.after.price} = ₹{log.after.total}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-500/10 rounded-lg p-2 border border-gray-500/20 flex items-center justify-center">
                                  <p className="text-gray-500 text-sm italic">Item removed</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
