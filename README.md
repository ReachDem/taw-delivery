# TAW Delivery - Système de Notification & Retrait de Colis

Application Next.js multi-agences pour gérer l'arrivée des colis (scan QR → formulaire), notifier les destinataires par SMS, et tracker le processus jusqu'au retrait/livraison.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: pnpm
- **Validation**: Zod
- **QR Code**: html5-qrcode
- **SMS**: Mboa SMS API

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (install with `npm install -g pnpm`)

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
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase and Mboa SMS credentials.

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
taw-delivery/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin/agent routes (protected)
│   │   ├── dashboard/     # Dashboard with stats
│   │   ├── scan/          # QR code scanner
│   │   ├── parcels/       # Parcel management
│   │   ├── deliveries/    # Delivery management
│   │   ├── users/         # User management
│   │   └── settings/      # Settings
│   ├── api/               # API routes
│   ├── c/[code]/          # Public confirmation page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Utilities and business logic
│   ├── supabase/         # Supabase client & schema
│   ├── sms/              # SMS service (Mboa)
│   ├── types.ts          # TypeScript types
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Helper functions
├── public/                # Static assets
└── scripts/              # Utility scripts

```

## Environment Variables

See `.env.example` for all required environment variables:

- **Supabase**: Database and authentication
- **Mboa SMS**: SMS notification service
- **App Config**: Application settings

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm seed` - Seed database with sample data

## Workflow

1. **SCAN QR CODE** → Agent scans parcel QR code
2. **REGISTRATION** → Agent fills form → Status: "ARRIVÉ"
3. **NOTIFICATION** → SMS sent to recipient → Status: "EN_ATTENTE"
4. **CONFIRMATION** → Recipient chooses pickup or delivery
5. **DELIVERY** (if requested) → Status: "EN_LIVRAISON"
6. **COMPLETION** → Status: "RETIRÉ" or "LIVRÉ"

## Parcel Statuses

| Status | Description |
|--------|-------------|
| `ARRIVÉ` | Parcel scanned and registered at agency |
| `EN_ATTENTE` | SMS sent, waiting for recipient confirmation |
| `EN_LIVRAISON` | Delivery scheduled, in progress |
| `RETIRÉ` | Picked up at agency |
| `LIVRÉ` | Delivered to address |

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Deployment

The application can be deployed on:

- [Vercel](https://vercel.com) (recommended for Next.js)
- Any platform supporting Node.js applications

Make sure to set up all environment variables in your deployment platform.

## Project Details

For detailed technical planning and database schema, see [PLAN.md](./PLAN.md).

## License

Private repository - ReachDem

---

**Issue Reference**: REA2-12
