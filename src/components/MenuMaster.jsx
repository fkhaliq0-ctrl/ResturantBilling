import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, DEFAULT_ITEMS } from '../utils/menuData';
import { saveMenuItems, getMenuItems } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

const HI_MAP = {
  'buff': 'बफ़', 'mutton': 'मटन', 'chicken': 'चिकन', 'nihari': 'नहारी',
  'nalli': 'नल्ली', 'biryani': 'बिरयानी', 'qorma': 'कोरमा', 'kawab': 'कबाब',
  'kheer': 'खीर', 'roti': 'रोटी', 'bheja': 'भेजा', 'butter': 'मक्खन',
  'desi ghee': 'देसी घी', 'gravy': 'ग्रेवी', 'extra': 'एक्स्ट्रा',
  'pasanda': 'पसंदा', 'cold drink': 'कोल्ड ड्रिंक', 'water': 'पानी',
};
const UR_MAP = {
  'buff': 'بف', 'mutton': 'مٹن', 'chicken': 'چکن', 'nihari': 'نہاری',
  'nalli': 'نلی', 'biryani': 'بریانی', 'qorma': 'قورمہ', 'kawab': 'کباب',
  'kheer': 'کھیر', 'roti': 'روٹی', 'bheja': 'بھیجا', 'butter': 'مکھن',
  'desi ghee': 'دیسی گھی', 'gravy': 'گریوی', 'extra': 'اضافی',
  'pasanda': 'پسندہ', 'cold drink': 'کولڈ ڈرنک', 'water': 'پانی',
};

function autoTransliterate(text, map) {
  if (!text) return '';
  let result = text.toLowerCase();
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(key => {
    result = result.replace(new RegExp(key, 'gi'), map[key]);
  });
  return result;
}

const ICON_OPTIONS = ['🍲', '🥘', '🫕', '🍢', '🍚', '🫓', '🍮', '🥣', '🥤', '🍛', '🧈', '🍖', '🥧', '🍰', '🫔', '🌮'];

const emptyItem = {
  name: '', hi: '', ur: '', category: 'buff_nihari', icon: '🍲',
  image: '', portions: [], price: 0, note: '', outOfStock: false,
};

export default function MenuMaster({ onBack }) {
  const [items, setItems] = useState([]);
  const [categories] = useState(CATEGORIES);
  const [tab, setTab] = useState('items');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageTab, setImageTab] = useState('browse'); // browse | url | search
