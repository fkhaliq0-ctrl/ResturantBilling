import { useEffect, useState } from 'react';

export default function SuccessScreen({ bill, paymentMethod, onNewBill, onViewReport }) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
  }, []);

  const methodName = paymentMethod === 'cash' ? '💵 Cash Payment' : '📱 UPI / QR Payment';
  const methodColor = paymentMethod === 'cash' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in px-4">
      {/* Success checkmark */}
      <div className={`transition-all duration-500 ${showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse-glow">
          <div className="w-24 h-24 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg className="w-16 h-16 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path 
                className="animate-check" 
                d="M5 13l4 4L19 7" 
                strokeDasharray="30" 
                strokeDashoffset="30"
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white mb-2">Order Complete! 🎉</h1>
      <p className={`text-xl font-semibold ${methodColor} mb-6`}>{methodName}</p>

      {/* Bill summary */}
      <div className="bg-slate-700/50 rounded-2xl p-6 w-full max-w-sm mb-6">
        <h3 className="text-amber-400 font-bold text-lg mb-3 text-center">🍲 Mehfil-E-Nihari</h3>
        <div className="space-y-2">
          {bill.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-300 text-sm">
              <div className="flex-1 min-w-0">
                <span className="truncate block">{item.name}</span>
                {item.portion && (
                  <span className="text-amber-400/70 text-xs">({item.portion})</span>
                )}
                <span className="text-gray-500 text-xs ml-1">× {item.qty}</span>
              </div>
              <span className="font-semibold text-white ml-2">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-600 mt-3 pt-3 flex justify-between">
          <span className="text-gray-300 text-lg">Total</span>
          <span className="text-amber-400 text-2xl font-bold">₹{bill.total}</span>
        </div>
        <div className="text-gray-500 text-sm mt-2 text-right">
          Bill #{bill.id || '—'} • {bill.time}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={onNewBill}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
            text-white text-xl font-bold btn-press shadow-xl hover:shadow-2xl transition-all"
        >
          🆕 New Order
        </button>
        <button
          onClick={onViewReport}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 
            text-white text-xl font-bold btn-press shadow-xl hover:shadow-2xl transition-all"
        >
          📊 Report
        </button>
      </div>
    </div>
  );
}
