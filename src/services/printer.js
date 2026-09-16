export function formatReceipt(order, config) {
  return [
    config.name || "MEHFIL-E-NIHARI",
    config.tagline ? config.tagline : "",
    config.fssai ? `FSSAI Lic No: ${config.fssai}` : "",
    "--------------------------------",
    `Bill ID: #${order.id}  Date: ${order.date}`,
    "--------------------------------",
    ...order.items.map(i => `${i.name} x${i.qty} - ?${i.price}`),
    "--------------------------------",
    `TOTAL: ?${order.total}`,
    config.gstin ? `GSTIN: ${config.gstin}` : "",
    "Thank you! Visit Again",
    "\n\n"
  ].filter(Boolean).join("\n");
}