n  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    let stored = await getMenuItems();
    if (!stored || stored.length === 0) {
      await saveMenuItems(DEFAULT_ITEMS);
      stored = DEFAULT_ITEMS;
    }
    setItems(stored);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const persistItems = async (newItems) => {
    setSaving(true);
    await saveMenuItems(newItems);
    setItems(newItems);
    setSaving(false);
  };

  // ── Image Handling ──────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
      setImagePreview(ev.target.result);
      showToast('✅ Image loaded from file');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (url) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleImageSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Use Unsplash source API for free food images
      const query = encodeURIComponent(searchQuery.trim() + ' food');
      const mockResults = [
        { url: `https://source.unsplash.com/400x300/?${query}&sig=${Date.now()}1`, label: `${searchQuery} (1)` },
        { url: `https://source.unsplash.com/400x300/?${query}&sig=${Date.now()}2`, label: `${searchQuery} (2)` },
        { url: `https://source.unsplash.com/400x300/?${query}&sig=${Date.now()}3`, label: `${searchQuery} (3)` },
      ];
      setSearchResults(mockResults);
    } catch {
      showToast('Search failed — try entering a URL directly');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (url) => {
    setImageUrl(url);
    setImagePreview(url);
    setSearchResults([]);
    showToast('✅ Image selected');
  };

  // ── Item CRUD ────────────────────────────────────────────
  const handleAddItem = () => {
    playButtonPress();
    setEditing({ ...emptyItem, id: 'item_' + Date.now() });
    setImageUrl('');
    setImagePreview('');
    setImageTab('browse');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleEditItem = (item) => {
    playButtonPress();
    setEditing({ ...item });
    setImageUrl(item.image || '');
    setImagePreview(item.image || '');
    setImageTab(item.image?.startsWith('data:') ? 'browse' : 'url');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDeleteItem = async (itemId) => {
    playButtonPress();
    if (!confirm('Delete this item permanently?')) return;
    const newItems = items.filter(i => i.id !== itemId);
    await persistItems(newItems);
    showToast('Item deleted');
  };

  const handleSaveItem = async () => {
    if (!editing.name.trim()) { showToast('Item name is required'); return; }
    playButtonPress();
    const item = { ...editing, image: imageUrl || editing.image || '' };
    let newItems;
    if (items.find(i => i.id === item.id)) {
      newItems = items.map(i => i.id === item.id ? item : i);
    } else {
      newItems = [...items, item];
    }
    await persistItems(newItems);
    setShowForm(false);
    setEditing(null);
    showToast('Item saved!');
  };

  const handleToggleOOS = async (itemId) => {
    playButtonPress();
    const newItems = items.map(i => i.id === itemId ? { ...i, outOfStock: !i.outOfStock } : i);
    await persistItems(newItems);
  };

  // ── Portion helpers ──────────────────────────────────────
  const addPortion = () => {
    if (!editing) return;
    setEditing(prev => ({ ...prev, portions: [...(prev.portions || []), { label: '', price: 0 }] }));
  };
  const updatePortion = (idx, field, value) => {
    setEditing(prev => {
      const portions = [...(prev.portions || [])];
      portions[idx] = { ...portions[idx], [field]: field === 'price' ? Number(value) || 0 : value };
      return { ...prev, portions };
    });
  };
  const removePortion = (idx) => {
    setEditing(prev => ({ ...prev, portions: (prev.portions || []).filter((_, i) => i !== idx) }));
  };

  const getStartingPrice = (item) => {
    if (item.portions?.length > 0) return Math.min(...item.portions.map(p => p.price));
    return item.price || 0;
  };

  const filtered = items
    .filter(i => {
      if (filterCat !== 'all' && i.category !== filterCat) return false;
      if (search) {
        const s = search.toLowerCase();
        return i.name.toLowerCase().includes(s) || (i.hi || '').toLowerCase().includes(s) || (i.ur || '').includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'low-high') return getStartingPrice(a) - getStartingPrice(b);
      if (sortBy === 'high-low') return getStartingPrice(b) - getStartingPrice(a);
      return 0;
    });

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
            <h1 className="text-2xl font-bold text-white">🍽️ Menu Master</h1>
            <p className="text-gray-400 text-sm">Manage items, images & categories</p>
          </div>
          <span className="text-gray-500 text-xs">{items.length} items</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 shrink-0">
        <button onClick={() => { playButtonPress(); setTab('items'); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm btn-press ${tab === 'items' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'}`}>
          📋 Items ({items.length})
        </button>
        <button onClick={() => { playButtonPress(); setTab('add'); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm btn-press ${tab === 'add' ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-300'}`}>
          ➕ Add Item
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* ── ADD/EDIT ITEM TAB ──────────────────────────── */}
        {tab === 'add' && (
          <div ref={formRef} className="space-y-3">
            {!showForm && (
              <button onClick={handleAddItem}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg">
                ➕ Create New Item
              </button>
            )}

            {showForm && editing && (
              <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">{items.find(i => i.id === editing.id) ? '✏️ Edit' : '➕ New'} Item</h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Image Preview */}
                <div className="w-full h-32 rounded-xl bg-slate-600 flex items-center justify-center overflow-hidden border-2 border-slate-500 mb-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                  ) : (
                    <span className="text-6xl">{editing.icon}</span>
                  )}
                </div>

                {/* Image Source Tabs: Browse | URL | Search */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">📷 Image Source</label>
                  <div className="flex gap-1 mb-2">
                    <button onClick={() => setImageTab('browse')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold btn-press ${imageTab === 'browse' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-gray-300'}`}>
                      📂 Browse File
                    </button>
                    <button onClick={() => setImageTab('url')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold btn-press ${imageTab === 'url' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-gray-300'}`}>
                      🔗 Paste URL
                    </button>
                    <button onClick={() => setImageTab('search')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold btn-press ${imageTab === 'search' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-gray-300'}`}>
                      🔍 Search Net
                    </button>
                  </div>

                  {/* Browse Tab — opens system file picker */}
                  {imageTab === 'browse' && (
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 text-amber-400 font-bold text-sm btn-press hover:bg-amber-500/20 transition-colors">
                        📂 Tap to Browse Images from Your System
                      </button>
                      <p className="text-gray-500 text-xs mt-1 text-center">Opens file picker — JPG, PNG, WebP (max 5MB)</p>
                      {imageUrl && imageUrl.startsWith('data:') && (
                        <button onClick={() => { setImageUrl(''); setImagePreview(''); }}
                          className="w-full mt-2 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold btn-press">✕ Remove Image</button>
                      )}
                    </div>
                  )}

                  {/* URL Tab — paste any image link */}
                  {imageTab === 'url' && (
                    <div>
                      <div className="flex gap-2">
                        <input type="url" value={imageUrl.startsWith('data:') ? '' : imageUrl}
                          onChange={(e) => handleUrlInput(e.target.value)}
                          placeholder="https://example.com/food-photo.jpg"
                          className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <p className="text-gray-500 text-xs mt-1">Paste a direct image link (Google Drive shareable link, Unsplash, etc.)</p>
                    </div>
                  )}

                  {/* Search Tab — search food images from the web */}
                  {imageTab === 'search' && (
                    <div>
                      <div className="flex gap-2">
                        <input ref={searchInputRef} type="text" value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleImageSearch()}
                          placeholder="Search food images (e.g. nihari, biryani)..."
                          className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                        <button onClick={handleImageSearch} disabled={searching}
                          className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold btn-press disabled:opacity-50">
                          {searching ? '...' : '🔍'}
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">Search for free food photos or paste any image URL</p>
                      {searchResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {searchResults.map((r, i) => (
                            <button key={i} onClick={() => selectSearchResult(r.url)}
                              className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-400 btn-press transition-all">
                              <img src={r.url} alt={r.label} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Icon Fallback</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map(icon => (
                      <button key={icon} onClick={() => setEditing(prev => ({ ...prev, icon }))}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg btn-press ${editing.icon === icon ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-600 hover:bg-slate-500'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Names */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">English Name *</label>
                  <input type="text" value={editing.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setEditing(prev => ({ ...prev, name, hi: autoTransliterate(name, HI_MAP), ur: autoTransliterate(name, UR_MAP) }));
                    }}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Buff Nihari" />
                </div>
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Hindi (हिंदी)</label>
                  <input type="text" value={editing.hi}
                    onChange={(e) => setEditing(prev => ({ ...prev, hi: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Urdu (اردو)</label>
                  <input type="text" dir="rtl" value={editing.ur}
                    onChange={(e) => setEditing(prev => ({ ...prev, ur: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                </div>

                {/* Category */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Category</label>
                  <select value={editing.category}
                    onChange={(e) => setEditing(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                {/* Note */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Note</label>
                  <input type="text" value={editing.note || ''}
                    onChange={(e) => setEditing(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="M.R.P, Seasonal, etc." />
                </div>

                {/* Pricing */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Pricing</label>
                  {(editing.portions?.length > 0) ? (
                    <div className="space-y-2">
                      {editing.portions.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" value={p.label} onChange={(e) => updatePortion(idx, 'label', e.target.value)}
                            placeholder="Label" className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                          <input type="number" value={p.price} onChange={(e) => updatePortion(idx, 'price', e.target.value)}
                            placeholder="₹" className="w-24 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                          <button onClick={() => removePortion(idx)} className="text-red-400 text-lg btn-press">✕</button>
                        </div>
                      ))}
                      <button onClick={addPortion} className="w-full py-2 rounded-lg bg-slate-600 text-gray-300 text-sm font-bold btn-press">➕ Portion</button>
                      <button onClick={() => setEditing(prev => ({ ...prev, portions: [] }))}
                        className="w-full py-2 rounded-lg bg-slate-600 text-gray-400 text-xs btn-press">Switch to Fixed Price</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-gray-400 text-sm">₹</span>
                        <input type="number" value={editing.price || 0}
                          onChange={(e) => setEditing(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                          className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <button onClick={() => setEditing(prev => ({ ...prev, portions: [{ label: 'Single', price: prev.price || 0 }], price: undefined }))}
                        className="w-full py-2 rounded-lg bg-slate-600 text-gray-300 text-sm font-bold btn-press">➕ Add Portions</button>
                    </div>
                  )}
                </div>

                {/* Save */}
                <div className="flex gap-2">
                  <button onClick={handleSaveItem} disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg disabled:opacity-50">
                    {saving ? '⏳ Saving...' : '💾 Save Item'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditing(null); }}
                    className="px-4 py-3 rounded-xl bg-slate-600 text-gray-300 font-bold text-sm btn-press">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ITEMS LIST TAB ──────────────────────────────── */}
        {tab === 'items' && (
          <>
            <div className="flex gap-2 mb-3">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400">
                <option value="all">All</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => { playButtonPress(); setSortBy(e.target.value); }}
                className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400">
                <option value="default">🔄</option>
                <option value="low-high">💰↑</option>
                <option value="high-low">💎↓</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <span className="text-5xl block mb-3">📋</span>
                <p>{items.length === 0 ? 'No items yet — tap Add Item' : 'No matches'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(item => {
                  const cat = categories.find(c => c.id === item.category);
                  return (
                    <div key={item.id}
                      className={`bg-slate-700/50 rounded-xl p-3 flex items-center gap-3 ${item.outOfStock ? 'opacity-50' : ''}`}>
                      <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : <span className="text-2xl">{item.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{item.name}</p>
                        {item.hi && <p className="text-gray-400 text-xs">{item.hi}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-slate-600 text-gray-300 rounded px-1.5 py-0.5">{cat?.icon} {cat?.name}</span>
                          {item.portions?.length > 0 ? (
                            item.portions.map(p => <span key={p.label} className="text-amber-400 text-[10px] font-bold">{p.label}: ₹{p.price}</span>)
                          ) : (
                            <span className="text-amber-400 text-[10px] font-bold">₹{item.price || 0}</span>
                          )}
                          {item.outOfStock && <span className="text-red-400 text-[10px] font-bold">🚫 OOS</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleOOS(item.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm btn-press ${item.outOfStock ? 'bg-red-500/30 text-red-300' : 'bg-slate-600 text-gray-400'}`}>
                          {item.outOfStock ? '🚫' : '✅'}
                        </button>
                        <button onClick={() => { handleEditItem(item); setTab('add'); }}
                          className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm btn-press">✏️</button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm btn-press">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-slide-up z-50">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
