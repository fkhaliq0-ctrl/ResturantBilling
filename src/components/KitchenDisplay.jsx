import { useState, useEffect } from 'react';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';
import { getAll } from '../utils/storage';

export default function KitchenDisplay({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // all | pending | preparing | ready
  const [timers, setTimers] = useState({});

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const now = Date.now();
        const updated = { ...prev };
        orders.forEach(o => {
          if (o._kitchenStatus === 'preparing' && o._kitchenStartedAt) {
            updated[o.id] = Math.floor((now - new Date(o._kitchenStartedAt).getTime()) / 1000);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  const loadOrders = async () => {
    try {
      const bills = await getAll('bills');
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = bills
        .filter(b => b.date === today && b.items?.length > 0)
        .map(b => ({
          ...b,
          _kitchenStatus: b._kitchenStatus || 'pending',
          _kitchenStartedAt: b._kitchenStartedAt || null,
        }))
        .sort((a, b) => {
          const statusOrder = { pending: 0, preparing: 1, ready: 2 };
          return (statusOrder[a._kitchenStatus] || 0) - (statusOrder[b._kitchenStatus] || 0);
        });
      setOrders(todayOrders);
    } catch { /* ignore */ }
  };

  const updateStatus = (orderId, status) => {
    playButtonPress();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          _kitchenStatus: status,
          _kitchenStartedAt: status === 'preparing' ? new Date().toISOString() : o._kitchenStartedAt,
        };
      }
      return o;
    }));
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o._kitchenStatus === filter);

  const statusColors = {
    pending: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', label: '⏳ Pending' },
    preparing: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: '🔥 Preparing' },
    ready: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', label: '✅ Ready' },
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🍳 Kitchen Display</h1>
          <span className="text-xs text-gray-400">Auto-refreshes every 10s</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 p-3 shrink-0">
        {['all', 'pending', 'preparing', 'ready'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold btn-press transition-colors ${
              filter === f ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400 hover:text-white'
            }`}>
            {f === 'all' ? `All (${orders.length})` : f === 'pending' ? `⏳ ${orders.filter(o => o._kitchenStatus === 'pending').length}` :
             f === 'preparing' ? `🔥 ${orders.filter(o => o._kitchenStatus === 'preparing').length}` :
             `✅ ${orders.filter(o => o._kitchenStatus === 'ready').length}`}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500">
            <span className="text-5xl block mb-4">🍳</span>
            <p className="text-lg font-bold">No orders in kitchen</p>
            <p className="text-sm">Orders will appear here when placed</p>
          </div>
        )}
        {filtered.map(order => {
          const sc = statusColors[order._kitchenStatus] || statusColors.pending;
          const elapsed = timers[order.id] || 0;
          return (
            <div key={order.id} className={`rounded-2xl p-4 border ${sc.bg} ${sc.border} transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-white font-bold text-lg">#{order.id}</span>
                  {order.tableNumber && <span className="text-gray-400 text-xs ml-2">Table {order.tableNumber}</span>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${sc.bg} ${sc.text}`}>{sc.label}</span>
              </div>
              {order._kitchenStatus === 'preparing' && elapsed > 0 && (
                <div className={`text-sm font-mono font-bold mb-2 ${elapsed > 600 ? 'text-red-400' : elapsed > 300 ? 'text-amber-400' : 'text-green-400'}`}>
                  ⏱️ {formatTimer(elapsed)}
                </div>
              )}
              <div className="space-y-1 mb-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-300">{item.qty}× {item.name}</span>
                    <span className="text-gray-500">{item.portion || ''}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {order._kitchenStatus === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'preparing')}
                    className="flex-1 py-2 rounded-xl bg-amber-500/30 text-amber-300 text-xs font-bold btn-press hover:bg-amber-500/50">
                    🔥 Start Preparing
                  </button>
                )}
                {order._kitchenStatus === 'preparing' && (
                  <button onClick={() => updateStatus(order.id, 'ready')}
                    className="flex-1 py-2 rounded-xl bg-green-500/30 text-green-300 text-xs font-bold btn-press hover:bg-green-500/50">
                    ✅ Mark Ready
                  </button>
                )}
                {order._kitchenStatus === 'ready' && (
                  <button onClick={() => updateStatus(order.id, 'pending')}
                    className="flex-1 py-2 rounded-xl bg-red-500/30 text-red-300 text-xs font-bold btn-press hover:bg-red-500/50">
                    🔄 Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
