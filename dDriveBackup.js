import fs from 'fs';
import path from 'path';

export function runDDriveBackup() {
  const sourceDir = path.join(process.cwd(), 'data');
  const targetDir = 'D:\\ResturantBilling\\backups';

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupSubDir = path.join(targetDir, 'backup-' + timestamp);
    fs.mkdirSync(backupSubDir, { recursive: true });

    if (fs.existsSync(sourceDir)) {
      fs.cpSync(sourceDir, backupSubDir, { recursive: true });
      console.log('Backup successfully created at: ' + backupSubDir);
      return true;
    } else {
      console.log('Source data directory not found, skipping local backup.');
      return false;
    }
  } catch (error) {
    console.error('Failed to execute D:\\ drive backup:', error);
    return false;
  }
}

// Only run directly if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  runDDriveBackup();
}
