// ── App Configuration ────────────────────────────────────────
// Central config for drive paths, encryption, and backup settings.

export const APP_CONFIG = {
  // Default drive for backups (D: or E:)
  defaultDrive: 'E:',

  // Backup folder name inside the drive
  backupFolder: 'MehfilE_Nihari_Backups',

  // Database encryption key (AES-256-compatible seed)
  // ⚠️ Change this in production and keep it secret!
  encryptionKey: 'Mehfil-ENihari-2026-POS-EncKey-v1!',

  // Auto-backup settings
  autoBackup: {
    enabled: true,
    // Time window: auto-backup only runs between these hours (24h format)
    startHour: 6,   // 6 AM
    endHour: 23,     // 11 PM
    // Minimum interval between auto-backups (ms) — prevents duplicates
    minIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
  },

  // Admin PIN required for dangerous operations
  adminPinRequired: true,

  // App info
  appName: 'Mehfil-E-Nihari',
  version: '1.1.0',
  buildDate: '2026-09-06',
};
