import { useState, useEffect } from "react";
import { playButtonPress, playErrorSound, playCheckoutSuccess } from "../utils/audio";
import { loadBusinessProfile } from "../utils/storage";

export default function SuccessScreen({ bill, onNewOrder }) {
const [discountType] = useState("percent");
const [discountValue] = useState(0);
const [printing, setPrinting] = useState(false);
const [profile, setProfile] = useState({ name: "MEHFIL-E-NIHARI", address: "", phone: "", gst: "" });

useEffect(() => {
try {
  const saved = loadBusinessProfile?.() || {};
  setProfile({
    name: saved.name || "MEHFIL-E-NIHARI",
    address: saved.address || saved.storeAddress || "",
    phone: saved.phone || "",
    gst: saved.gst || saved.gstin || ""
  });
} catch (e) {
  console.error(e);
}
}, []);

const subtotal = bill.subtotal || bill.originalTotal || bill.total;
const discountAmount = discountType === "percent"
? Math.round(subtotal * (discountValue / 100))
: Math.min(subtotal, discountValue);
const finalTotal = Math.max(0, subtotal - discountAmount);

const handlePrint = () => {
playButtonPress();
if (!window.bluetoothSerial) {
  alert("Bluetooth printer plugin not found.");
  return;
}

setPrinting(true);

const esc = "\x1B";
const LF = "\x0A";
const ESC_CENTER = esc + "\x61\x01";
const ESC_LEFT = esc + "\x61\x00";
const ESC_BOLD_ON = esc + "\x45\x01";
const ESC_BOLD_OFF = esc + "\x45\x00";

let receiptData = "";
receiptData += ESC_CENTER + ESC_BOLD_ON + (profile.name || "MEHFIL-E-NIHARI") + ESC_BOLD_OFF + LF;
if (profile.address) {
  receiptData += profile.address + LF;
}
if (profile.phone) {
  receiptData += "Phone: " + profile.phone + LF;
}
if (profile.gst) {
  receiptData += "GSTIN: " + profile.gst + LF;
}
receiptData += "--------------------------------" + LF;
receiptData += ESC_LEFT;
receiptData += "Bill ID: #" + (bill.id || "—") + LF;
receiptData += "Date: " + (bill.date || "") + " " + (bill.time || "") + LF;
receiptData += "--------------------------------" + LF;
receiptData += "Item            Qty    Price" + LF;
receiptData += "--------------------------------" + LF;

bill.items.forEach(i => {
  const name = (i.name + " (" + (i.portion || "Regular") + ")").padEnd(16, " ");
  const qty = String(i.qty).padEnd(6, " ");
  const total = "Rs." + (i.price * i.qty);
  receiptData += name + " " + qty + " " + total + LF;
});

receiptData += "--------------------------------" + LF;
receiptData += "Subtotal: Rs." + subtotal + LF;
if (discountAmount > 0) {
  receiptData += "Discount: -Rs." + discountAmount + LF;
}
receiptData += ESC_BOLD_ON + "TOTAL: Rs." + finalTotal + ESC_BOLD_OFF + LF;
receiptData += "--------------------------------" + LF;
receiptData += ESC_CENTER + "Thank you! Visit us again" + LF + LF + LF;

const sendPrintCommand = () => {
  window.bluetoothSerial.write(
    receiptData,
    () => {
      playCheckoutSuccess();
      setPrinting(false);
    },
    (err) => {
      playErrorSound();
      setPrinting(false);
      alert("Printer write failed: " + JSON.stringify(err));
    }
  );
};

window.bluetoothSerial.isConnected(
  () => {
    sendPrintCommand();
  },
  () => {
    window.bluetoothSerial.list(
      (devices) => {
        if (devices && devices.length > 0) {
          window.bluetoothSerial.connect(
            devices[0].address,
            () => {
              sendPrintCommand();
            },
            (err) => {
              setPrinting(false);
              playErrorSound();
              alert("Could not connect to printer: " + JSON.stringify(err));
            }
          );
        } else {
          setPrinting(false);
          playErrorSound();
          alert("No paired Bluetooth printers found.");
        }
      },
      (err) => {
        setPrinting(false);
        playErrorSound();
        alert("Failed to list devices: " + JSON.stringify(err));
      }
    );
  }
);
};

return (
<div className="h-full flex flex-col bg-slate-900 text-white p-4 overflow-y-auto animate-fade-in">
  <div className="text-center my-4">
    <img src="/logo.png" alt="Mehfil-E-Nihari" className="w-32 h-auto mx-auto object-contain mb-2 drop-shadow-lg" />
    <p className="text-gray-400 text-sm">Order Successful!</p>
  </div>

  <div className="bg-slate-800 rounded-2xl p-4 mb-4 space-y-2 border border-slate-700">
    <div className="flex justify-between text-sm text-gray-300">
      <span>Bill ID: #{bill.id || "—"}</span>
      <span>{bill.date}</span>
    </div>
    <div className="divider border-t border-slate-700 my-2"></div>
    <div className="space-y-1">
      {bill.items.map((item, idx) => (
        <div key={idx} className="flex justify-between text-sm">
          <span>{item.name} ({item.portion || "Regular"}) x{item.qty}</span>
          <span className="text-amber-400">Rs.{item.price * item.qty}</span>
        </div>
      ))}
    </div>
    <div className="divider border-t border-slate-700 my-2"></div>
    <div className="flex justify-between text-sm">
      <span>Subtotal</span>
      <span>Rs.{subtotal}</span>
    </div>
    {discountAmount > 0 && (
      <div className="flex justify-between text-sm text-green-400">
        <span>Discount</span>
        <span>-Rs.{discountAmount}</span>
      </div>
    )}
    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
      <span>Total</span>
      <span className="text-amber-400">Rs.{finalTotal}</span>
    </div>
  </div>

  <div className="flex gap-3 mt-auto">
    <button
      onClick={handlePrint}
      disabled={printing}
      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-lg btn-press shadow-xl flex items-center justify-center gap-2"
    >
      {printing ? "Printing..." : "🖨️ Print Receipt"}
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