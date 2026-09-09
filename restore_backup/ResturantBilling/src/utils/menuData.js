// Mehfil-E-Nihari — Menu Data (Trilingual: English + Hindi + Urdu)
// Each item can have `portions`: array of { label, price }
// If `portions` is null, the item has a fixed price (shown as `price`)
// `hi` = Hindi (Devanagari), `ur` = Urdu (Nastaliq) for display
// `image` = high-quality food photo URL (text-free, no watermarks)

export const CATEGORIES = [
  { id: 'buff_nihari', name: 'Buff Nihari', hi: 'बफ़ नहारी', ur: 'بف نہاری', icon: '🍲', color: 'from-amber-700 to-red-900', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=400&fit=crop' },
  { id: 'mutton_nihari', name: 'Mutton Nihari', hi: 'मटन नहारी', ur: 'مٹن نہاری', icon: '🥘', color: 'from-red-800 to-rose-900', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&h=400&fit=crop' },
  { id: 'bheja', name: 'Bheja', hi: 'भेजा', ur: 'بھیجا', icon: '🫕', color: 'from-orange-700 to-amber-900', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop' },
  { id: 'grill', name: 'Grill', hi: 'ग्रिल', ur: 'گرل', icon: '🍢', color: 'from-yellow-700 to-orange-900', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop' },
  { id: 'biryani', name: 'Biryani', hi: 'बिरयानी', ur: 'بریانی', icon: '🍚', color: 'from-green-700 to-emerald-900', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop' },
  { id: 'roti', name: 'Roti & Breads', hi: 'रोटी और ब्रेड', ur: 'روٹی', icon: '🫓', color: 'from-amber-600 to-yellow-800', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop' },
  { id: 'sweets', name: 'Sweets', hi: 'मिठाइयाँ', ur: 'میٹھے', icon: '🍮', color: 'from-pink-600 to-rose-800', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop' },
  { id: 'gravy_extras', name: 'Gravies & Extras', hi: 'ग्रेवी और एक्स्ट्रा', ur: 'گریوی اور اضافے', icon: '🥣', color: 'from-emerald-600 to-teal-800', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&h=400&fit=crop' },
  { id: 'drinks', name: 'Drinks', hi: 'पेय पदार्थ', ur: 'مشروبات', icon: '🥤', color: 'from-cyan-600 to-blue-800', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=400&fit=crop' },
];

export const DEFAULT_ITEMS = [
  // ── Buff Nihari (Portions: Single / Double) ──────────────
  { id: 'bn_1', category: 'buff_nihari', name: 'Buff Nihari', hi: 'बफ़ नहारी', ur: 'بف نہاری', icon: '🍲', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 120 }, { label: 'Double', price: 240 }] },
  { id: 'bn_2', category: 'buff_nihari', name: 'Buff Nihari - Desi Ghee', hi: 'बफ़ नहारी देसी घी', ur: 'بف نہاری دیسی گھی', icon: '🍲', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 150 }, { label: 'Double', price: 300 }] },
  { id: 'bn_3', category: 'buff_nihari', name: 'Buff Nihari - Butter', hi: 'बफ़ नहारी मक्खन', ur: 'بف نہاری مکھن', icon: '🧈', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 150 }, { label: 'Double', price: 300 }] },
  { id: 'bn_4', category: 'buff_nihari', name: 'Buff Nalli', hi: 'बफ़ नल्ली', ur: 'بف نلی', icon: '🍖', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 100 }, { label: 'Double', price: 200 }] },
  { id: 'bn_5', category: 'buff_nihari', name: 'Buff Nalli - Desi Ghee', hi: 'बफ़ नल्ली देसी घी', ur: 'بف نلی دیسی گھی', icon: '🍖', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 130 }, { label: 'Double', price: 260 }] },
  { id: 'bn_6', category: 'buff_nihari', name: 'Buff Nalli - Butter', hi: 'बफ़ नल्ली मक्खन', ur: 'بف نلی مکھن', icon: '🧈', image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 130 }, { label: 'Double', price: 260 }] },
  { id: 'bn_7', category: 'buff_nihari', name: 'Buff Nalli Nihari', hi: 'बफ़ नल्ली नहारी', ur: 'بف نلی نہاری', icon: '🍲', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 220 }, { label: 'Double', price: 440 }] },
  { id: 'bn_8', category: 'buff_nihari', name: 'Buff Nalli Nihari - Desi Ghee', hi: 'बफ़ नल्ली नहारी देसी घी', ur: 'بف نلی نہاری دیسی گھی', icon: '🍲', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 250 }, { label: 'Double', price: 500 }] },
  { id: 'bn_9', category: 'buff_nihari', name: 'Buff Nalli Nihari - Butter', hi: 'बफ़ नल्ली नहारी मक्खन', ur: 'بف نلی نہاری مکھن', icon: '🧈', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 250 }, { label: 'Double', price: 500 }] },

  // ── Mutton Nihari (Portions: Single / Double) ────────────
  { id: 'mn_1', category: 'mutton_nihari', name: 'Mutton Nihari', hi: 'मटन नहारी', ur: 'مٹن نہاری', icon: '🥘', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 350 }, { label: 'Double', price: 700 }] },
  { id: 'mn_2', category: 'mutton_nihari', name: 'Mutton Nihari - Desi Ghee', hi: 'मटन नहारी देसी घी', ur: 'مٹن نہاری دیسی گھی', icon: '🥘', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 380 }, { label: 'Double', price: 760 }] },
  { id: 'mn_3', category: 'mutton_nihari', name: 'Mutton Nihari - Butter', hi: 'मटन नहारी मक्खन', ur: 'مٹن نہاری مکھن', icon: '🧈', image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400&h=400&fit=crop', portions: [{ label: 'Single', price: 380 }, { label: 'Double', price: 760 }] },

  // ── Bheja (Fixed Portions) ───────────────────────────────
  { id: 'bh_1', category: 'bheja', name: 'Mutton Bheja', hi: 'मटन भेजा', ur: 'مٹن بھیجا', icon: '🫕', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop', price: 170, portions: null },
  { id: 'bh_2', category: 'bheja', name: 'Mutton Bheja - Desi Ghee', hi: 'मटन भेजा देसी घी', ur: 'مٹن بھیجا دیسی گھی', icon: '🫕', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop', price: 200, portions: null },
  { id: 'bh_3', category: 'bheja', name: 'Mutton Bheja - Butter', hi: 'मटन भेजा मक्खन', ur: 'مٹن بھیجا مکھن', icon: '🧈', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop', price: 200, portions: null },

  // ── Grill ────────────────────────────────────────────────
  { id: 'gr_1', category: 'grill', name: 'Buff Kawab', hi: 'बफ़ कबाब', ur: 'بف کباب', icon: '🍢', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop', portions: [{ label: '2 pcs', price: 80 }, { label: '4 pcs', price: 160 }] },
  { id: 'gr_2', category: 'grill', name: 'Buff Kawab Gravy', hi: 'बफ़ कबाब ग्रेवी', ur: 'بف کباب گریوی', icon: '🍢', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', portions: [{ label: '2 pcs', price: 100 }, { label: '4 pcs', price: 200 }] },
  { id: 'gr_3', category: 'grill', name: 'Pasanda Kawab', hi: 'पसंदा कबाब', ur: 'پسندہ کباب', icon: '🍢', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop', portions: [{ label: 'Half', price: 500 }, { label: 'Full', price: 1000 }] },

  // ── Biryani ──────────────────────────────────────────────
  { id: 'br_1', category: 'biryani', name: 'Chicken Biryani', hi: 'चिकन बिरयानी', ur: 'چکن بریانی', icon: '🍛', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', portions: [{ label: 'Half', price: 150 }, { label: 'Full', price: 300 }] },

  // ── Roti & Breads ────────────────────────────────────────
  { id: 'rt_1', category: 'roti', name: 'Roti', hi: 'रोटी', ur: 'روٹی', icon: '🫓', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop', price: 10, portions: null },

  // ── Sweets ───────────────────────────────────────────────
  { id: 'sw_1', category: 'sweets', name: 'Kheer', hi: 'खीर', ur: 'کھیر', icon: '🍮', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', price: 50, portions: null },

  // ── Gravies & Extras ─────────────────────────────────────
  { id: 'ge_1', category: 'gravy_extras', name: 'Buff Qorma', hi: 'बफ़ कोरमा', ur: 'بف قورمہ', icon: '🍛', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400&h=400&fit=crop', portions: [{ label: 'Half', price: 150 }, { label: 'Full', price: 300 }] },
  { id: 'ge_2', category: 'gravy_extras', name: 'Extra Buff Gravy', hi: 'एक्स्ट्रा बफ़ ग्रेवी', ur: 'اضافی بف گریوی', icon: '🥣', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop', price: 30, portions: null },
  { id: 'ge_3', category: 'gravy_extras', name: 'Extra Mutton Gravy', hi: 'एक्स्ट्रा मटन ग्रेवी', ur: 'اضافی مٹن گریوی', icon: '🥣', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop', price: 50, portions: null },

  // ── Drinks ───────────────────────────────────────────────
  { id: 'dk_1', category: 'drinks', name: 'Cold Drink / Water', hi: 'कोल्ड ड्रिंक / पानी', ur: 'کولڈ ڈرنک / پانی', icon: '🥤', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop', price: 0, portions: null, note: 'M.R.P' },
];
