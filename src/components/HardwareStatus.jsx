import React, { useState } from 'react';
import { playButtonPress, playErrorSound, playCheckoutSuccess } from '../utils/audio';

export default function HardwareStatus({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  const scanBluetoothPrinters = async () => {
    playButtonPress();
    setScanning(true);
    try {
      if (navigator.bluetooth && navigator.bluetooth.requestDevice) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        setConnectedDevice(device.name || 'Bluetooth Printer');
        playCheckoutSuccess();
      } else {
        alert('Web Bluetooth requires secure HTTPS and Bluetooth permissions enabled on your Android device.');
      }
    } catch (err) {
      playErrorSound();
      console.error(err);
    } finally {
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
            {scanning ? 'Scanning Bluetooth...' : '🔍 Scan & Pair Bluetooth Printer'}
          </button>
        )}
      </div>
    </div>
  );
}
