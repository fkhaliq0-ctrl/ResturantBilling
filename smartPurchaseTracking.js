const fs = require('fs');
const path = require('path');

function initializePurchaseTracking() {
    const dataFilePath = path.join('E:\\ResturantBilling', 'purchase_audit.json');

    // Initialize tracking structure if not present
    if (!fs.existsSync(dataFilePath)) {
        const initialData = {
            lastUpdated: new Date().toISOString(),
            trackedItems: {
                "cooking_oil": { stockLevel: 0, consumptionRatePerPlate: 0.05, totalConsumed: 0 }
            }
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log('[Purchase Engine] Created smart consumption tracking audit file.');
    }

    console.log('[Purchase Engine] Smart consumption-based purchase tracking initialized.');
}

module.exports = { initializePurchaseTracking };
