import React, { useState } from "react";
import { playButtonPress, playErrorSound, playCheckoutSuccess } from "../utils/audio";

export default function HardwareStatus({ onBack }) {
const [scanning, setScanning] = useState(false);
const [connectedDevice, setConnectedDevice] = useState(null);

const scanBluetoothPrinters = async () => {
playButtonPress();
setScanning(true);
try {
  if (window.bluetoothSerial) {
    window.bluetoothSerial.list((devices) => {
      if (devices && devices.length > 0) {
        window.bluetoothSerial.connect(devices[0].address, () => {
          setConnectedDevice(devices[0].name || "Bluetooth Printer");
          playCheckoutSuccess();
          setScanning(false);
        }, (err) => {
          playErrorSound();
          alert("Connection failed: " + JSON.stringify(err));
          setScanning(false);
        });
      } else {
        alert("No paired Bluetooth devices found. Please pair your printer in Android Settings first.");
        setScanning(false);
      }
    }, (err) => {
      playErrorSound();
      alert("Bluetooth error: " + JSON.stringify(err));
      setScanning(false);
    });
  } else {
    alert("Native Bluetooth plugin not available in this environment.");
    setScanning(false);
  }
} catch (err) {
  playErrorSound();
  console.error(err);
  setScanning(false);
}
};

return (
<div className="h-full flex flex-col bg-slate-900 text-white p-5 animate-fade-in overflow-y-auto">
  <button onClick={() => { playButtonPress(); onBack(); }} className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-lg btn-press px-3 py-1 rounded-xl bg-white/10 w-fit">← Back</button>
  <h1 className="text-2xl font-bold mb-4">🔌 Hardware & Bluetooth Printer Status</h1>
  <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
    <p className="text-gray-300 text-sm">Connect your portable thermal Bluetooth printer directly for instant receipt and KOT printing.</p>
    {connectedDevice ? (
      <div className="p-4 bg-emerald-500/20 border border-emerald-500 rounded-xl text-emerald-400 font-bold">✅ Connected to: {connectedDevice}</div>
    ) : (
      <button onClick={scanBluetoothPrinters} disabled={scanning} className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-lg btn-press shadow-lg">
        {scanning ? "Scanning Bluetooth..." : "🔍 Scan & Pair Bluetooth Printer"}
      </button>
    )}
  </div>
</div>
);
}