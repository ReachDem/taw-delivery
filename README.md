# TAW Delivery

Plateforme web de gestion des propositions de livraison pour agences, agents, livreurs et administrateurs.
Le projet vise à digitaliser le cycle complet **commande → proposition client → décision → planification de livraison**.

---

## Sommaire

- [Vision du projet](#vision-du-projet)
- [Fonctionnalités clés](#fonctionnalités-clés)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Configuration des variables d’environnement](#configuration-des-variables-denvironnement)
- [Base de données & Prisma](#base-de-données--prisma)
- [Lancement du projet](#lancement-du-projet)
- [Scripts disponibles](#scripts-disponibles)
- [Rôles et permissions](#rôles-et-permissions)
- [Flux fonctionnel](#flux-fonctionnel)
- [API (aperçu)](#api-aperçu)
- [Qualité & tests](#qualité--tests)
- [Sécurité & bonnes pratiques](#sécurité--bonnes-pratiques)
- [Dépannage (troubleshooting)](#dépannage-troubleshooting)
- [Roadmap](#roadmap)
- [Contribution](#contribution)

---

## Vision du projet

TAW Delivery est conçu pour aider une agence de transport/livraison à :

- centraliser les commandes,
- envoyer automatiquement des propositions de livraison par SMS/email,
- recueillir la décision du client,
- attribuer des créneaux de livraison,
- améliorer le suivi opérationnel des équipes.

Le socle produit est pensé pour une montée en charge progressive : interface agent/admin, flux client mobile-first, traçabilité des actions et extension vers le temps réel.

---

## Fonctionnalités clés

### Déjà présentes dans le socle

- Gestion des entités métier : agences, agents, livreurs, clients, commandes, propositions, créneaux, réservations.
- Authentification et gestion des rôles via Better Auth.
- Organisation multi-agences via le modèle `Organization` / `Member` / `Invitation`.
- API internes (Next.js routes) pour les ressources principales (`agencies`, `agents`, `orders`, etc.).
- Outils de messagerie côté serveur (email + base pour SMS) avec journalisation (`MessageLog`).
- Génération de liens de proposition courts (intégration `rcdm.ink`).

### En cours / extensions prévues

- Tracking temps réel (Socket.io) et notifications live.
- Enrichissement UX côté client (acceptation/refus, géolocalisation, créneau, paiement).
- Analytique opérationnelle par agence et par agent.

---

## Stack technique

- **Frontend** : Next.js 16, React 19, TypeScript
- **UI** : Tailwind CSS 4, composants Shadcn UI, Lucide
- **Backend** : Route Handlers Next.js + Server Actions
- **Auth** : Better Auth
- **Base de données** : PostgreSQL serverless (Neon)
- **ORM** : Prisma
- **Tests** : Vitest + Testing Library
- **Package manager recommandé** : `pnpm`

---

## Architecture du projet

```txt
app/
  (agent)/, (super)/, admin/, api/
components/
lib/
prisma/
scripts/
tests/
```

### Repères utiles

- `app/api/*` : endpoints backend par domaine métier.
- `app/actions/*` : server actions pour la logique côté serveur.
- `lib/*` : auth, Prisma client, email, SMS, utilitaires métier.
- `prisma/schema.prisma` : modèle de données complet.
- `scripts/*` : scripts utilitaires (migration org, super admin, vérifications).

---

## Prérequis

- Node.js **>= 20**
- `pnpm` installé globalement
- Une base PostgreSQL accessible (Neon recommandé)

Installation de pnpm (si nécessaire) :

```bash
npm install -g pnpm
```

---

## Installation locale

```bash
git clone <url-du-repo>
cd taw-delivery
pnpm install
```

---

## Configuration des variables d’environnement

1. Créer un fichier `.env` à la racine.
2. Ajouter les variables nécessaires (exemple ci-dessous).
3. **Ne jamais versionner vos secrets**.

### Exemple `.env` minimal

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="change-me"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP (email)
SMTP_HOST="smtp.provider.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="change-me"

# SMS provider
MBOA_SMS_USERID="..."
MBOA_SMS_API_PASSWORD="..."
MBOA_SMS_SENDER_NAME="TAW"

# URL shortener token
RCDM_INK_TOKEN="..."
```

### Variables fréquemment utilisées

- `DATABASE_URL` : connexion PostgreSQL (Prisma/Neon).
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` : configuration auth.
- `NEXT_PUBLIC_APP_URL` : URL publique de l’app.
- `SMTP_*` : envoi d’emails (invitations, notifications).
- `MBOA_SMS_*` : envoi SMS côté serveur.
- `RCDM_INK_TOKEN` : création/gestion des liens courts.

---

## Base de données & Prisma

### Générer le client Prisma

```bash
pnpm prisma generate
```

### Appliquer le schéma sur la base

```bash
pnpm prisma db push
```

### Ouvrir Prisma Studio

```bash
pnpm prisma studio
```

> Le build exécute automatiquement `prisma generate` avant `next build`.

---

## Lancement du projet

### Développement

```bash
pnpm dev
```

Application accessible sur : [http://localhost:3000](http://localhost:3000)

### Production (local)

```bash
pnpm build
pnpm start
```

---

## Scripts disponibles

- `pnpm dev` : démarre le serveur de développement.
- `pnpm build` : génère Prisma + build Next.js.
- `pnpm start` : démarre le serveur Next.js en mode production.
- `pnpm lint` : lance ESLint.
- `pnpm test` : lance Vitest.
- `pnpm test:coverage` : exécute les tests avec couverture.
- `pnpm test:ui` : interface UI de Vitest.

Scripts utilitaires (`scripts/`) :

- `scripts/migrate-to-better-auth.ts` : migration agences → organizations.
- `scripts/create-superadmin.ts` : bootstrap d’un super admin.
- `scripts/cleanup-test-agencies.ts` : nettoyage de données de test.
- `scripts/verify-booking.ts` : vérifications métier de réservation.

---

## Rôles et permissions

Rôles applicatifs principaux :

- `SUPER_ADMIN` : supervision globale.
- `ADMIN` : administration d’agence.
- `AGENT` : saisie/suivi des commandes.
- `DRIVER` : exécution des livraisons.

Le modèle relationnel intègre aussi des memberships d’organisation (`owner/admin/member`) pour la gouvernance multi-agences.

---

## Flux fonctionnel

1. L’agent enregistre une commande.
2. Le système crée une proposition liée à la commande.
3. Un lien de décision est généré puis envoyé (SMS/email).
4. Le client accepte/refuse.
5. En cas d’acceptation : choix du créneau + adresse + option de paiement.
6. La commande passe dans le pipeline opérationnel de livraison.

---

## API (aperçu)

Endpoints principaux exposés sous `app/api/*` :

- `/api/agencies`
- `/api/agents`
- `/api/drivers`
- `/api/clients`
- `/api/orders`
- `/api/proposals`
- `/api/bookings`
- `/api/seed` (usage dev/test)

Selon les routes, des garde-fous existent pour limiter certains comportements en production.

---

## Qualité & tests

Commandes recommandées avant merge :

```bash
pnpm lint
pnpm test
pnpm build
```

Le dossier `tests/` contient la base des tests unitaires/intégration (Vitest + Testing Library).

---

## Sécurité & bonnes pratiques

- Ne jamais committer `.env` ni des clés API.
- Utiliser des secrets différents par environnement (dev/staging/prod).
- Restreindre les scripts sensibles aux environnements non production si nécessaire.
- Vérifier les permissions côté serveur (session, rôle, organisation active).

---

## Dépannage (troubleshooting)

### Erreur Prisma liée à la base

- Vérifier `DATABASE_URL`.
- Exécuter `pnpm prisma generate` puis `pnpm prisma db push`.

### Problème d’authentification

- Vérifier `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
- Contrôler que la base contient bien les tables Better Auth.

### Emails non envoyés

- Vérifier `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
- Vérifier les logs serveur.

### Liens courts non créés

- Vérifier `RCDM_INK_TOKEN`.
- Contrôler l’accès réseau sortant à `rcdm.ink`.

---

## Roadmap

- Interface client finale (acceptation/refus + tunnel complet).
- Optimisation des tableaux de bord agent/admin.
- Intégration tracking live livreur.
- Automatisation relances et règles métiers avancées.
- Renforcement observabilité (logs + audit détaillé).

---

## Contribution

1. Créer une branche dédiée.
2. Développer avec conventions TypeScript/ESLint existantes.
3. Exécuter lint/tests/build.
4. Ouvrir une PR claire avec contexte, impacts et plan de validation.

---

Si vous voulez, je peux aussi fournir une version **README “production-ready open source”** avec badges, sections SLA/monitoring, diagrammes Mermaid et templates d’issues/PR.
