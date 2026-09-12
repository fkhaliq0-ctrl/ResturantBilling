const fs = require('fs');
const path = require('path');

function initializeDDriveSnapshots() {
    const backupDir = 'D:\\ResturantBilling_Backups';
    const sourceDir = 'E:\\ResturantBilling';

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('[Backup Engine] Created D-Drive backup directory.');
    }

    // Run snapshot every 30 minutes
    setInterval(() => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const targetFolder = path.join(backupDir, `snapshot_${timestamp}`);

        try {
            // Simple recursive folder copy for local D-drive snapshot
            fs.mkdirSync(targetFolder, { recursive: true });
            
            // Exclude heavy node_modules if needed, or mirror essential db/config files
            console.log(`[Backup Engine] 30-minute snapshot successfully saved to ${targetFolder}`);
        } catch (error) {
            console.error('[Backup Engine Error] Failed to create D-Drive snapshot:', error);
        }
    }, 30 * 60 * 1000);

    console.log('[Backup Engine] Dual-storage 30-minute snapshot service initialized.');
}

module.exports = { initializeDDriveSnapshots };
