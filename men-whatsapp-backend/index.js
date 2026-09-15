const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const cron = require('node-cron');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp Bot Connected Successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// --- CRON JOBS ---

// 1. Daily Owner Report at 11:59 PM
cron.schedule('59 23 * * *', async () => {
    console.log('Running Daily Owner Report Cron Job...');
    try {
        const ownerNumber = '919876543210@s.whatsapp.net';
        const message = '📊 *Mehfil-E-Nihari - Daily Summary*\n\nSales & Expense report for today is ready.';
        if (sock) {
            await sock.sendMessage(ownerNumber, { text: message });
            console.log('Daily owner report sent successfully.');
        }
    } catch (error) {
        console.error('Failed to send daily report:', error);
    }
});

// 2. Quarterly CA Report (1st day of Jan, Apr, Jul, Oct at 9:00 AM)
cron.schedule('0 9 1 1,4,7,10 *', async () => {
    console.log('Running Quarterly CA Report Cron Job...');
    try {
        const caNumber = '919876543210@s.whatsapp.net';
        const message = '📈 *Mehfil-E-Nihari - Quarterly CA Report*\n\nFinancial statements for the ending quarter are ready.';
        if (sock) {
            await sock.sendMessage(caNumber, { text: message });
            console.log('Quarterly CA report sent successfully.');
        }
    } catch (error) {
        console.error('Failed to send quarterly CA report:', error);
    }
});

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    try {
        await sock.sendMessage(phone + '@s.whatsapp.net', { text: message });
        res.status(200).json({ success: true, message: 'Message sent!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log('WhatsApp Backend Service running on port ' + PORT);
    connectToWhatsApp();
});
