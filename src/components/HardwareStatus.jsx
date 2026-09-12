import { useState, useEffect } from "react";
import { playButtonPress, playErrorSound, playCheckoutSuccess } from "../utils/audio";

export default function HardwareStatus({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [usbDevices, setUsbDevices] = useState([]);
  const [networkPrinter, setNetworkPrinter] = useState('');
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState('bluetooth');
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    setSystemInfo({
      platform: navigator.platform || 'Unknown',
      hasBluetooth: !!(navigator.bluetooth || window.bluetoothSerial),
      hasUSB: !!navigator.usb,
      hasCapacitor: !!window.bluetoothSerial,
      hasPrint: !!window.print,
    });
  }, []);

  const addLog = (msg) => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog(prev => ['[' + ts + '] ' + msg, ...prev].slice(0, 50));
  };

  const scanBluetoothPrinters = async () => {
    playButtonPress();
    setScanning(true);
    addLog('Starting Bluetooth scan...');

    if (window.bluetoothSerial) {
      addLog('Using native Bluetooth plugin');
      window.bluetoothSerial.list(
        (pairedDevices) => {
          addLog('Found ' + pairedDevices.length + ' paired devices');
          setDevices(pairedDevices);
          if (pairedDevices.length > 0) {
            const target = pairedDevices[0];
            addLog('Connecting to: ' + (target.name || target.address));
            window.bluetoothSerial.connect(target.address,
              () => { setConnectedDevice(target.name || target.address); playCheckoutSuccess(); addLog('Connected: ' + target.name); setScanning(false); },
              () => {
                window.bluetoothSerial.connectInsecure(target.address,
                  () => { setConnectedDevice(target.name || target.address); playCheckoutSuccess(); addLog('Connected (insecure): ' + target.name); setScanning(false); },
                  (err) => { addLog('Connection failed: ' + JSON.stringify(err)); playErrorSound(); alert("Connection failed. Ensure printer is on and paired."); setScanning(false); }
                );
              }
            );
          } else {
            addLog('No paired devices found');
            alert("No paired Bluetooth devices found. Pair your printer in Android Settings first.");
            setScanning(false);
          }
        },
        (err) => { addLog('Bluetooth error: ' + JSON.stringify(err)); playErrorSound(); setScanning(false); }
      );
    } else if (navigator.bluetooth) {
      addLog('Using Web Bluetooth API');
      try {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ namePrefix: 'MTP' }, { namePrefix: 'POS' }, { namePrefix: 'BT' }, { namePrefix: 'Printer' }, { namePrefix: 'ESP' }],
          optionalServices: ['battery_service', '000018f0-0000-1000-8000-00805f9b34fb'],
        });
        addLog('Web Bluetooth: ' + (device.name || 'Unknown'));
        setConnectedDevice(device.name || 'Web Bluetooth Device');
        setDevices([{ name: device.name || 'BT Device', address: device.id }]);
        playCheckoutSuccess();
        setScanning(false);
      } catch (err) { addLog('Web Bluetooth failed: ' + err.message); playErrorSound(); setScanning(false); }
    } else {
      addLog('No Bluetooth API available');
      alert("Bluetooth not available. Use the native Android APK.");
      setScanning(false);
    }
  };

  const scanUSBDevices = async () => {
    playButtonPress(); setScanning(true); addLog('Scanning USB devices...');
    if (navigator.usb) {
      try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        addLog('USB device: ' + (device.productName || 'Unknown'));
        setUsbDevices(prev => [...prev, { name: device.productName || 'USB Device', vendorId: device.vendorId, productId: device.productId }]);
        playCheckoutSuccess(); setScanning(false);
      } catch (err) { addLog('USB scan cancelled'); setScanning(false); }
    } else { alert("WebUSB not available in this browser."); setScanning(false); }
  };

  const testNetworkPrinter = () => {
    playButtonPress();
    if (!networkPrinter) { alert("Enter a printer IP address first"); return; }
    addLog('Testing network printer at ' + networkPrinter + '...');
    fetch('http://' + networkPrinter + '/cgi-bin/epos/service.cgi?devid=local&timeout=10000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: '<text>Test Print - Mehfil-E-Nihari</text>',
    }).then(() => { addLog('Network printer responded'); playCheckoutSuccess(); })
      .catch(() => { addLog('Network printer unreachable'); playErrorSound(); });
  };

  const printTestPage = () => {
    playButtonPress();
    if (!window.bluetoothSerial) { alert("Bluetooth printer plugin not available."); return; }
    var esc = "\x1B"; var LF = "\x0A";
    var testReceipt = esc + "\x61\x01" + '================================\n' + '     MEHFIL-E-NIHARI POS\n' + '     TEST PRINT PAGE\n' + '================================\n\n' + '  Date: ' + new Date().toLocaleDateString('en-IN') + '\n' + '  Time: ' + new Date().toLocaleTimeString('en-IN') + '\n\n' + '  Bluetooth: OK\n' + '  Printer: Connected\n' + '  ESC/POS: Working\n\n' + '================================\n' + '   Printer test successful!\n' + '================================\n\n\n\n';
    window.bluetoothSerial.write(testReceipt, function() { addLog('Test page sent to printer'); playCheckoutSuccess(); },
      function(err) { addLog('Print failed: ' + JSON.stringify(err)); playErrorSound(); });
  };

  const fullSystemScan = () => {
    playButtonPress(); addLog('Running full system scan...');
    setSystemInfo(prev => ({ ...prev, timestamp: new Date().toISOString() }));
    if (window.bluetoothSerial) { scanBluetoothPrinters(); } else { addLog('System scan complete'); }
  };

  var tabs = [
    { id: 'bluetooth', label: 'Bluetooth' },
    { id: 'usb', label: 'USB' },
    { id: 'network', label: 'Network' },
    { id: 'status', label: 'Status' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">{"\u2190"}</span><span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Hardware Status</h1>
        <p className="text-gray-400 text-xs">Scan, connect, and manage printers & peripherals</p>
      </div>

      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ' + (tab === t.id ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'bluetooth' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-gray-300 text-sm">Scan for paired Bluetooth thermal printers and connect for receipt/KOT printing.</p>
              {connectedDevice ? (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500 rounded-xl space-y-2">
                  <p className="text-emerald-400 font-bold">Connected: {connectedDevice}</p>
                  <button onClick={printTestPage} className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-400 font-bold text-sm btn-press">Print Test Page</button>
                </div>
              ) : (
                <button onClick={scanBluetoothPrinters} disabled={scanning}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-lg btn-press shadow-lg disabled:opacity-50">
                  {scanning ? 'Scanning...' : 'Scan & Pair Bluetooth Printer'}
                </button>
              )}
              {devices.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-gray-400 text-xs font-bold">Paired Devices:</h3>
                  {devices.map((d, i) => (
                    <div key={i} className="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">{d.name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs font-mono">{d.address}</p>
                      </div>
                      <span className={'text-xs font-bold px-2 py-1 rounded-lg ' + (d.name === connectedDevice ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400')}>
                        {d.name === connectedDevice ? 'Connected' : 'Paired'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <h3 className="text-white font-bold text-sm mb-2">Setup Tips</h3>
              <ul className="text-gray-400 text-xs space-y-1.5">
                <li>1. Turn on your Bluetooth printer</li>
                <li>2. Pair it in Android Bluetooth Settings (not in-app)</li>
                <li>3. Come back and tap "Scan & Pair"</li>
                <li>4. Printer must be paired to ONE device at a time</li>
                <li>5. For Web Bluetooth: use Chrome on desktop/Android</li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'usb' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-gray-300 text-sm">Detect USB-connected thermal printers (Epson, STAR, Bixolon, etc.)</p>
              <button onClick={scanUSBDevices} disabled={scanning}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg btn-press shadow-lg disabled:opacity-50">
                {scanning ? 'Scanning...' : 'Detect USB Printer'}
              </button>
              {!navigator.usb && <p className="text-amber-400 text-xs">WebUSB not supported. Use Chrome for USB detection.</p>}
            </div>
            {usbDevices.length > 0 && (
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2">
                <h3 className="text-gray-400 text-xs font-bold">Detected USB Devices:</h3>
                {usbDevices.map((d, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-white font-bold text-sm">{d.name}</p>
                    <p className="text-gray-500 text-xs">Vendor: {d.vendorId} | Product: {d.productId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'network' && (
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
            <p className="text-gray-300 text-sm">Connect to network/WiFi printers via IP address (Epson TM series, etc.)</p>
            <div className="flex gap-2">
              <input value={networkPrinter} onChange={e => setNetworkPrinter(e.target.value)} placeholder="Printer IP (e.g. 192.168.1.100)"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none font-mono" />
              <button onClick={testNetworkPrinter} className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm btn-press">Test</button>
            </div>
            <p className="text-gray-500 text-xs">Printer must be on the same WiFi/LAN network</p>
          </div>
        )}

        {tab === 'status' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-3">
              <h3 className="text-white font-bold text-sm">System Status</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Platform', value: systemInfo.platform, icon: 'PC' },
                  { label: 'Bluetooth', value: systemInfo.hasBluetooth ? 'Available' : 'Not Available', icon: 'BT' },
                  { label: 'USB', value: systemInfo.hasUSB ? 'Available' : 'Not Available', icon: 'USB' },
                  { label: 'Native Plugin', value: systemInfo.hasCapacitor ? 'Connected' : 'Not Found', icon: 'App' },
                  { label: 'Web Print', value: systemInfo.hasPrint ? 'Available' : 'Not Available', icon: 'PRN' },
                  { label: 'Printer', value: connectedDevice || 'None', icon: 'DEV' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1"><span className="text-xs">{item.icon}</span><span className="text-gray-400 text-[10px] font-bold uppercase">{item.label}</span></div>
                    <p className="text-white text-xs font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              <button onClick={fullSystemScan} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm btn-press">Full System Scan</button>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
              <h3 className="text-white font-bold text-sm mb-2">Activity Log</h3>
              <div className="bg-slate-900/60 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-xs">
                {log.length === 0 ? <p className="text-gray-500">No activity yet</p> : log.map((entry, i) => <p key={i} className="text-gray-300 py-0.5">{entry}</p>)}
              </div>
              {log.length > 0 && <button onClick={() => setLog([])} className="mt-2 text-gray-500 text-xs btn-press">Clear Log</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
