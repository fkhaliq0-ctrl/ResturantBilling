import { useState, useEffect, useRef } from 'react';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';
import { saveMenuItems, getMenuItems } from '../utils/storage';
import { CATEGORIES, DEFAULT_ITEMS } from '../utils/menuData';

const HI_MAP = {
  'buff': 'बफ़', 'mutton': 'मटन', 'chicken': 'चिकन', 'nihari': 'नहारी',
  'nalli': 'नल्ली', 'biryani': 'बिरयानी', 'qorma': 'कोरमा', 'kawab': 'कबाब',
  'kheer': 'खीर', 'roti': 'रोटी', 'bheja': 'भेजा', 'butter': 'मक्खन',
  'desi ghee': 'देसी घी', 'gravy': 'ग्रेवी', 'extra': 'एक्स्ट्रा',
  'water': 'पानी', 'cold drink': 'कोल्ड ड्रिंक', 'pasanda': 'पसंदा',
  'single': 'सिंगल', 'double': 'डबल', 'half': 'हाफ', 'full': 'फुल',
  'pieces': 'पीस',
};
const UR_MAP = {
  'buff': 'بف', 'mutton': 'مٹن', 'chicken': 'چکن', 'nihari': 'نہاری',
  'nalli': 'نلی', 'biryani': 'بریانی', 'qorma': 'قورمہ', 'kawab': 'کباب',
  'kheer': 'کھیر', 'roti': 'روٹی', 'bheja': 'بھیجا', 'butter': 'مکھن',
  'desi ghee': 'دیسی گھی', 'gravy': 'گریوی', 'extra': 'ایکسٹرا',
  'water': 'پانی', 'cold drink': 'کولڈ ڈرنک', 'pasanda': 'پسندہ',
  'single': 'سنگل', 'double': 'ڈبل', 'half': 'ہاف', 'full': 'فل',
  'pieces': 'پیس',
};

