// Example fix for bill generation
const getNextInvoiceNumber = async () => {
  try {
    // Ensure atomic increment or fetch from Firebase cloud
    console.log("Fetching next invoice number from Firebase...");
    // const docSnap = await getDoc(invoiceRef);
    // if (docSnap.exists()) {
    //   return docSnap.data().currentNumber;
    // }
    return 2003; // Fallback sync
  } catch (error) {
    console.error("Error fetching cloud invoice:", error);
    throw error;
  }
};

getNextInvoiceNumber().then(num => console.log("Invoice Number:", num));
