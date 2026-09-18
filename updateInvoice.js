// Complete invoice transaction logic for Firebase
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

export const getNextInvoiceNumber = async () => {
  const invoiceRef = doc(db, "settings", "invoiceCounter");
  
  try {
    const nextNumber = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(invoiceRef);
      
      let currentNumber = 2003;
      if (docSnap.exists()) {
        currentNumber = docSnap.data().currentNumber || 2003;
      } else {
        transaction.set(invoiceRef, { currentNumber: 2003 });
        return 2003;
      }
      
      const newNumber = currentNumber + 1;
      transaction.update(invoiceRef, { currentNumber: newNumber });
      return newNumber;
    });
    
    console.log("Next Invoice Number from Cloud:", nextNumber);
    return nextNumber;
  } catch (error) {
    console.error("Firebase Invoice Fetch Failed:", error);
    throw new Error("Could not connect to cloud database for invoice generation.");
  }
};
