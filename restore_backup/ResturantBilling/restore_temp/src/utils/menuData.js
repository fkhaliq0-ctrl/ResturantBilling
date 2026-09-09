// Mehfil-E-Nihari — Menu Data
// Each item can have `portions`: array of { label, price }
// If `portions` is null, the item has a fixed price (shown as `price`)

export const CATEGORIES = [
  { id: 'buff_nihari', name: 'Buff Nihari', icon: '🍲', color: 'from-amber-700 to-red-900' },
  { id: 'mutton_nihari', name: 'Mutton Nihari', icon: '🥘', color: 'from-red-800 to-rose-900' },
  { id: 'bheja', name: 'Bheja', icon: '🫕', color: 'from-orange-700 to-amber-900' },
  { id: 'grill', name: 'Grill', icon: '🍢', color: 'from-yellow-700 to-orange-900' },
  { id: 'others', name: 'Others & Drinks', icon: '🍛', color: 'from-emerald-700 to-teal-900' },
];

export const DEFAULT_ITEMS = [
  // ── Buff Nihari (Portions: Single / Double) ──────────────
  { id: 'bn_1', category: 'buff_nihari', name: 'Buff Nihari', icon: '🍲', portions: [{ label: 'Single', price: 120 }, { label: 'Double', price: 240 }] },
  { id: 'bn_2', category: 'buff_nihari', name: 'Buff Nihari - Desi Ghee', icon: '🍲', portions: [{ label: 'Single', price: 150 }, { label: 'Double', price: 300 }] },
  { id: 'bn_3', category: 'buff_nihari', name: 'Buff Nihari - Butter', icon: '🧈', portions: [{ label: 'Single', price: 150 }, { label: 'Double', price: 300 }] },
  { id: 'bn_4', category: 'buff_nihari', name: 'Buff Nalli', icon: '🍖', portions: [{ label: 'Single', price: 100 }, { label: 'Double', price: 200 }] },
  { id: 'bn_5', category: 'buff_nihari', name: 'Buff Nalli - Desi Ghee', icon: '🍖', portions: [{ label: 'Single', price: 130 }, { label: 'Double', price: 260 }] },
  { id: 'bn_6', category: 'buff_nihari', name: 'Buff Nalli - Butter', icon: '🧈', portions: [{ label: 'Single', price: 130 }, { label: 'Double', price: 260 }] },
  { id: 'bn_7', category: 'buff_nihari', name: 'Buff Nalli Nihari', icon: '🍲', portions: [{ label: 'Single', price: 220 }, { label: 'Double', price: 440 }] },
  { id: 'bn_8', category: 'buff_nihari', name: 'Buff Nalli Nihari - Desi Ghee', icon: '🍲', portions: [{ label: 'Single', price: 250 }, { label: 'Double', price: 500 }] },
  { id: 'bn_9', category: 'buff_nihari', name: 'Buff Nalli Nihari - Butter', icon: '🧈', portions: [{ label: 'Single', price: 250 }, { label: 'Double', price: 500 }] },

  // ── Mutton Nihari (Portions: Single / Double) ────────────
  { id: 'mn_1', category: 'mutton_nihari', name: 'Mutton Nihari', icon: '🥘', portions: [{ label: 'Single', price: 350 }, { label: 'Double', price: 700 }] },
  { id: 'mn_2', category: 'mutton_nihari', name: 'Mutton Nihari - Desi Ghee', icon: '🥘', portions: [{ label: 'Single', price: 380 }, { label: 'Double', price: 760 }] },
  { id: 'mn_3', category: 'mutton_nihari', name: 'Mutton Nihari - Butter', icon: '🧈', portions: [{ label: 'Single', price: 380 }, { label: 'Double', price: 760 }] },

  // ── Bheja (Fixed Portions) ───────────────────────────────
  { id: 'bh_1', category: 'bheja', name: 'Mutton Bheja', icon: '🫕', price: 170, portions: null },
  { id: 'bh_2', category: 'bheja', name: 'Mutton Bheja - Desi Ghee', icon: '🫕', price: 200, portions: null },
  { id: 'bh_3', category: 'bheja', name: 'Mutton Bheja - Butter', icon: '🧈', price: 200, portions: null },

  // ── Grill (Portions: 2pcs / 4pcs for Kawab, Half / Full for Pasanda) ─
  { id: 'gr_1', category: 'grill', name: 'Buff Kawab', icon: '🍢', portions: [{ label: '2 pcs', price: 80 }, { label: '4 pcs', price: 160 }] },
  { id: 'gr_2', category: 'grill', name: 'Buff Kawab Gravy', icon: '🍢', portions: [{ label: '2 pcs', price: 100 }, { label: '4 pcs', price: 200 }] },
  { id: 'gr_3', category: 'grill', name: 'Pasanda Kawab', icon: '🍢', portions: [{ label: 'Half', price: 500 }, { label: 'Full', price: 1000 }] },

  // ── Others & Drinks ──────────────────────────────────────
  { id: 'od_1', category: 'others', name: 'Chicken Biryani', icon: '🍛', portions: [{ label: 'Half', price: 150 }, { label: 'Full', price: 300 }] },
  { id: 'od_2', category: 'others', name: 'Buff Qorma', icon: '🍛', portions: [{ label: 'Half', price: 150 }, { label: 'Full', price: 300 }] },
  { id: 'od_3', category: 'others', name: 'Kheer', icon: '🍚', price: 50, portions: null },
  { id: 'od_4', category: 'others', name: 'Roti', icon: '🫓', price: 10, portions: null },
  { id: 'od_5', category: 'others', name: 'Extra Buff Gravy', icon: '🥣', price: 30, portions: null },
  { id: 'od_6', category: 'others', name: 'Extra Mutton Gravy', icon: '🥣', price: 50, portions: null },
  { id: 'od_7', category: 'others', name: 'Cold Drink / Water', icon: '🥤', price: 0, portions: null, note: 'M.R.P' },
];
