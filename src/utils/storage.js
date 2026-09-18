import { db, getNextInvoiceNumber } from "./cloud";
import { collection, doc, getDoc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

export async function getItem(storeName, id) {
  try {
    const docRef = doc(db, storeName, String(id));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (e) {
    console.error("getItem error:", e);
    return null;
  }
}

export async function setItem(storeName, id, data) {
  try {
    const docId = String(id || Date.now());
    const docRef = doc(db, storeName, docId);
    const cleanData = { ...data, id: docId };
    await setDoc(docRef, cleanData, { merge: true });
    return docId;
  } catch (e) {
    console.error("setItem error:", e);
    return id;
  }
}

export async function deleteItem(storeName, id) {
  try {
    const docRef = doc(db, storeName, String(id));
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error("deleteItem error:", e);
    return false;
  }
}

export async function getAll(storeName) {
  try {
    const querySnapshot = await getDocs(collection(db, storeName));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (e) {
    console.error("getAll error:", e);
    return [];
  }
}

// Business Profile Sync with Firestore
export async function loadBusinessProfile() {
  try {
    const docRef = doc(db, "settings", "business_profile");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : {};
  } catch (e) {
    console.error("Load business profile error:", e);
    return {};
  }
}

export function loadBusinessProfileSync() {
  try {
    const raw = localStorage.getItem("businessProfile");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export async function saveBusinessProfile(profile) {
  try {
    const docRef = doc(db, "settings", "business_profile");
    await setDoc(docRef, profile, { merge: true });
    localStorage.setItem("businessProfile", JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error("Save business profile error:", e);
    return false;
  }
}

export async function getMenuItems() {
  return await getAll("menuItems");
}

export async function saveMenuItems(items) {
  try {
    for (const item of items) {
      const itemId = item.id || Date.now();
      await setItem("menuItems", itemId, item);
    }
    return true;
  } catch (e) {
    console.error("Save menu items error:", e);
    return false;
  }
}

export async function upsertCustomer(customer) {
  try {
    const custId = customer.id || customer.phone || Date.now();
    await setItem("customers", custId, customer);
    return customer;
  } catch (e) {
    console.error("Upsert customer error:", e);
    return null;
  }
}

// Bill Management with atomic cloud sequencing
export async function saveBill(bill) {
  let billId = bill.id;
  if (!billId) {
    try {
      billId = await getNextInvoiceNumber();
    } catch (error) {
      billId = Date.now();
    }
  }
  const billWithId = {
    ...bill,
    id: billId,
    date: bill.date || new Date().toISOString()
  };
  await setItem("bills", billId, billWithId);
  return billId;
}

export async function getAllBills() {
  return await getAll("bills");
}

export async function getBillById(id) {
  return await getItem("bills", id);
}

export async function updateBill(id, data) {
  return await setItem("bills", id, data);
}

export async function getTodayBills() {
  try {
    const bills = await getAllBills();
    const todayStr = new Date().toISOString().split("T")[0];
    return bills.filter(b => {
      const bDate = b.date ? String(b.date).split("T")[0] : "";
      return bDate === todayStr;
    });
  } catch (e) {
    return await getAllBills();
  }
}

export async function getSetting(key, defaultValue = null) {
  try {
    const docRef = doc(db, "appSettings", String(key));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export async function setSetting(key, value) {
  try {
    const docRef = doc(db, "appSettings", String(key));
    await setDoc(docRef, { key, value }, { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

export async function clearAllData() {
  try {
    localStorage.clear();
    return true;
  } catch (e) {
    return false;
  }
}