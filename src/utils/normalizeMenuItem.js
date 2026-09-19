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
  if (!item) return item;

  // Determine the portion array
  let portions = item.portions;
  if (!portions && item.portion) {
    // MenuMaster saves portion as a string like "Single" or "Regular"
    portions = [{ label: item.portion, price: item.price || 0 }];
  }

  // Determine Hindi / Urdu names
  const hi = item.hi || item.nameHi || '';
  const ur = item.ur || item.nameUr || '';

  // Fallback icon from category
  const icon = item.icon || CATEGORY_ICONS[item.category] || '🍲';

  return {
    ...item,
    hi,
    ur,
    icon,
    portions: portions || null,
  };
}

/**
 * normalizeMenuItems — batch normalize an array of items from Firestore.
 */
export function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeMenuItem);
}
