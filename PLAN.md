# Plan : Système de Notification & Retrait de Colis

> **TL;DR** — Application Next.js multi-agences pour gérer l'arrivée des colis (scan QR → formulaire), notifier les destinataires par SMS, et tracker le processus jusqu'au retrait/livraison.

---

## Workflow

```
1. SCAN QR CODE → Agent scanne le QR du colis → obtient le CODE
2. ENREGISTREMENT → Agent remplit formulaire → Statut: "ARRIVÉ"
3. NOTIFICATION → SMS envoyé: "Votre colis [CODE] est arrivé" → Statut: "EN_ATTENTE"
4. CONFIRMATION → Destinataire choisit retrait ou livraison via lien
5. LIVRAISON (si demandée) → Statut: "EN_LIVRAISON"
6. CLÔTURE → Statut: "RETIRÉ" ou "LIVRÉ"
```

---

## Statuts du Colis

| Statut | Description | Déclencheur |
|--------|-------------|-------------|
| `ARRIVÉ` | Colis scanné et enregistré en agence | Scan QR + formulaire |
| `EN_ATTENTE` | SMS envoyé, attente réponse destinataire | Après envoi SMS |
| `EN_LIVRAISON` | Livraison programmée, en cours | Attribution livreur |
| `RETIRÉ` | Client venu chercher en agence | Confirmation agent |
| `LIVRÉ` | Livré à domicile | Confirmation livreur |

---

## Schéma Base de Données (Supabase)

### agencies
- id, name, country, address, phone

### users
- id, email, role (admin/agent/livreur), agency_id

### parcels
- id, **code** (QR), description, weight
- recipient_name, recipient_phone, recipient_address
- **status**, agency_id, created_at, created_by
- external_id (pour future intégration)

### delivery_slots
- id, agency_id, day_of_week, start_time, end_time, max_deliveries

### delivery_zones
- id, agency_id, zone_name, delivery_fee

### confirmations
- id, parcel_id, choice (retrait/livraison), address, zone_id, slot_id, confirmed_at

### deliveries
- id, parcel_id, driver_id, scheduled_date, slot_id, status, completed_at

### notifications
- id, parcel_id, type (sms/email), recipient, message, status, sent_at

### tracking_events
- id, parcel_id, event_type, data (JSON), user_id, created_at

---

## Structure Fichiers

```
app/
├── (admin)/
│   ├── layout.tsx              # Sidebar + header admin
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── scan/page.tsx           # Scan QR + formulaire
│   ├── parcels/
│   │   ├── page.tsx            # Liste
│   │   └── [code]/page.tsx     # Détails colis
│   ├── deliveries/page.tsx
│   └── settings/page.tsx
├── c/[code]/page.tsx           # Page publique (lien court)
├── api/
│   ├── parcels/...
│   ├── notify/...
│   ├── confirm/...
│   └── deliveries/...
└── layout.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── schema.sql
├── sms/
│   └── mboa.ts
├── tracking.ts
└── types.ts
```

---

## API Routes

### Colis
- `POST /api/parcels` - Enregistrer après scan
- `GET /api/parcels` - Liste filtrée par statut/agence
- `PATCH /api/parcels/[code]/status` - Changer statut
- `POST /api/parcels/import` - Import CSV

### Notification
- `POST /api/notify/[code]` - Envoyer SMS pour un colis

### Confirmation publique
- `GET /api/confirm/[code]` - Infos colis pour page publique
- `POST /api/confirm/[code]` - Soumettre choix destinataire

### Livraisons
- `GET /api/deliveries` - Liste livraisons
- `PATCH /api/deliveries/[id]` - Mettre à jour statut

---

## Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mboa SMS (côté serveur uniquement)
MBOA_SMS_USERID=
MBOA_SMS_API_PASSWORD=
MBOA_SMS_SENDER_NAME=

# App
NEXT_PUBLIC_SHORT_DOMAIN=
```

---

## API SMS Mboa

```typescript
const userID = process.env.MBOA_SMS_USERID;
const password = process.env.MBOA_SMS_API_PASSWORD;

export async function sendSMS(sender: string, message: string, phone: string) {
  const response = await fetch("https://mboadeals.net/api/v1/sms/sendsms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userID,
      password: password,
      message: message,
      phone_str: phone,
      sender_name: sender,
    }),
  });
  if (!response.ok) throw new Error("Failed to send SMS");
  return response.json();
}
```

---

## Tracking Events

| Event Type | Données trackées |
|------------|------------------|
| `parcel.created` | Code, agence, opérateur, timestamp |
| `parcel.status_changed` | Ancien → nouveau statut, qui, quand |
| `notification.sent` | Type, destinataire, statut |
| `confirmation.received` | Choix (retrait/livraison), timestamp |
| `delivery.assigned` | Livreur assigné, créneau |
| `delivery.completed` | Timestamp |

---

## Décisions Techniques

- **Scan QR** : `html5-qrcode` (léger, pas de dépendances natives)
- **Multi-agences** : Row Level Security (RLS) Supabase
- **SMS côté serveur** : Credentials jamais exposés au client
- **Prêt pour intégration** : Champ `external_id` pour future API source

---

## Dépendances à installer

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod html5-qrcode
```
