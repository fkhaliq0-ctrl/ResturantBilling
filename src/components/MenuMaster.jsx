import { useState, useEffect, useRef } from 'react';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';
import { saveMenuItems, getMenuItems } from '../utils/storage';
import { normalizeMenuItems } from '../utils/normalizeMenuItem';
import { CATEGORIES, DEFAULT_ITEMS } from '../utils/menuData';

const HI_MAP = {
  'buff': '\u092c\u092b',
  'mutton': '\u092e\u091f\u0928',
  'chicken': '\u092e\u0941\u0930\u094d\u0917\u093e',
  'nihari': '\u0928\u093f\u0939\u093e\u0930\u0940',
  'nalli': '\u0928\u0932\u094d\u0932\u0940',
  'biryani': '\u092c\u093f\u0930\u092f\u093e\u0928\u0940',
  'qorma': '\u0915\u094b\u0930\u092e\u093e',
  'kawab': '\u0915\u092c\u093e\u092c',
  'kheer': '\u0916\u0940\u0930',
  'roti': '\u0930\u094b\u091f\u0940',
  'bheja': '\u092d\u0947\u091c\u093e',
  'butter': '\u092e\u0915\u094d\u0916\u0928',
  'desi ghee': '\u0926\u0947\u0936\u0940\u0020\u0918\u0940',
  'gravy': '\u0917\u094d\u0930\u0947\u0935\u0940',
  'extra': '\u0905\u0924\u093f\u0930\u093f\u0915\u094d\u0924',
  'water': '\u092a\u093e\u0928\u0940',
  'cold drink': '\u0920\u0902\u0921\u093e\u0020\u092a\u0947\u092f',
  'single': '\u0938\u093f\u0902\u0917\u0932',
  'double': '\u0921\u092c\u0932',
  'half': '\u0906\u0927\u093e',
  'full': '\u092a\u0942\u0930\u093e',
  'pieces': '\u092a\u0940\u0938',
};
const UR_MAP = {
  'buff': '\u0628\u0641',
  'mutton': '\u0645\u0679\u0646',
  'chicken': '\u0645\u0631\u063a\u06cc',
  'nihari': '\u0646\u06c1\u0627\u0631\u06cc',
  'nalli': '\u0646\u0644\u06cc',
  'biryani': '\u0628\u0631\u06cc\u0627\u0646\u06cc',
  'qorma': '\u0642\u0648\u0631\u0645\u06c1',
  'kawab': '\u06a9\u0628\u0627\u0628',
  'kheer': '\u06a9\u06be\u06cc\u0631',
  'roti': '\u0631\u0648\u0679\u06cc',
  'bheja': '\u0628\u06be\u06cc\u062c\u06d2',
  'butter': '\u0645\u06a9\u06be\u0646',
  'desi ghee': '\u062f\u06cc\u0634\u06cc\u0020\u06af\u06be\u06cc',
  'gravy': '\u06af\u0631\u06cc\u0648\u06cc',
  'extra': '\u0627\u0636\u0627\u0641\u06cc',
  'water': '\u067e\u0627\u0646\u06cc',
  'cold drink': '\u0633\u0631\u062f\u0020\u0645\u0634\u0631\u0648\u0628',
  'single': '\u0633\u0646\u06af\u0644',
  'double': '\u0688\u0628\u0644',
  'half': '\u0622\u062f\u06be\u0627',
  'full': '\u0645\u06a9\u0645\u0644',
  'pieces': '\u067e\u06cc\u0633',
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // item id pending deletion
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let items = await getMenuItems();
    if (!items || items.length === 0) {
      await saveMenuItems(DEFAULT_ITEMS);
      items = DEFAULT_ITEMS;
    } else {
      items = normalizeMenuItems(items);
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
    setDeleteConfirm(itemId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    playErrorSound();
    const updated = menuItems.filter(i => i.id !== deleteConfirm);
    setMenuItems(updated);
    await saveMenuItems(updated);
    showToast('Item removed');
    setDeleteConfirm(null);
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
    // Scroll to top so the form is visible
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
          <span className="text-2xl">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Menu Master</h1>
          <button onClick={() => { playButtonPress(); if (editMode) { resetForm(); } else { setEditMode({}); setName(''); setNameHi(''); setNameUr(''); setPrice(''); setPortion(''); setCategory('Nihari'); setImageUrl(''); setImageTab('url'); } }}
            className={`px-4 py-2 rounded-xl font-bold text-sm btn-press ${editMode ? 'bg-red-500/20 text-red-400' : 'bg-amber-500 text-white'}`}>
            {editMode ? 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢ Cancel' : '+ Add Item'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Add/Edit Form ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        {(editMode !== null) && (
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <h3 className="text-white font-bold text-lg">{editMode?.id ? 'ÃƒÂ¢Ã…â€œÃ‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â Edit Item' : 'ÃƒÂ¢Ã…Â¾Ã¢â‚¬Â¢ Add New Item'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Item Name (English)</label>
                <input value={name} onChange={e => handleAutoTranslate(e.target.value)}
                  placeholder="e.g. Buff Nihari Single"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Price (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹)</label>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'url' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â€ Paste URL</button>
                <button onClick={() => setImageTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'file' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Å¡ Browse File</button>
                <button onClick={() => setImageTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${imageTab === 'search' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}`}>ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â Search Net</button>
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
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSaveItem}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm btn-press shadow-lg">
                {editMode?.id ? 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¾ Update Item' : 'ÃƒÂ¢Ã…Â¾Ã¢â‚¬Â¢ Save Item'}
              </button>
              <button onClick={resetForm}
                className="px-5 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
            </div>
          </div>
        )}

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Search + Sort ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div className="flex gap-2 items-center">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â Search items..."
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs">
            <option value="default">Default</option>
            <option value="price-low">Price LowÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢High</option>
            <option value="price-high">Price HighÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢Low</option>
            <option value="name">AÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢Z Name</option>
          </select>
        </div>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Category Filter ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${selectedCategory === c ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Item List ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
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
                  <div className="w-full h-full flex items-center justify-center text-2xl">ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â²</div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{item.name}</p>
                {item.nameHi && <p className="text-gray-400 text-xs">{item.nameHi}</p>}
                {item.nameUr && <p className="text-gray-400 text-xs" dir="rtl">{item.nameUr}</p>}
                <p className="text-amber-400 font-bold text-sm">ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹{item.price} {item.portion ? `(${item.portion})` : ''}</p>
                <p className="text-gray-500 text-[10px]">{item.category}</p>
              </div>
              {/* Edit / Remove Buttons */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => handleEditItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold btn-press hover:bg-blue-500/40">
                  ÃƒÂ¢Ã…â€œÃ‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â Edit
                </button>
                <button onClick={() => handleDeleteItem(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold btn-press hover:bg-red-500/40">
                  ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã¢â‚¬ËœÃƒÂ¯Ã‚Â¸Ã‚Â Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-gray-500 text-xs pb-4">
          {menuItems.length} items total ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {filtered.length} shown
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-slide-up">
            <div className="text-center">
              <span className="text-5xl">ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã¢â‚¬ËœÃƒÂ¯Ã‚Â¸Ã‚Â</span>
              <h3 className="text-white font-bold text-lg mt-3">Remove Item?</h3>
              <p className="text-gray-400 text-sm mt-1">Are you sure you want to remove this item from the menu?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm btn-press">
                ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã¢â‚¬ËœÃƒÂ¯Ã‚Â¸Ã‚Â Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Search Net Image Sub-Component ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
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
          {loading ? '...' : 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â'}
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
