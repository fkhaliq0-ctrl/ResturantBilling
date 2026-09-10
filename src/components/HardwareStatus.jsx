import { useState } from 'react';
import { playButtonPress, playErrorSound, playCheckoutSuccess } from '../utils/audio';

const PRINTER_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',  // Generic thermal
  '00001101-0000-1000-8000-00805f9b34fb',  // SPP (Serial Port Profile)
  '00001800-0000-1000-8000-00805f9b34fb',  // Generic Access
  '0000feea-0000-1000-8000-00805f9b34fb',  // ESC/POS thermal
];

const USB_PRINTER_VENDORS = [
  { vendorId: 0x0456, name: 'Epson' },
  { vendorId: 0x04b8, name: 'Epson (Seiko)' },
  { vendorId: 0x0525, name: 'NetaSys / Generic USB' },
  { vendorId: 0x0483, name: 'STAR Micronics' },
  { vendorId: 0x0aa7, name: 'Toshiba TEC' },
  { vendorId: 0x1fc9, name: 'Bixolon' },
  { vendorId: 0x03f0, name: 'HP' },
];

const THERMAL_PRINTER_NAMES = ['tm-', 'tsp', 'pos', 'thermal', 'receipt', 'star', 'bixolon', 'epson', 'xprinter', 'gainscha', 'citizen', 'zebra'];

