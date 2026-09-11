export function formatReceipt(order, config) {
  return [
    config.name || "MEHFIL-E-NIHARI",
    config.address || "12A/107, Main Road, Opp metro Pillar No 196, Maujpur, Delhi - 110053",
    `Contact: ${config.contactNo || "9990155151"}`,
    `GSTIN: ${config.gstNo || "07ABXFM3984H1ZG"}`,
    `FSSAI: ${config.fssaiNo || "23323004001056"}`,
    "--------------------------------",
    `Bill ID: #${order.id}  Date: ${order.date}`,
    "--------------------------------",
    "Item                Qty    Price",
    "--------------------------------",
    ...order.items.map(i => `${i.name.padEnd(18)} ${i.qty.toString().padEnd(4)} ₹${i.price}`),
    "--------------------------------",
    `SUBTOTAL: ₹${order.subtotal}`,
    `TOTAL: ₹${order.total}`,
    "(GST Inclusive in Price)",
    "--------------------------------",
    "       Thank you! Visit Again",
    "\x0A\x0A\x0A" // Cutter / Feed lines for thermal printer
  ].join("\n");
}
