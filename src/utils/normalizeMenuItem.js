/**
 * normalizeMenuItem — bridges the field naming gap between:
 *   MenuMaster (writes to Firestore):  nameHi, nameUr, portion (string)
 *   ItemGrid (reads for display):      hi, ur, portions (array), icon
 *
 * Safe to call on items that are already normalized (idempotent).
 */

const CATEGORY_ICONS = {
  buff_nihari: '🍲',
  bheja: '🧠',
  kawabs: '🍢',
  others: '🍛',
  drink: '🥤',
};

export function normalizeMenuItem(item) {
  if (!item || typeof item !== 'object') return null;
  // Skip items without essential fields
  if (!item.name && !item.id) return null;

  // Ensure required fields exist
  const id = item.id || String(Date.now());
  const name = item.name || 'Unnamed Item';
  const price = typeof item.price === 'number' ? item.price : 0;
  const category = item.category || 'others';

  // Determine the portion array
  let portions = item.portions;
  if (!portions && item.portion) {
    // MenuMaster saves portion as a string like "Single" or "Regular"
    if (typeof item.portion === 'string' && item.portion.trim()) {
      portions = [{ label: item.portion.trim(), price }];
    }
  }
  // Ensure portions is either null or a valid array
  if (portions && !Array.isArray(portions)) portions = null;
  if (portions && portions.length === 0) portions = null;

  // Determine Hindi / Urdu names
  const hi = item.hi || item.nameHi || '';
  const ur = item.ur || item.nameUr || '';

  // Fallback icon from category
  const icon = item.icon || CATEGORY_ICONS[category] || '🍲';

  return {
    ...item,
    id,
    name,
    price,
    category,
    hi,
    ur,
    icon,
    image: item.image || '',
    portions: portions || null,
  };
}

/**
 * normalizeMenuItems — batch normalize an array of items from Firestore.
 */
export function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeMenuItem).filter(Boolean);
}
