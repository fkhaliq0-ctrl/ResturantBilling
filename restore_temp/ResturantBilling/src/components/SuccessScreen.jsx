import { useEffect, useState } from 'react';

export default function SuccessScreen({ bill, paymentMethod, onNewBill, onViewReport }) {
  const [showCheck, setShowCheck] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(bill.discountValue || 0);
  const [discountType, setDiscountType] = useState(bill.discountType || 'flat');
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [whatsappNum, setWhatsappNum] = useState(bill.whatsapp || '');

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
  }, []);

  const methodName = paymentMethod === 'cash' ? '💵 Cash Payment' : paymentMethod === 'credit' ? '📋 Credit Payment' : '📱 UPI / QR Payment';
  const methodColor = paymentMethod === 'cash' ? 'text-green-400' : paymentMethod === 'credit' ? 'text-purple-400' : 'text-blue-400';

  // ── Discount calculation ────────────────────────────────
  const subtotal = bill.subtotal || bill.originalTotal || bill.total;
  const discountAmount = discountType === 'percent'
    ? Math.round(subtotal * (discountValue / 100))
    : discountValue;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // ── Print bill ──────────────────────────────────────────
  const handlePrint = () => {
    const items = bill.items.map(i =>
      `${i.name}${i.portion ? ` (${i.portion})` : ''} ×${i.qty} — ₹${i.price * i.qty}`
    ).join('\n');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Bill</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
        h2 { text-align: center; margin: 0; }
        .item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ccc; }
        .total { font-size: 18px; font-weight: bold; margin-top: 10px; text-align: right; }
        .info { text-align: center; color: #666; font-size: 12px; margin-top: 10px; }
        .discount { color: red; text-align: right; }
      </style></head><body>
      <h2>🍲 Mehfil-E-Nihari</h2>
      <p style="text-align:center;color:#666;font-size:12px;">${bill.date} • ${bill.time}</p>
      <hr/>
      ${items.split('\n').map(line => {
        const [left, right] = line.split(' — ');
        return `<div class="item"><span>${left}</span><span>${right || ''}</span></div>`;
      }).join('')}
      ${discountAmount > 0 ? `<p class="discount">Discount: -₹${discountAmount}</p>` : ''}
      <div class="total">Total: ₹${finalTotal}</div>
      <p class="info">Payment: ${methodName}</p>
      <p class="info">Bill #${bill.id || '—'}</p>
      <p class="info" style="margin-top:20px;">Thank you! Visit again 🙏</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // ── Send via WhatsApp ───────────────────────────────────
  const handleSendWhatsApp = () => {
    if (!whatsappNum || whatsappNum.length < 10) {
      alert('Enter a valid 10-digit WhatsApp number');
      return;
    }
    const cleanNum = whatsappNum.replace(/\D/g, '');
    const itemsList = bill.items.map(i =>
      `${i.name}${i.portion ? ` (${i.portion})` : ''} ×${i.qty} = ₹${i.price * i.qty}`
    ).join('%0A');
    const msg = `🍽️ *Mehfil-E-Nihari*%0A%0A📋 *Bill #${bill.id || '—'}*%0A${itemsList}%0A%0A💰 Subtotal: ₹${subtotal}%0A${discountAmount > 0 ? `🏷️ Discount: -₹${discountAmount}%0A` : ''}💎 *Total: ₹${finalTotal}*%0A%0APayment: ${methodName}%0AThank you! Visit us again 🙏`;
    window.open(`https://wa.me/91${cleanNum}?text=${msg}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col items-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in px-4 py-6 overflow-y-auto">
      {/* Success checkmark */}
      <div className={`transition-all duration-500 ${showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-pulse-glow">
          <div className="w-18 h-18 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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

      <h1 className="text-2xl font-bold text-white mb-1">Order Complete! 🎉</h1>
      <p className={`text-lg font-semibold ${methodColor} mb-4`}>{methodName}</p>

      {/* Bill summary */}
      <div className="bg-slate-700/50 rounded-2xl p-5 w-full max-w-sm mb-4">
        <h3 className="text-amber-400 font-bold text-lg mb-3 text-center">🍲 Mehfil-E-Nihari</h3>
        <div className="space-y-1.5">
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

        {/* Subtotal */}
        <div className="border-t border-slate-600 mt-2 pt-2 flex justify-between text-gray-400 text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        {/* Discount line (if applied) */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-400 text-sm">
            <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
            <span>-₹{discountAmount}</span>
          </div>
        )}

        {/* Final total */}
        <div className="border-t border-slate-600 mt-2 pt-2 flex justify-between">
          <span className="text-gray-300 text-lg">Total</span>
          <span className="text-amber-400 text-2xl font-bold">₹{finalTotal}</span>
        </div>

        <div className="text-gray-500 text-xs mt-2 text-right">
          Bill #{bill.id || '—'} • {bill.time}
        </div>
      </div>

      {/* ── Discount & WhatsApp Inputs ─────────────────── */}
      <div className="w-full max-w-sm space-y-2 mb-4">
        {/* Discount toggle */}
        <button
          onClick={() => setShowDiscount(!showDiscount)}
          className={`w-full py-2 rounded-xl text-xs font-bold btn-press transition-all flex items-center justify-center gap-2 ${
            discountAmount > 0
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'bg-slate-700 text-gray-400 border border-slate-600 hover:bg-slate-600 hover:text-white'
          }`}
        >
          🏷️ Discount {discountAmount > 0 ? `(-₹${discountAmount})` : ''}
          <span className="text-[10px]">{discountAmount > 0 ? '✕ Clear' : 'Tap to apply'}</span>
        </button>

        {showDiscount && (
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border border-slate-600">
                <button
                  onClick={() => setDiscountType('flat')}
                  className={`px-2 py-1 text-[10px] font-bold btn-press ${
                    discountType === 'flat' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-400'
                  }`}
                >
                  ₹ Flat
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-1 text-[10px] font-bold btn-press ${
                    discountType === 'percent' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-400'
                  }`}
                >
                  % Percent
                </button>
              </div>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : subtotal}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                placeholder={discountType === 'flat' ? '₹ Amount' : '% Percent'}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 
                  text-white text-xs focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
        )}

        {/* WhatsApp toggle */}
        <button
          onClick={() => setShowWhatsapp(!showWhatsapp)}
          className={`w-full py-2 rounded-xl text-xs font-bold btn-press transition-all flex items-center justify-center gap-2 ${
            showWhatsapp
              ? 'bg-green-500/20 text-green-300 border border-green-500/40'
              : 'bg-slate-700 text-gray-400 border border-slate-600 hover:bg-slate-600 hover:text-white'
          }`}
        >
          📱 Send Bill on WhatsApp
        </button>

        {showWhatsapp && (
          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
            <div className="flex gap-2">
              <span className="text-gray-400 text-xs self-center">+91</span>
              <input
                type="tel"
                value={whatsappNum}
                onChange={(e) => setWhatsappNum(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                maxLength={10}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 
                  text-white text-xs focus:outline-none focus:border-green-400"
              />
              <button
                onClick={handleSendWhatsApp}
                disabled={whatsappNum.length < 10}
                className="px-3 py-1 rounded-lg bg-green-600 text-white text-[10px] font-bold 
                  btn-press hover:bg-green-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send ✈️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons (Print + New Order + Report) ── */}
      <div className="flex gap-2 w-full max-w-sm">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 
            text-white text-sm font-bold btn-press shadow-lg hover:shadow-xl transition-all"
        >
          🖨️ Print
        </button>
        <button
          onClick={onNewBill}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 
            text-white text-sm font-bold btn-press shadow-lg hover:shadow-xl transition-all"
        >
          🆕 New Order
        </button>
        <button
          onClick={onViewReport}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 
            text-white text-sm font-bold btn-press shadow-lg hover:shadow-xl transition-all"
        >
          📊 Report
        </button>
      </div>
    </div>
  );
}
