# TAW-Delivery - Stack Technique

## Vue d'ensemble

Application de gestion de livraison pour agences, permettant de proposer des créneaux aux clients via SMS/Email.

---

## Stack Actuelle (Milestone 1)

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Shadcn UI |
| **Backend** | Next.js API Routes |
| **Base de données** | Neon (PostgreSQL serverless) |
| **ORM** | Prisma |
| **Auth** | Better-Auth |
| **Icônes** | Lucide React |

---

## Stack Future (Milestone 2+)

| Fonctionnalité | Technologie |
|----------------|-------------|
| **Temps réel** | Socket.io (tracking livreurs, notifications live) |
| **SMS** | API SMS locale (Orange/Twilio) |
| **Email** | Resend / Mailgun |
| **File Storage** | À définir |

---

## Entités de Données

### Authentification (Better-Auth)
- `User` - Utilisateurs avec rôles
- `Session` - Sessions actives
- `Account` - Connexions OAuth
- `Verification` - Tokens de vérification

### Métier
- `Agency` - Agences
- `Agent` - Personnel des agences
- `Driver` - Livreurs
- `Client` - Destinataires
- `Order` - Commandes
- `DeliveryProposal` - Propositions de livraison
- `TimeSlot` - Créneaux horaires (9h-17h, 1h, max 4/slot)
- `Booking` - Réservations de créneaux
- `MessageLog` - Historique SMS/Email

### Rôles
- `SUPER_ADMIN` - Accès total
- `ADMIN` - Gestion d'agence
- `AGENT` - Saisie commandes
- `DRIVER` - Livraisons

---

## Variables d'Environnement

```env
# Database
DATABASE_URL="postgresql://...@neon.tech/taw-delivery"

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Future: Socket.io
# SOCKET_PORT=3001

# Future: Messaging
# SMS_API_KEY="..."
# EMAIL_API_KEY="..."
```

---

## Scripts

```bash
pnpm dev          # Développement
pnpm build        # Build production
pnpm prisma db push    # Sync schema
pnpm prisma studio     # Interface DB
pnpm prisma generate   # Générer client
```
