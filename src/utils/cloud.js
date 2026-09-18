import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForPOSDeployment",
  authDomain: "mehfil-e-nihari.firebaseapp.com",
  projectId: "mehfil-e-nihari",
  storageBucket: "mehfil-e-nihari.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const getFirebaseConfig = () => firebaseConfig;
export const testConnection = async () => true;
export const isSyncEnabled = () => true;
export const getDeviceName = () => localStorage.getItem("deviceName") || "POS Terminal";
export const setDeviceName = (name) => localStorage.setItem("deviceName", name);
export const isCloudConnected = () => true;
export const onConnectionChange = (callback) => () => {};

export const getNextInvoiceNumber = async () => {
  try {
    const counterRef = doc(db, "settings", "invoice_counter");
    let nextNum = 2003;
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (counterDoc.exists()) {
        nextNum = (counterDoc.data().lastNumber || 2002) + 1;
      }
      transaction.set(counterRef, { lastNumber: nextNum }, { merge: true });
    });
    return nextNum;
  } catch (error) {
    console.error("Error generating cloud invoice number:", error);
    const STORAGE_KEY = "pos_last_invoice_number";
    let lastNum = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    lastNum = (isNaN(lastNum) || lastNum < 2003) ? 2003 : lastNum + 1;
    localStorage.setItem(STORAGE_KEY, lastNum.toString());
    return lastNum;
  }
};