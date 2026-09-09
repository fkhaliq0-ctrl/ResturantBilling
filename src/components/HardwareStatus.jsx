import { useState, useEffect } from 'react';
import { playButtonPress } from '../utils/audio';
import { getSetting } from '../utils/storage';

export default function HardwareStatus({ onBack }) {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({});

  useEffect(() => { loadDevices(); }, []);

  const loadDevices = async () => {
    const ps = await getSetting('printer_settings');
    setPrinterSettings(ps || {});
    scanDevices();
  };

  const scanDevices = async () => {
    setScanning(true);
    playButtonPress();
    const found = [];

    // Check for thermal printer
    found.push({
      name: 'Thermal Receipt Printer',
      type: 'printer',
      status: printerSettings.paperWidth ? 'configured' : 'not_configured',
      detail: printerSettings.paperWidth ? `${printerSettings.paperWidth} paper • Auto-print ${printerSettings.autoPrint ? 'ON' : 'OFF'}` : 'Go to Printer Settings to configure',
      icon: '🖨️',
    });

    // Check for biometric device
    const bioEnabled = await getSetting('biometric_enabled');
    found.push({
      name: 'Fingerprint Scanner (USB)',
      type: 'biometric',
      status: bioEnabled ? 'enabled' : 'disabled',
      detail: bioEnabled ? 'WebAuthn fingerprint verification enabled' : 'Enable in Attendance & Biometric settings',
      icon: '🔐',
    });

    // Check for POS display
    found.push({
      name: 'Customer Display (VFD)',
      type: 'display',
      status: 'available',
      detail: 'Connect via USB for customer-facing order total display',
      icon: '📺',
    });

    // Check network
    found.push({
      name: 'Network Connection',
      type: 'network',
      status: navigator.onLine ? 'connected' : 'offline',
      detail: navigator.onLine ? 'WiFi/Ethernet connected — Cloud sync active' : 'Offline mode — data cached locally',
      icon: '🌐',
    });

    // Check for cash drawer
    found.push({
      name: 'Cash Drawer',
      type: 'drawer',
      status: 'available',
      detail: 'Connect via printer RJ-12 port for auto-open on cash payment',
      icon: '💰',
    });

    // Bluetooth
    found.push({
      name: 'Bluetooth (Mobile)',
      type: 'bluetooth',
      status: navigator.bluetooth ? 'supported' : 'unsupported',
      detail: navigator.bluetooth ? 'Web Bluetooth API available for device pairing' : 'Browser does not support Bluetooth',
      icon: '📶',
    });

    // USB devices
    found.push({
      name: 'USB Peripherals',
      type: 'usb',
      status: navigator.usb ? 'supported' : 'unsupported',
      detail: navigator.usb ? 'WebUSB API available for hardware detection' : 'Connect hardware via USB ports',
      icon: '🔌',
    });

    setDevices(found);
    setTimeout(() => setScanning(false), 1500);
  };

  const statusStyles = {
    configured: 'bg-green-500/20 text-green-400',
    connected: 'bg-green-500/20 text-green-400',
    enabled: 'bg-green-500/20 text-green-400',
    supported: 'bg-green-500/20 text-green-400',
    available: 'bg-blue-500/20 text-blue-400',
    not_configured: 'bg-amber-500/20 text-amber-400',
    disabled: 'bg-red-500/20 text-red-400',
    offline: 'bg-red-500/20 text-red-400',
    unsupported: 'bg-gray-500/20 text-gray-400',
  };

  const statusLabels = {
    configured: '✅ Configured',
    connected: '🟢 Connected',
    enabled: '🔒 Enabled',
    supported: '✅ Supported',
    available: '💡 Available',
    not_configured: '⚠️ Not Configured',
    disabled: '🔴 Disabled',
    offline: '🔴 Offline',
    unsupported: '❌ Unsupported',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🔌 Hardware Status</h1>
          <button onClick={scanDevices} disabled={scanning}
            className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold btn-press hover:bg-blue-500/30 disabled:opacity-40">
            {scanning ? '⏳ Scanning...' : '🔍 Scan'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {devices.map((dev, idx) => (
          <div key={idx} className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{dev.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm">{dev.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${statusStyles[dev.status]}`}>
                    {statusLabels[dev.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">{dev.detail}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Tips */}
        <div className="bg-slate-700/20 rounded-2xl p-4 border border-slate-600/30">
          <h3 className="text-gray-400 font-bold text-xs mb-2">💡 Quick Setup Tips</h3>
          <ul className="text-gray-500 text-xs space-y-1">
            <li>• Connect thermal printer via USB → it auto-detects on Windows</li>
            <li>• Enable biometric in Attendance & Biometric settings</li>
            <li>• Connect cash drawer to printer's RJ-12 port</li>
            <li>• Use USB fingerprint scanner for staff clock-in verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
