# Mehfil-E-Nihari POS System

A complete restaurant Point of Sale (POS) system for Nihari restaurant management.

## Features

- Multi-table order management
- Dine-in and takeaway order types
- Real-time inventory tracking
- WhatsApp bill notifications
- Daily sales reports
- Staff management and attendance
- GST compliance reporting
- Thermal printer support
- Kitchen display system (KDS)

## Installation

```bash
cd E:\ResturantBilling
npm install
```

## Running the Application

```bash
# Start frontend only
npm run dev

# Start WhatsApp server only
npm run dev:wa

# Start both
npm run dev:all
```

## Staff Distribution

Official app download link for staff:
https://drive.google.com/file/d/1sL9_Hari4tIWb9JfNEa-HojJpyBRiVg0/view?usp=sharing

## Invoice/Receipt Logo

For thermal printing and monochrome invoices, use the clean black-and-white logo at:
`D:\invoice-logo.png`

## Tech Stack

- Frontend: React 19 + Vite 8 + Tailwind CSS 4
- Backend: Node.js + Express (WhatsApp server)
- Database: IndexedDB (local) + Firebase Firestore (cloud)
- WhatsApp: @whiskeysockets/baileys 7.x

## Support

For issues or questions, please contact the system administrator.