# TAW Delivery - Système de Notification & Retrait de Colis

Application Next.js multi-agences pour gérer l'arrivée des colis, notifier les destinataires par SMS, et tracker le processus jusqu'au retrait/livraison.

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with PostCSS
- **Database**: Supabase (PostgreSQL)
- **QR Code**: html5-qrcode
- **Validation**: Zod
- **Package Manager**: pnpm
- **SMS**: Mboa SMS API

## 📦 Features

- **Multi-agency Management**: Support for multiple agencies with Row Level Security
- **QR Code Scanning**: Scan parcel QR codes for quick registration
- **SMS Notifications**: Automatic SMS notifications to recipients
- **Delivery Tracking**: Track parcels from arrival to delivery
- **Public Confirmation**: Recipients can choose pickup or delivery via short link
- **Admin Dashboard**: Statistics and management interface
- **Role-based Access**: Admin, Agent, and Delivery roles

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm (install via `npm install -g pnpm`)
- Supabase account
- Mboa SMS account (for notifications)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ReachDem/taw-delivery.git
cd taw-delivery
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mboa SMS
MBOA_SMS_USERID=your-user-id
MBOA_SMS_API_PASSWORD=your-api-password
MBOA_SMS_SENDER_NAME=TAWDELIVERY

# App
NEXT_PUBLIC_SHORT_DOMAIN=http://localhost:3000
```

4. Set up the database:
   - Create a Supabase project
   - Run the SQL schema from `lib/supabase/schema.sql`
   - Set up Row Level Security policies

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📁 Project Structure

```
taw-delivery/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Protected admin routes
│   │   ├── dashboard/     # Dashboard with stats
│   │   ├── scan/          # QR code scanner
│   │   ├── parcels/       # Parcel management
│   │   ├── deliveries/    # Delivery management
│   │   ├── login/         # Login page
│   │   └── settings/      # Settings
│   ├── c/[code]/          # Public confirmation page
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Utilities and libraries
│   ├── supabase/         # Supabase client setup
│   ├── sms/              # SMS integration
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## 🔧 Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
pnpm seed     # Seed database (if configured)
```

## 📊 Workflow

1. **SCAN QR CODE** → Agent scans parcel QR code
2. **REGISTRATION** → Agent fills form → Status: "ARRIVÉ"
3. **NOTIFICATION** → SMS sent to recipient → Status: "EN_ATTENTE"
4. **CONFIRMATION** → Recipient chooses pickup or delivery
5. **DELIVERY** (if requested) → Status: "EN_LIVRAISON"
6. **COMPLETION** → Status: "RETIRÉ" or "LIVRÉ"

## 🔒 Security

- Row Level Security (RLS) enabled on Supabase
- Server-side SMS credentials (never exposed to client)
- TypeScript for type safety
- Environment variables for sensitive data

## 📖 Documentation

For detailed architecture and implementation details, see [PLAN.md](PLAN.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

