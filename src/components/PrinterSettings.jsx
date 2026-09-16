import React, { useState, useEffect } from "react";
import PrinterModal from "./PrinterModal";

const CALL_METHOD = (method, ...args) =>
  new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) {
      return reject(new Error("Bluetooth plugin not available"));
    }
    window.bluetoothSerial[method](resolve, reject, ...args);
  });

export default function PrinterSettings() {
  const [savedDevice, setSavedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("printer_device");
    if (stored) {
      try {
        setSavedDevice(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved printer:", e);
      }
    }
  }, []);

  const handleReconnect = async () => {
    if (!savedDevice?.address) return;
    setConnecting(true);
    setStatusMsg(`Connecting to ${savedDevice.name || savedDevice.address}...`);
    try {
      await CALL_METHOD("connect", savedDevice.address);
      setStatusMsg("? Printer connected successfully!");
    } catch (err) {
      setStatusMsg("? Connection failed. Ensure the printer is turned on.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (window.bluetoothSerial) {
        await new Promise((resolve) => window.bluetoothSerial.disconnect(resolve, resolve));
      }
      localStorage.removeItem("printer_device");
      setSavedDevice(null);
      setStatusMsg("Printer disconnected and removed.");
    } catch (e) {
      localStorage.removeItem("printer_device");
      setSavedDevice(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto text-white bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">??? Thermal Printer Hardware</h2>
      
      {statusMsg && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          {statusMsg}
        </div>
      )}

      {savedDevice ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <p className="text-xs text-amber-400 uppercase font-semibold">Configured Printer</p>
            <p className="text-lg font-bold text-white mt-1">{savedDevice.name || "Unnamed Printer"}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{savedDevice.address}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReconnect}
              disabled={connecting}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg font-medium transition text-sm">
              {connecting ? "Connecting..." : "?? Connect Printer Now"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm">
              Change Printer
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2.5 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg font-medium transition text-sm border border-red-600/50">
              Forget
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-gray-400 text-sm">No printer configured yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition shadow-lg">
            ?? Scan & Pair Bluetooth Printer
          </button>
        </div>
      )}

      <PrinterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(device) => {
          setSavedDevice(device);
          setStatusMsg("? Printer saved and connected!");
        }}
      />
    </div>
  );
}
