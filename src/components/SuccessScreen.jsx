import { useState } from 'react';
import { playButtonPress } from '../utils/audio';

export default function SuccessScreen({ bill, onNewOrder }) {
  const [discountType] = useState('percent');
  const [discountValue] = useState(0);

  const subtotal = bill.subtotal || bill.originalTotal || bill.total;
  const discountAmount = discountType === 'percent'
    ? Math.round(subtotal * (discountValue / 100))
    : Math.min(subtotal, discountValue);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handlePrint = () => {
    playButtonPress();
    const win = window.open('', '_print', 'width=400,height=600');
    if (!win) {
      alert('Please allow popups for printing');
      return;
    }
    const itemsList = bill.items.map(i => '• ' + i.name + ' (' + (i.portion || 'Regular') + ') × ' + i.qty + ' = ₹' + (i.price * i.qty)).join('<br>');
    
    win.document.write(
      '<html>' +
        '<head>' +
          '<title>Invoice #' + (bill.id || '') + '</title>' +
          '<style>' +
            'body { font-family: monospace; padding: 10px; width: 300px; margin: 0 auto; color: #000; text-align: center; }' +
            '.logo { width: 120px; height: auto; margin-bottom: 5px; }' +
            '.sub { font-size: 11px; margin-bottom: 10px; color: #555; }' +
            '.divider { border-top: 1px dashed #000; margin: 8px 0; }' +
            '.items { text-align: left; font-size: 12px; margin-bottom: 10px; }' +
            '.totals { text-align: right; font-size: 12px; margin-bottom: 10px; }' +
            '.total { font-size: 16px; font-weight: bold; margin-top: 5px; text-align: right; }' +
            '.footer { font-size: 11px; margin-top: 15px; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<img src="/logo.png" class="logo" alt="Mehfil-E-Nihari" />' +
          '<div class="sub">Bill #' + (bill.id || '—') + ' | ' + (bill.date || '') + ' ' + (bill.time || '') + '</div>' +
          '<div class="divider"></div>' +
          '<div class="items">' + itemsList + '</div>' +
          '<div class="divider"></div>' +
          '<div class="totals">' +
            '<div>Subtotal: ₹' + subtotal + '</div>' +
            (discountAmount > 0 ? '<div>Discount: -₹' + discountAmount + '</div>' : '') +
          '</div>' +
          '<div class="total">Total: ₹' + finalTotal + '</div>' +
          '<div class="divider"></div>' +
          '<div class="footer">Thank you! Visit us again 🙏</div>' +
        '</body>' +
      '</html>'
    );
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-4 overflow-y-auto animate-fade-in">
      <div className="text-center my-4">
        <img src="/logo.png" alt="Mehfil-E-Nihari" className="w-32 h-auto mx-auto object-contain mb-2 drop-shadow-lg" />
        <p className="text-gray-400 text-sm">Order Successful!</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 mb-4 space-y-2 border border-slate-700">
        <div className="flex justify-between text-sm text-gray-300">
          <span>Bill ID: #{bill.id || '—'}</span>
          <span>{bill.date}</span>
        </div>
        <div className="divider border-t border-slate-700 my-2"></div>
        <div className="space-y-1">
          {bill.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.name} ({item.portion || 'Regular'}) x{item.qty}</span>
              <span className="text-amber-400">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="divider border-t border-slate-700 my-2"></div>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Discount</span>
            <span>-₹{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
          <span>Total</span>
          <span className="text-amber-400">₹{finalTotal}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-auto">
        <button
          onClick={handlePrint}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-lg btn-press shadow-xl flex items-center justify-center gap-2"
        >
          🖨️ Print Receipt
        </button>
        <button
          onClick={() => { playButtonPress(); onNewOrder?.(); }}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-lg btn-press shadow-xl"
        >
          ➕ New Order
        </button>
      </div>
    </div>
  );
}