function transliterate(text, map) {
  if (!text) return '';
  let result = text.toLowerCase();
  for (const [en, local] of Object.entries(map)) {
    result = result.replace(new RegExp(en, 'gi'), local);
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default function MenuMaster({ onBack }) {
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editMode, setEditMode] = useState(null); // null = list view, item = editing
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [price, setPrice] = useState('');
  const [portion, setPortion] = useState('');
  const [category, setCategory] = useState('Nihari');
  const [imageUrl, setImageUrl] = useState('');
  const [toast, setToast] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [imageTab, setImageTab] = useState('url');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let items = await getMenuItems();
    if (!items || items.length === 0) {
      await saveMenuItems(DEFAULT_ITEMS);
      items = DEFAULT_ITEMS;
    }
    setMenuItems(items);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAutoTranslate = (englishName) => {
    setName(englishName);
    setNameHi(transliterate(englishName, HI_MAP));
    setNameUr(transliterate(englishName, UR_MAP));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
        setImageTab('file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async () => {
    if (!name || !price) {
      playErrorSound();
      showToast('Name and price are required');
      return;
    }
    playButtonPress();
    const newItem = {
      id: editMode ? editMode.id : Date.now(),
      name: name,
      nameHi: nameHi || transliterate(name, HI_MAP),
      nameUr: nameUr || transliterate(name, UR_MAP),
      price: Number(price),
      portion: portion || 'Regular',
      category: category,
      image: imageUrl || (editMode ? editMode.image : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'),
    };

    let updated;
    if (editMode) {
      updated = menuItems.map(i => i.id === editMode.id ? { ...i, ...newItem } : i);
      showToast('Item updated!');
    } else {
      updated = [...menuItems, newItem];
      showToast('Item added!');
    }
    setMenuItems(updated);
    await saveMenuItems(updated);
    resetForm();
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this item?')) return;
    playErrorSound();
    const updated = menuItems.filter(i => i.id !== itemId);
    setMenuItems(updated);
    await saveMenuItems(updated);
    showToast('Item removed');
  };

  const handleEditItem = (item) => {
    setEditMode(item);
    setName(item.name);
    setNameHi(item.nameHi || transliterate(item.name, HI_MAP));
    setNameUr(item.nameUr || transliterate(item.name, UR_MAP));
    setPrice(String(item.price));
    setPortion(item.portion || '');
    setCategory(item.category);
    setImageUrl(item.image || '');
    playButtonPress();
  };

  const resetForm = () => {
    setEditMode(null);
    setName('');
    setNameHi('');
    setNameUr('');
    setPrice('');
    setPortion('');
    setCategory('Nihari');
    setImageUrl('');
    setImageTab('url');
  };

  // Filter and sort items
  let filtered = menuItems;
  if (selectedCategory !== 'All') {
    filtered = filtered.filter(i => i.category === selectedCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || (i.nameHi && i.nameHi.toLowerCase().includes(q)));
  }
  if (sortBy === 'price-low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sortBy === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); resetForm(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">📋 Menu Master</h1>
          <button onClick={() => { playButtonPress(); setEditMode(editMode ? null : {}); resetForm(); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm btn-press ${editMode ? 'bg-red-500/20 text-red-400' : 'bg-amber-500 text-white'}`}>
            {editMode ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Add/Edit Form ─────────────────────────────────── */}
        {(editMode !== null) && (
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <h3 className="text-white font-bold text-lg">{editMode?.id ? '✏️ Edit Item' : '➕ Add New Item'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Item Name (English)</label>
                <input value={name} onChange={e => handleAutoTranslate(e.target.value)}
                  placeholder="e.g. Buff Nihari Single"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Price (₹)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Hindi Name</label>
                <input value={nameHi} onChange={e => setNameHi(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Urdu Name</label>
                <input value={nameUr} onChange={e => setNameUr(e.target.value)} dir="rtl"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Portion</label>
                <input value={portion} onChange={e => setPortion(e.target.value)} placeholder="Single/Double/Half"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Image Upload Tabs */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setImageTab('url')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'url' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>🔗 Paste URL</button>
                <button onClick={() => setImageTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'file' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>📂 Browse File</button>
                <button onClick={() => setImageTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'search' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>🔍 Search Net</button>
              </div>

              {imageTab === 'url' && (
                <input type="url" value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              )}
              {imageTab === 'file' && (
                <div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                </div>
              )}
              {imageTab === 'search' && (
                <SearchNetImage onSelect={(url) => { setImageUrl(url); setImageTab('url'); }} />
              )}
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-600">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">✕</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSaveItem}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm btn-press shadow-lg">
                {editMode?.id ? '💾 Update Item' : '➕ Save Item'}
              </button>
              <button onClick={resetForm}
                className="px-5 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Search + Sort ─────────────────────────────────── */}
        <div className="flex gap-2 items-center">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search items..."
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs">
            <option value="default">Default</option>
            <option value="price-low">Price Low→High</option>
            <option value="price-high">Price High→Low</option>
            <option value="name">A→Z Name</option>
          </select>
        </div>

        {/* ── Category Filter ───────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${selectedCategory === c ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* ── Item List ─────────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-gray-500 text-center py-8">No items found</p>
          )}
          {filtered.map(item => (
            <div key={item.id} className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-700">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍲</div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{item.name}</p>
                {item.nameHi && <p className="text-gray-400 text-xs">{item.nameHi}</p>}
                {item.nameUr && <p className="text-gray-400 text-xs" dir="rtl">{item.nameUr}</p>}
                <p className="text-amber-400 font-bold text-sm">₹{item.price} {item.portion ? `(${item.portion})` : ''}</p>
                <p className="text-gray-500 text-[10px]">{item.category}</p>
              </div>
              {/* Edit / Remove Buttons */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => handleEditItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold btn-press hover:bg-blue-500/40">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDeleteItem(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold btn-press hover:bg-red-500/40">
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-gray-500 text-xs pb-4">
          {menuItems.length} items total • {filtered.length} shown
        </div>
      </div>
    </div>
  );
}

// ── Search Net Image Sub-Component ────────────────────────
function SearchNetImage({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    // Use Unsplash source API for free food images
    const encoded = encodeURIComponent(query + ' food');
    const mockResults = [
      `https://source.unsplash.com/400x400/?${encoded}&t=${Date.now()}`,
      `https://source.unsplash.com/400x400/?${encoded}+indian&t=${Date.now() + 1}`,
      `https://source.unsplash.com/400x400/?${encoded}+curry&t=${Date.now() + 2}`,
    ];
    setResults(mockResults);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search food images (e.g. nihari, biryani)"
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs focus:border-amber-500 focus:outline-none" />
        <button onClick={handleSearch} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold btn-press">
          {loading ? '...' : '🔍'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {results.map((url, i) => (
            <button key={i} onClick={() => onSelect(url)}
              className="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-amber-500 transition-colors">
              <img src={url} alt="Search result" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
