# Mehfil-E-Nihari POS - Server Architecture

## Overview
The POS system now uses a unified master server (`server.js`) that consolidates all backend services and background workers.

## Architecture Components

### 1. Unified Master Server (`server.js`)
The main entry point that boots all services in the correct sequence:
- **Express Backend Server**: Serves the POS frontend and API endpoints
- **Sales Logging Engine**: Records all checkout orders to `data/salesLog.json`
- **D-Drive Backup Routine**: Automated local backups to D: drive
- **WhatsApp Cron Worker**: Scheduled daily reports via WhatsApp

### 2. Sales Logging Engine (`src/utils/salesLog.js`)
- **Purpose**: Records live checkout orders to `data/salesLog.json`
- **Features**:
  - Thread-safe logging of sales data
  - Daily sales totals and breakdowns
  - Hourly sales analysis
  - Top selling items tracking
  - Support for sales updates and deletions
  - Date range queries
  - Archive functionality for old data

### 3. WhatsApp Cron Worker (`whatsappCron.js`)
- **Purpose**: Sends daily close reports to the owner via WhatsApp
- **Features**:
  - Real WhatsApp integration using the existing WhatsApp server
  - Scheduled reports at 11:59 PM daily
  - Missed report detection and catch-up on startup
  - Comprehensive daily sales data in reports
  - Hourly breakdown and top items
  - Payment method breakdown

### 4. D-Drive Backup (`dDriveBackup.js`)
- **Purpose**: Automated local backups to D: drive
- **Features**:
  - Timestamped backup directories
  - Copies entire `data/` directory
  - Error handling and logging

## API Endpoints

### Sales Logging API
- `POST /api/sales/log` - Log a new sale
- `GET /api/sales/:date` - Get sales for a specific date
- `GET /api/sales/today` - Get today's sales
- `GET /api/sales/totals/:date` - Get sales totals for a date
- `GET /api/sales/report/:date` - Get comprehensive daily report
- `GET /api/sales/recent?limit=50` - Get recent sales
- `PUT /api/sales/:id` - Update a sale
- `DELETE /api/sales/:id` - Delete a sale

### Sync API
- `POST /api/sync` - Receive sync batch from POS client
- `GET /api/sync/pull` - Pull queued sync items

### Health Check
- `GET /health` - Server health and service status

## Starting the Server

### Development Mode
```bash
# Start only the main server
npm run start

# Start only WhatsApp server
npm run start:wa

# Start only WhatsApp cron (standalone)
npm run start:cron
```

### Production Mode
```bash
# Using PM2 (recommended)
npm run 🚀 start

# Check status
npm run 🚀 status

# View logs
npm run 🚀 logs

# Stop server
npm run 🚀 stop
```

## Environment Variables

Required environment variables:
- `OWNER_PHONE` - Phone number for daily WhatsApp reports (format: country code + number, e.g., 919999999999)
- `PORT` - Server port (default: 5181)

## Service Dependencies

The unified server requires:
1. **WhatsApp Server** (`whatsapp-server/index.js`) - Must be running on port 5180 for WhatsApp functionality
2. **Data Directory** - `data/` directory must exist for sales logging and backups

## Data Flow

1. **Checkout Process**: Frontend → Sales Log API → `data/salesLog.json`
2. **Daily Reports**: WhatsApp Cron → Sales Log Engine → WhatsApp Server → Owner's Phone
3. **Backup Process**: D-Drive Backup → `data/` → `D:\ResturantBilling\backups\`
4. **Multi-outlet Sync**: POS Client → Sync API → In-memory Queue → Other Outlets

## Integration with Frontend

To integrate the sales logging with the frontend checkout process:

```javascript
import { logSale } from './src/utils/salesLog.js';

// After successful checkout
const saleData = {
  invoiceNumber: bill.invoiceNumber,
  total: bill.total,
  paymentMethod: bill.paymentMethod,
  items: bill.items,
  customerName: bill.customerName,
  customerPhone: bill.customerPhone,
  tableNumber: bill.tableNumber,
  orderType: bill.orderType,
  date: new Date().toISOString().split('T')[0],
  timestamp: new Date().toISOString()
};

logSale(saleData);
```

## Troubleshooting

### WhatsApp Reports Not Sending
1. Ensure WhatsApp server is running: `npm run start:wa`
2. Check OWNER_PHONE environment variable is set
3. Verify WhatsApp connection status in frontend
4. Check logs in `logs/cron.log`

### Sales Not Being Logged
1. Ensure `data/` directory exists and is writable
2. Check server logs for errors
3. Verify API calls are reaching `/api/sales/log`

### Backup Failures
1. Ensure D: drive exists and is accessible
2. Check write permissions for `D:\ResturantBilling\backups\`
3. Verify source `data/` directory exists

## File Structure

```
E:\ResturantBilling\
├── server.js                    # Unified master server
├── whatsappCron.js              # WhatsApp cron worker
├── dDriveBackup.js             # D-Drive backup routine
├── src/
│   └── utils/
│       └── salesLog.js         # Sales logging engine
├── data/
│   └── salesLog.json           # Sales data storage
├── logs/
│   └── cron.log                # WhatsApp cron logs
└── whatsapp-server/
    └── index.js                # WhatsApp Baileys server
```

## Migration Notes

### From Previous Setup
- The old `server.cjs` file is replaced by the new `server.js`
- WhatsApp functionality now requires both `server.js` and `whatsapp-server/index.js`
- Sales logging is now centralized in the sales log engine
- Daily reports use real sales data instead of simulation

### Database Migration
- Existing bills in localStorage are not automatically migrated to sales log
- To migrate historical data, use the sales log API endpoints
- Consider running a one-time migration script if needed