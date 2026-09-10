import { getAllBills } from "../utils/storage";

export const generateBackup = () => {
  try {
    const bills = getAllBills();
    const backupData = {
      timestamp: new Date().toISOString(),
      bills: bills || []
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "Mehfil-E-Nihari_Backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (error) {
    console.error("Backup failed", error);
    return false;
  }
};

export const generateDailyBackup = generateBackup;
export const getAllBackups = () => [];
export const getBackupStats = () => ({ count: 0, size: "0 KB", lastBackup: "Never" });
export const exportAllBackupsAsJSON = generateBackup;
export const scheduleDailyBackup = () => {};
export const stopScheduledBackup = () => {};
