// PM2 Ecosystem Config — Mehfil-E-Nihari POS
// Usage: pm2 start ecosystem.config.cjs
//        pm2 status
//        pm2 logs mehfil-pos
//        pm2 stop mehfil-pos
//        pm2 restart mehfil-pos
//        pm2 delete mehfil-pos

module.exports = {
  apps: [
    {
      name: 'mehfil-pos',
      script: 'server.js',            // Native Node.js production server
      cwd: __dirname,

      // ── Auto-restart & crash recovery ──────────────────────
      autorestart: true,              // Restart on crash
      watch: false,                   // No file watching in production
      max_restarts: 50,               // Max restarts before PM2 gives up
      min_uptime: '3s',               // App must run 3s to be considered "started"
      restart_delay: 2000,            // 2s delay between restarts
      max_memory_restart: '256M',     // Restart if memory exceeds 256MB

      // ── Environment ────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        PORT: 5181,
      },

      // ── Logging ────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_type: 'json',

      // ── Performance ────────────────────────────────────────
      exec_mode: 'fork',              // Single process (not cluster)
      kill_timeout: 5000,             // 5s to gracefully kill before SIGKILL
      listen_timeout: 10000,          // 10s to wait for 'ready' signal

      // ── Exponential backoff restart ────────────────────────
      exp_backoff_restart_delay: 100, // Starts at 100ms, doubles each restart, caps at 15s
    },
  ],
};
