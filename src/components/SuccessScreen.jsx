import { useState, useEffect } from "react";
import { playButtonPress, playErrorSound, playCheckoutSuccess } from "../utils/audio";
import { loadBusinessProfileSync, upsertCustomer } from "../utils/storage";

export default function SuccessScreen({ bill, paymentMethod, onNewBill, onBackToOrder }) {
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState({ name: "MEHFIL-E-NIHARI", address: "12A/107, Main Road, Opp metro Pillar No 196, Maujpur, Delhi - 110053", phone: "+91 9990515151", gst: "07ABXFM3984H1ZG", fssai: "23323004001056" });

  useEffect(() => {
    try { setProfile(loadBusinessProfileSync()); } catch (e) { console.error(e); }
  }, []);

  const billId = String((bill?.invoiceNumber ?? bill?.id) ?? "\u2014");
  const tableLabel = bill?.orderType === 'takeaway' || !bill?.tableNumber ? 'Parcel' : 'Table ' + bill.tableNumber;
  const billItems = bill?.items || [];
  const subtotal = bill?.subtotal || bill?.originalTotal || bill?.total || 0;
  const discountAmount = discountType === "percent" ? Math.round(subtotal * (discountValue / 100)) : Math.min(subtotal, discountValue);
  const finalTotal = Math.max(0, subtotal - discountAmount);
  
  // Format date as DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const formattedDate = bill?.date ? formatDate(bill.date) : formatDate(new Date());

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSaveCustomer = async () => {
    if (customerPhone && customerPhone.length >= 10) {
      try { await upsertCustomer(customerPhone, { name: customerName || "Customer", totalSpend: finalTotal, visits: 1 }); } catch (e) { console.error(e); }
    }
  };

  const handlePrint = () => {
    playButtonPress();
    if (window.bluetoothSerial) {
      setPrinting(true);
      var esc = "\x1B"; var LF = "\x0A";
      // ── ESC/POS Logo (if logoPath exists) ─────────────
      var logoPath = profile.logoPath || profile.logo || '';
      var r = '';
      // Print logo bitmap if available (JPEG/PNG as ESC/POS GS v 0)
      if (logoPath && logoPath.startsWith('data:')) {
        try {
          r += esc + "\x61\x01" + LF; // center align
          r += esc + "\x1F\x8B" + LF; // bit image mode placeholder
        } catch (e) { /* skip logo on error */ }
      }
      r += esc + "\x61\x01" + esc + "\x45\x01" + (profile.name || "MEHFIL-E-NIHARI") + esc + "\x45\x00" + LF;
      if (profile.address) r += profile.address + LF;
      if (profile.city || profile.state) r += (profile.city || '') + (profile.city && profile.state ? ', ' : '') + (profile.state || '') + LF;
      if (profile.phone) r += "Phone: " + profile.phone + LF;
      if (profile.gst) r += "GSTIN: " + profile.gst + LF;
      r += "--------------------------------" + LF + esc + "\x61\x00";
      r += "Bill: #" + billId + LF;
      r += "Date: " + (bill?.date || "") + " " + (bill?.time || "") + LF;
      r += "Order: " + tableLabel + LF;
      r += "--------------------------------" + LF;
      billItems.forEach(function(i) {
        var nm = (i.name + " (" + (i.portion || "Regular") + ")").substring(0, 16);
        while (nm.length < 16) nm += " ";
        r += nm + " x" + i.qty + "  Rs." + (i.price * i.qty) + LF;
      });
      r += "--------------------------------" + LF;
      r += "Subtotal:".padEnd(20) + "Rs." + subtotal + LF;
      if (discountAmount > 0) r += "Discount:".padEnd(20) + "-Rs." + discountAmount + LF;
      r += esc + "\x45\x01" + "TOTAL:".padEnd(18) + "Rs." + finalTotal + esc + "\x45\x00" + LF;
      r += "--------------------------------" + LF;
      r += esc + "\x61\x01" + "Thank you! Visit us again" + LF + LF;
      if (profile.fssai || profile.fssaiNumber) r += "FSSAI: " + (profile.fssai || profile.fssaiNumber) + LF + LF;
      window.bluetoothSerial.write(r, function() { playCheckoutSuccess(); setPrinting(false); handleSaveCustomer(); },
        function(err) { playErrorSound(); setPrinting(false); alert("Print failed: " + JSON.stringify(err)); });
    } else {
      var w = window.open("", "_blank");
      if (!w) { alert("Pop-up blocked"); return; }
      var logoUrl = profile.logoPath || profile.logo || '/logo.png';
      var html = '<html><head><title>Receipt</title><style>';
      html += 'body{font-family:monospace;font-size:14px;padding:20px;margin:0;}';
      html += 'h2{text-align:center;margin:4px 0;}';
      html += '.logo{text-align:center;margin-bottom:8px;}';
      html += '.logo img{max-width:160px;height:auto;}'
      html += '.center{text-align:center;}'
      html += '.row{display:flex;justify-content:space-between;align-items:center;padding:2px 0;}'
      html += '.row-total{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:16px;font-weight:bold;border-top:2px solid #000;margin-top:4px;padding-top:6px;}'
      html += '.row-right{display:flex;justify-content:flex-end;gap:12px;}'
      html += '</style></head><body>';
      if (logoUrl) html += '<div class="logo"><img src="' + logoUrl + '" alt="Logo" onerror="this.style.display=\'none\'" /></div>';
      html += '<h2>' + (profile.name || "MEHFIL-E-NIHARI") + '</h2>';
      html += '<p class="center" style="font-size:12px;">' + (profile.address || "") + '</p>';
      if (profile.city || profile.state) html += '<p class="center" style="font-size:11px;">' + (profile.city || '') + (profile.city && profile.state ? ', ' : '') + (profile.state || '') + '</p>';
      html += '<p class="center">Phone: ' + (profile.phone || "") + ' | GSTIN: ' + (profile.gst || "") + '</p><hr>';      html += '<p>Bill #' + billId + ' | ' + tableLabel + ' | ' + (bill?.date || "") + ' ' + (bill?.time || "") + '</p><hr>';
      billItems.forEach(function(i) { html += '<div class="row"><span>' + i.name + ' (' + (i.portion || "Regular") + ') x' + i.qty + '</span><span>Rs.' + (i.price * i.qty) + '</span></div>'; });
      html += '<hr>';
      html += '<div class="row"><span>Subtotal</span><span>Rs.' + subtotal + '</span></div>';
      if (discountAmount > 0) html += '<div class="row" style="color:green;"><span>Discount</span><span>-Rs.' + discountAmount + '</span></div>';
      html += '<div class="row-total"><span>TOTAL</span><span>Rs.' + finalTotal + '</span></div><hr>';
      html += '<p class="center">Thank you! Visit us again</p>';
      if (profile.fssai) html += '<p class="center" style="font-size:10px;">FSSAI: ' + profile.fssai + '</p>';
      html += '</body></html>';
      w.document.write(html); w.document.close();
      setTimeout(function() { w.print(); }, 500);
      setPrinting(false); handleSaveCustomer();
    }
  };

  const handleWhatsApp = () => {
    playButtonPress(); handleSaveCustomer();
    var itemsText = billItems.map(function(i) { return i.name + " (" + (i.portion || "Regular") + ") x" + i.qty + " = Rs." + (i.price * i.qty); }).join("%0A");
    var msg = encodeURIComponent("*" + (profile.name || "MEHFIL-E-NIHARI") + "*%0A" + (profile.address || "") + "%0APhone: " + (profile.phone || "") + "%0A%0ABill #: " + billId + "%0A" + tableLabel + "%0ADate: " + (bill?.date || "") + " " + (bill?.time || "") + "%0A%0A" + itemsText + "%0A%0ASubtotal: Rs." + subtotal + "%0A" + (discountAmount > 0 ? "Discount: -Rs." + discountAmount + "%0A" : "") + "*TOTAL: Rs." + finalTotal + "*%0A%0AThank you! Visit us again");
    var phone = customerPhone ? (customerPhone.startsWith("91") ? customerPhone : "91" + customerPhone) : "";
    window.open(phone ? "https://wa.me/" + phone + "?text=" + msg : "https://wa.me/?text=" + msg, "_blank");
    showToast("Opening WhatsApp...");
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-4 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button onClick={() => { playButtonPress(); onBackToOrder?.(); }}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-3 py-1.5 rounded-xl hover:bg-white/10">
          <span className="text-lg">{"\u2190"}</span><span className="font-semibold text-sm">Back to Order</span>
        </button>
        <button onClick={() => { playButtonPress(); onNewBill?.(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm btn-press hover:bg-green-500/40">
          + New Order
        </button>
      </div>

      <div className="text-center my-3 shrink-0">
        <img src="/logo.png" alt="Logo" className="w-28 h-auto mx-auto object-contain mb-2 drop-shadow-lg" onError={function(e) { e.target.style.display='none'; }} />
        <h2 className="text-2xl font-bold text-white">Order Successful!</h2>
        <p className="text-amber-400 text-sm font-semibold">Payment: {paymentMethod?.toUpperCase() || 'N/A'}</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 mb-3 space-y-2 border border-slate-700">
        <div className="flex justify-between text-sm text-gray-300"><span>Bill #{billId}</span><span>{formattedDate}</span></div>
        <div className="flex justify-between text-sm text-gray-400"><span>{tableLabel}</span><span>{bill?.time || ''}</span></div>
        <div className="border-t border-slate-700 my-1"></div>
        <div className="space-y-1">
          {billItems.map(function(item, idx) {
            return (<div key={idx} className="flex justify-between text-sm"><span>{item.name} ({item.portion || "Regular"}) x{item.qty}</span><span className="text-amber-400">Rs.{item.price * item.qty}</span></div>);
          })}
        </div>
        <div className="border-t border-slate-700 my-1"></div>
        <div className="flex justify-between text-sm text-gray-300"><span>Subtotal</span><span className="font-semibold">Rs.{subtotal}</span></div>
        {discountAmount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Discount</span><span className="font-semibold">-Rs.{discountAmount}</span></div>}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700"><span>Total</span><span className="text-amber-400 text-right">Rs.{finalTotal}</span></div>
      </div>

      {toast && <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="mb-3 shrink-0">
        {!showDiscount ? (
          <button onClick={() => { playButtonPress(); setShowDiscount(true); }}
            className="w-full py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-gray-300 font-bold text-sm btn-press hover:bg-slate-600/50">{"\uD83D\uDCB0"} Apply Discount</button>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4 border border-amber-500/30 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm">Discount</span>
              <button onClick={() => { setShowDiscount(false); setDiscountValue(0); playButtonPress(); }} className="text-red-400 text-xs font-bold btn-press">X Cancel</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDiscountType("percent")} className={"flex-1 py-2 rounded-lg text-xs font-bold " + (discountType === "percent" ? "bg-amber-500 text-white" : "bg-slate-700 text-gray-400")}>% Percent</button>
              <button onClick={() => setDiscountType("flat")} className={"flex-1 py-2 rounded-lg text-xs font-bold " + (discountType === "flat" ? "bg-amber-500 text-white" : "bg-slate-700 text-gray-400")}>{"\u20B9"} Flat</button>
            </div>
            <input type="number" value={discountValue || ""} onChange={function(e) { setDiscountValue(Number(e.target.value)); }}
              placeholder={discountType === "percent" ? "Enter % (e.g. 10)" : "Enter amount"}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
            {discountValue > 0 && <p className="text-green-400 text-xs font-bold">Saving: Rs.{discountAmount} | Final: Rs.{finalTotal}</p>}
          </div>
        )}
      </div>

      <div className="mb-3 shrink-0">
        {!showCustomer ? (
          <button onClick={() => { playButtonPress(); setShowCustomer(true); }}
            className="w-full py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-gray-300 font-bold text-sm btn-press hover:bg-slate-600/50">{"\uD83D\uDC64"} + Add Customer Phone</button>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4 border border-blue-500/30 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm">Customer Details</span>
              <button onClick={() => { setShowCustomer(false); setCustomerPhone(""); setCustomerName(""); playButtonPress(); }} className="text-red-400 text-xs font-bold btn-press">X Cancel</button>
            </div>
            <input type="text" value={customerName} onChange={function(e) { setCustomerName(e.target.value); }} placeholder="Customer name (optional)"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
            <input type="tel" value={customerPhone} onChange={function(e) { setCustomerPhone(e.target.value); }} placeholder="Phone number (for WhatsApp invoice)"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
            {customerPhone && customerPhone.length >= 10 && <p className="text-green-400 text-xs font-bold">Invoice will be sent to +91 {customerPhone}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto shrink-0">
        <button onClick={handlePrint} disabled={printing}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-sm btn-press shadow-xl flex items-center justify-center gap-2">
          {printing ? "Printing..." : "Print Receipt"}
        </button>
        <button onClick={handleWhatsApp}
          className="py-4 px-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-bold text-sm btn-press shadow-xl flex items-center justify-center gap-2">
          WhatsApp
        </button>
      </div>
    </div>
  );
}
