// Universal Storage Utility (localStorage + Remote Vercel Config Sync)

export async function getSetting(key) {
  if (key === "business_profile") {
    try {
      const res = await fetch("/config.json", { cache: "no-store" });
      if (res.ok) {
        const remoteConfig = await res.json();
        return remoteConfig;
      }
    } catch (e) {
      console.log("Offline, falling back to local storage");
    }
  }

  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : null;
}

export async function setSetting(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getItem(storeName, id) {
  const all = await getAll(storeName);
  return all.find(item => String(item.id) === String(id)) || null;
}

export async function setItem(storeName, id, data) {
  const all = await getAll(storeName);
  const index = all.findIndex(item => String(item.id) === String(id));
  const newItem = { ...data, id };
  if (index >= 0) {
    all[index] = newItem;
  } else {
    all.push(newItem);
  }
  localStorage.setItem(storeName, JSON.stringify(all));
  return newItem;
}

export async function getAll(storeName) {
  const raw = localStorage.getItem(storeName);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteItem(storeName, id) {
  let all = await getAll(storeName);
  all = all.filter(item => String(item.id) !== String(id));
  localStorage.setItem(storeName, JSON.stringify(all));
  return true;
}

// Compatibility exports
export async function getMenuItems() {
  return await getAll("items");
}

export async function saveMenuItems(items) {
  localStorage.setItem("items", JSON.stringify(items));
  return true;
}

export async function saveBill(bill) {
  return await setItem("bills", bill.id || Date.now(), bill);
}

export async function loadBusinessProfile() {
  return await getSetting("business_profile");
}

export async function getTodayBills() {
  const all = await getAll("bills");
  const today = new Date().toISOString().split("T")[0];
  return all.filter(b => b.date === today || (b.createdAt && b.createdAt.startsWith(today)));
}

export async function getAllBills() {
  return await getAll("bills");
}

export async function clearAllData() {
  localStorage.clear();
  return true;
}

export async function getBillById(id) {
  return await getItem("bills", id);
}

export async function updateBill(id, data) {
  return await setItem("bills", id, data);
}