export function formatReceipt(order, config) {
  return [
    config.name || "MEHFIL-E-NIHARI",
    "--------------------------------",
    `Bill ID: #${order.id}  Date: ${order.date}`,
    "--------------------------------",
    ...order.items.map(i => `${i.name} x${i.qty} - ₹${i.price}`),
    "--------------------------------",
    `TOTAL: ₹${order.total}`,
    "Thank you! Visit Again"
  ].join("\n");
}