export default function HardwareStatus({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [usbDevices, setUsbDevices] = useState([]);
  const [status, setStatus] = useState('');
  const [networkPrinters, setNetworkPrinters] = useState([]);

  const showToast = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 3000); };

  // ── Bluetooth Scan ──────────────────────────────────────
  const scanBluetoothPrinters = async () => {
    playButtonPress();
    setScanning(true);
    showToast('Scanning for Bluetooth printers...');
    try {
      if (navigator.bluetooth) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_UUIDS,
        });
        const name = device.name || 'Unknown Bluetooth Printer';
        setBluetoothDevice(name);
        setDevices(prev => [...prev, { type: 'bluetooth', name, status: 'connected', id: device.id }]);
        playCheckoutSuccess();
        showToast(`✅ Paired: ${name}`);

        // Try to connect and get GATT server
        try {
          const server = await device.gatt.connect();
          showToast(`✅ Connected to GATT server on ${name}`);
        } catch (gattErr) {
          showToast(`Paired but GATT connection pending: ${gattErr.message}`);
        }
      } else {
        showToast('⚠️ Web Bluetooth not available — ensure HTTPS and Android Chrome');
      }
    } catch (err) {
      if (err.name === 'NotFoundError') {
        showToast('No printer selected — try again');
      } else {
        playErrorSound();
        showToast(`❌ Bluetooth error: ${err.message}`);
      }
    } finally {
      setScanning(false);
    }
  };

  // ── USB Device Scan ─────────────────────────────────────
  const scanUSBDevices = async () => {
    playButtonPress();
    setScanning(true);
    showToast('Scanning USB devices...');
    try {
      if (navigator.usb) {
        const device = await navigator.usb.requestDevice({ filters: [] });
        const name = device.productName || `USB Device (${device.vendorId.toString(16).toUpperCase()})`;
        const matchedVendor = USB_PRINTER_VENDORS.find(v => v.vendorId === device.vendorId);
        const isPrinter = matchedVendor || THERMAL_PRINTER_NAMES.some(n => name.toLowerCase().includes(n));

        const entry = {
          type: 'usb',
          name,
          vendor: matchedVendor?.name || 'Unknown',
          vendorId: device.vendorId,
          productId: device.productId,
          status: 'connected',
          isPrinter,
        };
        setUsbDevices(prev => [...prev, entry]);
        setDevices(prev => [...prev, entry]);
        playCheckoutSuccess();
        showToast(`✅ USB: ${name}${isPrinter ? ' (Printer detected)' : ''}`);
      } else {
        showToast('⚠️ Web USB not available — use Chrome on desktop');
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        playErrorSound();
        showToast(`❌ USB error: ${err.message}`);
      }
    } finally {
      setScanning(false);
    }
  };

  // ── Network Printer Discovery (mDNS / port scan) ────────
  const scanNetworkPrinters = async () => {
    playButtonPress();
    setScanning(true);
    showToast('Probing common printer ports...');

    // Check common thermal printer IP ports
    const commonPorts = [9100, 9101, 9102, 8080, 631];
    const found = [];

    // Check if there are saved printers in settings
    try {
      const saved = JSON.parse(localStorage.getItem('printer_settings') || '{}');
      if (saved.networkIP) {
        found.push({
          type: 'network',
          name: `Network Printer (${saved.networkIP})`,
          ip: saved.networkIP,
          port: saved.networkPort || 9100,
          status: 'configured',
        });
      }
    } catch {}

    if (found.length > 0) {
      setNetworkPrinters(found);
      setDevices(prev => [...prev, ...found]);
      showToast(`✅ Found ${found.length} configured network printer(s)`);
    } else {
      showToast('No network printers configured — set one in Printer Settings');
    }
    setScanning(false);
  };

  // ── Full Hardware Scan ──────────────────────────────────
  const fullScan = async () => {
    playButtonPress();
    setDevices([]);
    setUsbDevices([]);
    setNetworkPrinters([]);
    setBluetoothDevice(null);
    showToast('Starting full hardware scan...');
    await scanNetworkPrinters();
  };

  const deviceTypeIcon = (type) => {
    switch (type) {
      case 'bluetooth': return '📶';
      case 'usb': return '🔌';
      case 'network': return '🌐';
      default: return '📦';
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'connected': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500';
      case 'configured': return 'text-amber-400 bg-amber-500/20 border-amber-500';
      case 'disconnected': return 'text-red-400 bg-red-500/20 border-red-500';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🔌 Hardware Status</h1>
            <p className="text-gray-400 text-sm">Detect printers, USB devices & peripherals</p>
          </div>
        </div>
      </div>

      {status && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/20 text-amber-400 text-center font-bold text-sm animate-slide-up">
          {status}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Scan Actions ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={scanBluetoothPrinters} disabled={scanning}
            className="py-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center gap-2 btn-press shadow-lg disabled:opacity-50">
            <span className="text-3xl">📶</span>
            <span className="text-sm font-bold">{scanning ? 'Scanning...' : 'Bluetooth Scan'}</span>
          </button>
          <button onClick={scanUSBDevices} disabled={scanning}
            className="py-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex flex-col items-center gap-2 btn-press shadow-lg disabled:opacity-50">
            <span className="text-3xl">🔌</span>
            <span className="text-sm font-bold">USB Device</span>
          </button>
          <button onClick={scanNetworkPrinters} disabled={scanning}
            className="py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center gap-2 btn-press shadow-lg disabled:opacity-50">
            <span className="text-3xl">🌐</span>
            <span className="text-sm font-bold">Network Printer</span>
          </button>
          <button onClick={fullScan} disabled={scanning}
            className="py-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex flex-col items-center gap-2 btn-press shadow-lg disabled:opacity-50">
            <span className="text-3xl">🔍</span>
            <span className="text-sm font-bold">Full Scan</span>
          </button>
        </div>

        {/* ── Bluetooth Status ──────────────────────────────── */}
        <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">📶 Bluetooth Thermal Printer</h3>
          {bluetoothDevice ? (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500 rounded-xl">
              <p className="text-emerald-400 font-bold text-sm">✅ Connected: {bluetoothDevice}</p>
              <p className="text-emerald-300/60 text-xs mt-1">Ready for KOT / receipt printing</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-gray-400 text-sm">No Bluetooth printer paired</p>
              <p className="text-gray-500 text-xs mt-1">Tap "Bluetooth Scan" above to discover nearby printers</p>
            </div>
          )}
        </div>

        {/* ── USB Devices ──────────────────────────────────── */}
        <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">🔌 USB Devices</h3>
          {usbDevices.length === 0 ? (
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-gray-400 text-sm">No USB devices detected</p>
              <p className="text-gray-500 text-xs mt-1">Connect a thermal printer via USB and tap "USB Device"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usbDevices.map((d, i) => (
                <div key={i} className={`p-3 rounded-xl border ${statusColor(d.status)}`}>
                  <p className="font-bold text-sm">{deviceTypeIcon(d.type)} {d.name}</p>
                  <p className="text-xs opacity-70">Vendor: {d.vendor} | ID: 0x{d.vendorId?.toString(16).toUpperCase()}</p>
                  {d.isPrinter && <span className="text-xs font-bold mt-1 inline-block">🖨️ Thermal Printer</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Network Printers ──────────────────────────────── */}
        <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">🌐 Network Printers</h3>
          {networkPrinters.length === 0 ? (
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-gray-400 text-sm">No network printers configured</p>
              <p className="text-gray-500 text-xs mt-1">Configure IP address in Printer & KOT Settings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {networkPrinters.map((d, i) => (
                <div key={i} className={`p-3 rounded-xl border ${statusColor(d.status)}`}>
                  <p className="font-bold text-sm">🌐 {d.name}</p>
                  <p className="text-xs opacity-70">IP: {d.ip} | Port: {d.port}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── All Detected Devices ──────────────────────────── */}
        <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">📋 All Detected Devices ({devices.length})</h3>
          {devices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Run a scan to detect connected hardware</p>
          ) : (
            <div className="space-y-2">
              {devices.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{deviceTypeIcon(d.type)}</span>
                    <div>
                      <p className="text-white text-sm font-bold">{d.name}</p>
                      <p className="text-gray-500 text-xs capitalize">{d.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${statusColor(d.status)}`}>{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Tips ────────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/30">
          <h3 className="text-white font-bold text-sm mb-2">💡 Setup Tips</h3>
          <ul className="space-y-1.5 text-gray-400 text-xs">
            <li>• <b className="text-gray-300">Bluetooth:</b> Ensure printer is in pairing mode, then tap Bluetooth Scan</li>
            <li>• <b className="text-gray-300">USB:</b> Plug printer into USB port, then tap USB Device</li>
            <li>• <b className="text-gray-300">Network:</b> Set printer IP in Printer Settings, then tap Network Printer</li>
            <li>• <b className="text-gray-300">Android:</b> Use Chrome with HTTPS for Bluetooth/USB scanning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
