import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeWhatsAppCron } from './whatsappCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Clean SPA fallback middleware compatible with Express 5
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Master server running smoothly on port ${PORT}`);
  
  // Initialize WhatsApp background worker
  try {
    initializeWhatsAppCron();
  } catch (err) {
    console.error('Failed to initialize WhatsApp cron:', err);
  }
});
