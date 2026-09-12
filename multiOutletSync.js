const WebSocket = require('ws');

function initializeOutletSync(server, activeSessionsStore) {
    const wss = new WebSocket.Server({ noServer: true });
    const connectedTerminals = new Set();

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws) => {
        connectedTerminals.add(ws);
        console.log('[Sync Engine] New terminal connected. Active pools:', connectedTerminals.size);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'SYNC_BILL_ISSUE' || data.type === 'TABLE_UPDATE') {
                    broadcastToAllTerminals(wss, data, ws);
                }
            } catch (error) {
                console.error('[Sync Engine Error] Failed to parse message:', error);
            }
        });

        ws.on('close', () => {
            connectedTerminals.delete(ws);
            console.log('[Sync Engine] Terminal disconnected. Active pools:', connectedTerminals.size);
        });
    });

    console.log('[Sync Engine] Multi-outlet WebSocket server initialized successfully.');
}

function broadcastToAllTerminals(wss, payload, senderWs) {
    wss.clients.forEach((client) => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}

module.exports = { initializeOutletSync };
