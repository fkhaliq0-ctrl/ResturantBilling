import React from 'react';

export default function ThermalPrinter({ bill }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black p-6 rounded-xl max-w-sm mx-auto shadow-lg font-sans">
      <div className="text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">Mehfil-E-Nihari</h2>
        <p className="text-xs text-gray-600">Authentic Taste & Tradition</p>
      </div>

      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Bill ID: {bill?.id || 'N/A'}</span>
          <span>{bill?.date} {bill?.time}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Type: {bill?.orderType || 'Takeaway'}</span>
          {bill?.tableNumber && <span>Table: {bill.tableNumber}</span>}
        </div>
      </div>

      <div className="border-b pb-2 mb-2 text-xs font-semibold flex justify-between">
        <span>Item</span>
        <span>Qty / Price</span>
      </div>

      <div className="space-y-2 mb-4 text-xs">
        {bill?.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{item.name} x {item.qty}</span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-2 mb-6 text-sm font-bold flex justify-between">
        <span>Total Amount:</span>
        <span>₹{bill?.total || 0}</span>
      </div>

      <button
        onClick={handlePrint}
        className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
      >
        Print Receipt
      </button>
    </div>
  );
}