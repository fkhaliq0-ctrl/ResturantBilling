import { useState, useEffect } from 'react';
import { getBillById, updateBill } from '../utils/storage';
import { logEdit, getBillAuditLogs, snapshotBill, sendAuditToWhatsApp } from '../utils/auditLog';
import { playButtonPress, playRemoveSound, playCheckoutSuccess, playErrorSound } from '../utils/audio';

const DEFAULT_OWNER_PHONE = '919999999999';

export default function BillEditor({ bill: initialBill, onBack, onSaved }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState(DEFAULT_OWNER_PHONE);
  const [saved, setSaved] = useState(false);

  // Load the latest version of the bill from DB
  useEffect(() => {
    const load = async () => {
      try {
        const latest = await getBillById(initialBill.id);
        if (latest) {
          // Ensure originalTotal is set
          if (!latest.originalTotal) {
            latest.originalTotal = latest.total;
            await updateBill(latest);
          }
          setBill(latest);
        } else {
          // Fallback to prop
          const fb = { ...initialBill, originalTotal: initialBill.originalTotal || initialBill.total };
          setBill(fb);
        }
      } catch {
        setBill({ ...initialBill, originalTotal: initialBill.originalTotal || initialBill.total });
      }
      setLoading(false);
    };
    load();
  }, [initialBill]);

  // Load audit logs for this bill
  useEffect(() => {
    if (bill?.id) {
      getBillAuditLogs(String(bill.id)).then(setLogs);
    }
  }, [bill?.id, saved]);

  const handleQtyChange = (itemId, newQty) => {
    playButtonPress();
    setBill((prev) => {
      if (!prev) return prev;
      const oldItem = prev.items.find((i) => i.id === itemId);
      if (!oldItem) return prev;

      const oldSnapshot = { ...oldItem, total: oldItem.price * oldItem.qty };

      let newItems;
      let actionType;

      if (newQty <= 0) {
        // Remove item
        newItems = prev.items.filter((i) => i.id !== itemId);
        actionType = 'item_removed';
        playRemoveSound();
      } else {
        // Change qty
        newItems = prev.items.map((i) =>
          i.id === itemId ? { ...i, qty: newQty } : i
        );
        actionType = 'item_qty_changed';
      }

      const newTotal = newItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      const newSnapshot = newQty > 0 ? { ...oldItem, qty: newQty, total: oldItem.price * newQty } : null;

      // Log the edit
      logEdit({
        billId: String(prev.id),
        action: actionType,
        before: oldSnapshot,
        after: newSnapshot,
        details: actionType === 'item_removed'
          ? `Removed ${oldItem.name} (${oldItem.portion || 'Fixed'}) × ${oldItem.qty}`
          : `${oldItem.name} qty ${oldItem.qty} → ${newQty}`,
      });

      return { ...prev, items: newItems, total: newTotal };
    });
  };

  const handleVoidBill = async () => {
    if (!confirm('⚠️ Void this entire bill? This will be logged in the audit trail.')) return;
    playRemoveSound();

    const snapshot = snapshotBill(bill);

    await logEdit({
      billId: String(bill.id),
      action: 'bill_voided',
      before: snapshot,
      after: { items: [], total: 0 },
      details: `Bill #${bill.id} voided — ₹${bill.total}`,
    });

    setBill((prev) => ({ ...prev, items: [], total: 0 }));
  };

  const handleSave = async () => {
    playButtonPress();
    setLoading(true);
    try {
      await updateBill(bill);
      playCheckoutSuccess();
      setSaved(true);
      setTimeout(() => {
        onSaved(bill);
      }, 800);
    } catch (err) {
      playErrorSound();
      alert('Failed to save: ' + err.message);
    }
    setLoading(false);
  };

  const handleSendAuditWhatsApp = () => {
    sendAuditToWhatsApp(bill, logs, ownerPhone);
  };

  if (loading || !bill) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Loading bill...</p>
      </div>
    );
  }

  const hasEdits = logs.length > 0 || bill.items.length === 0;
  const totalDiff = bill.total - (bill.originalTotal || bill.total);

  return (
    <div className="h-full flex flex-col animate-fade-in">
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
            <h1 className="text-2xl font-bold text-white">✏️ Edit Bill #{bill.id || '—'}</h1>
            <p className="text-gray-400 text-sm">{bill.date} • {bill.time}</p>
          </div>
          {hasEdits && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              📝 {logs.length} edit{logs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-green-500/20 text-green-400 text-center font-bold animate-slide-up">
          ✅ Bill saved successfully!
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original vs Edited total */}
        {totalDiff !== 0 && (
          <div className="bg-slate-700/50 rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs">Original: ₹{bill.originalTotal}</p>
              <p className="text-white font-bold text-lg">Edited: ₹{bill.total}</p>
            </div>
            <span className={`text-xl font-bold ${totalDiff < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalDiff > 0 ? '+' : ''}₹{totalDiff}
            </span>
          </div>
        )}

        {/* Bill items */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-amber-400 font-bold mb-3">Items ({bill.items.length})</h3>
          {bill.items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">All items removed (bill voided)</p>
          ) : (
            <div className="space-y-2">
              {bill.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3"
                >
                  <span className="text-2xl">{item.icon || '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                    {item.portion && (
                      <p className="text-amber-400/70 text-xs">{item.portion}</p>
                    )}
                    <p className="text-gray-400 text-xs">₹{item.price} each</p>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQtyChange(item.id, item.qty - 1)}
                      className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 
                        flex items-center justify-center text-xl font-bold btn-press
                        hover:bg-red-500/40 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white font-bold text-lg w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.qty + 1)}
                      className="w-9 h-9 rounded-lg bg-green-500/20 text-green-400 
                        flex items-center justify-center text-xl font-bold btn-press
                        hover:bg-green-500/40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-amber-400 font-bold text-sm w-16 text-right">
                    ₹{item.price * item.qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-slate-700/50 rounded-xl p-4 flex justify-between items-center">
          <span className="text-gray-300 text-lg font-semibold">Bill Total</span>
          <span className="text-white text-3xl font-bold">₹{bill.total}</span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 
              text-white text-lg font-bold btn-press shadow-xl"
          >
            💾 Save Changes
          </button>
          <button
            onClick={handleVoidBill}
            disabled={bill.items.length === 0}
            className="py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 
              text-white text-lg font-bold btn-press shadow-xl disabled:opacity-40"
          >
            ⛔ Void Bill
          </button>
        </div>

        {/* Audit Log Section */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <button
            onClick={() => {
              playButtonPress();
              setShowAudit(!showAudit);
            }}
            className="w-full flex items-center justify-between text-white font-bold"
          >
            <span>📝 Edit & Void Audit Log ({logs.length})</span>
            <span className={`text-xl transition-transform ${showAudit ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showAudit && (
            <div className="mt-3 space-y-2">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-2">No edits recorded</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="bg-slate-800/50 rounded-lg p-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-bold ${
                        log.action === 'bill_voided' ? 'text-red-400' :
                        log.action === 'item_removed' ? 'text-red-300' :
                        'text-amber-400'
                      }`}>
                        {log.action === 'bill_voided' ? '⛔' :
                         log.action === 'item_removed' ? '🗑️' :
                         log.action === 'item_qty_changed' ? '🔢' : '✏️'}
                        {' '}{log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', hour12: true,
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-1">{log.details}</p>
                    {log.before && (
                      <div className="flex gap-4 mt-1">
                        <span className="text-red-300">Before: ₹{log.before.total}</span>
                        {log.after && (
                          <span className="text-green-300">After: ₹{log.after.total}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* WhatsApp send */}
              {logs.length > 0 && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="Owner WhatsApp (e.g. 919999999999)"
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-600 
                      text-white text-sm focus:border-green-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendAuditWhatsApp}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 
                      text-white font-bold btn-press flex items-center justify-center gap-2"
                  >
                    📱 Send Audit Report to Owner (WhatsApp)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
