# Milestone 1 : Architecture & Flow de Proposition de Livraison

### TL;DR

 TGVAIRWABO : agence de transport et de livraison international de colis entre l'europe et le Cameroun.  

Ce premier milestone vise à poser toute l’architecture logicielle et organisationnelle pour orchestrer le flow de proposition de livraison : depuis la saisie de commande en agence, jusqu’à la décision du client (acceptation ou refus) après réception d’un message contenant un lien personnalisé. Les fonctionnalités incluent la mise en place des entités, des interfaces principales, du système de génération de liens, et du flux transactionnel pour informer le client, recueillir sa réponse et gérer la suite (créneau de livraison, retrait agence, paiement à la livraison). Le public cible inclut : agents d’agence, destinataires/clients, livreurs, et administrateurs d’agence.

---

## Goals

### Business Goalsenvoi

* Réduire de 30 % le taux de no-shows sur les livraisons sous 6 mois.

* Améliorer le NPS (Net Promoter Score) client de +10 points d’ici le prochain trimestre.

* Optimiser de 20 % l’organisation des tournées de livraison (temps, coûts, kilomètres parcourus).

* Accroître le taux de confirmation de livraison à plus de 85 % par flux digitalisé.

* Réduire la charge administrative liée aux relances manuelles d’au moins 60 %.

### User Goals

* Permettre au client de choisir facilement entre livraison et retrait en agence.

* Offrir une transparence totale sur l’état de la commande et les prochaines étapes.

* Faciliter la gestion des créneaux et préférences de livraison pour une expérience flexible.

* Permettre un paiement simple : à la livraison ou ultérieurement selon son choix.

* Offrir aux agents un outil rapide pour enregistrer, suivre et traiter chaque commande.

### Non-Goals

* La gestion d’un paiement avancé ou en ligne intégral pendant ce milestone (paiement final se fait à la livraison si non déjà payé).

* L’intégration avec des solutions externes tierces (ERP, partenaires logistiques) hors SMS/email.

* L’implémentation de fonctionnalités de fidélisation ou de suivi post-livraison (de type tracking geolocalisé ou campagne marketing).

---

## User Stories

### 1\. Agent en agence

* En tant qu’agent, je veux saisir les détails du client et de la commande pour générer une proposition de livraison.

* En tant qu’agent, je veux suivre les retours (acceptation/refus) des clients depuis mon interface afin d’assurer le suivi des colis.

* En tant qu’agent, je veux voir le statut de chaque proposition envoyée (en attente, accepté, refusé).

### 2\. Client destinataire

* En tant que client, je veux recevoir un SMS/email avec un lien clair vers la proposition de livraison pour choisir facilement ce que je souhaite.

* En tant que client, je veux pouvoir accepter ou refuser la livraison et voir clairement comment/si je peux retirer en agence.

* En tant que client, après acceptation, je veux choisir un créneau, renseigner ma localisation et décider si je paierai à la livraison.

### 3\. Livreur

* En tant que livreur, je veux accéder à la liste des livraisons confirmées et à leurs créneaux pour préparer et optimiser ma tournée.

* En tant que livreur, je veux savoir si le client paiera à la livraison ou non.

### 4\. Administrateur d’agence

* En tant qu’admin d’agence, je veux visualiser toutes les statistiques d’acceptation/refus par agence et par agent pour adapter mes processus.

* En tant qu’admin d’agence, je veux gérer la configuration des agences, des agents et des créneaux de livraison pour mon périmètre.

### 5\. Administrateur système

* En tant qu’admin système, je veux garantir la traçabilité de chaque étape du flow (génération lien, envoi message, réponse client, statut paiement).

* En tant qu’admin système, je veux pouvoir auditer et diagnostiquer les flux de messagerie SMS/email en cas de litige ou incident.

---

## Functional Requirements

* **Gestion des Entités** (Priorité : Élevée)

  * Agences : CRUD agences (nom, localisation, administrateur).

  * Personnel : CRUD agents/agences, gestion des rôles.

  * Livreurs : CRUD livreurs, affectation aux tournées.

* **Système de Commandes & Génération de liens** (Priorité : Élevée)

  * Saisie d’une nouvelle commande, informations client (nom, téléphone, email, produit, etc.).

  * Enregistrement automatique en base.

  * Génération d’un lien unique (raccourci URL avec metadata de la commande).

  * Attribution d’un statut initial (en attente réponse client).

* **Système de Messagerie (SMS/email)** (Priorité : Élevée)

  * Génération et envoi automatique d’un message (choix canal SMS OU email selon données dispo).

  * Texte personnalisable (nom client, code, lien).

  * Journalisation des envois et statuts de délivrance.

* **Interfaces Utilisateur** (Priorité : Élevée)

  * Interface Agent Agence : saisie, suivi, historiques, gestion des commandes.

  * Interface Livraison (Livreur) : liste des livraisons confirmées, créneaux, paiements.

  * Interface Admin Agence : gestion des agences, agents, stats de flow.

  * Interface Client (web : mobile-first) : page de choix de proposition, sélection créneau, localisation, réponse ferme.

* **Flow de Proposition & Décision Client** (Priorité : Critique)

  * Page client affiche détail commande, bouton accepter/refuser livraison.

  * Si refus : affichage message personnalisé (invitation au retrait en agence).

  * Si acceptation : page suivante pour choix créneau + localisation + paiement (optionnel).

* **Gestion des créneaux et disponibilités** (Priorité : Moyenne)

  * Gestion des créneaux sur interface agent + proposition dynamique des disponibilités au client selon planning agence/livreur.

  * Mécanisme de verrouillage créneau sur acceptation.

* **Système de Paiement à la livraison** (Priorité : Moyenne)

  * Option paiement à la livraison, gestion du statut paiement (“à payer”, “payé”, “exempté”).

  * Dashboard pour agent et livreur.

---

## User Experience

**Entry Point & First-Time User Experience**

* Agent : Accès à l’interface via login sécurisé en agence (web app), tuto contextuel la première fois.

* Client : Découvre la proposition via SMS/email reçu contenant le lien personnalisé (aucun login requis).

* Livreur/Admin : Connexion sur leurs interfaces respectives, affichage simple de leurs missions/permissions.

**Core Experience**

* **Étape 1 : Saisie par l’agent**

  * L’agent ouvre l’interface agence.

  * Saisie formulaire avec : nom, mobile, email client, détails commande.

  * Validation avec feedback immédiat (champ obligatoire, format tel/mail, erreurs).

  * Au “submit”, commande enregistrée, statut initial “En attente client”.

* **Étape 2 : Génération & Envoi Message**

  * Génération en DB d’une entrée commande + proposition.

  * Génération d’un lien URL unique avec metadata (hash, expiry).

  * Envoi d’un SMS ou email au client, selon data saisie (priorité SMS si mobile, fallback email).

  * Agent voit l’état “Message envoyé”.

* **Étape 3 : Consultation du client**

  * Le client clique sur le lien, arrive sur la page web mobile.

  * Détail de la commande affiché, choix “Accepter la livraison” ou “Refuser”.

* **Étape 4 : Décision**

  * **Cas Refus :**

    * Confirmation du refus, message personnalisé : “Votre colis vous attend en agence du XX au XX. Des frais pourraient s’appliquer.”

    * L’agent/agence reçoit notification du refus, commande reste en stock agence.

  * **Cas Acceptation :**

    * Interface : choix d’un créneau de livraison proposé (UI calendrier / boutons horaires).

    * Le client renseigne localité/adresse précise.

    * Indication mode de paiement : “Paiement à la livraison – espèces ou autre mode”.

    * Confirmation récap : tout résumer, “Valider mon créneau”.

    * L’agent et le livreur voient la commande “Acceptée, créneau attribué”.

* **Étape 5 : Livraison et Paiement**

  * Le livreur accède à la liste des colis, prépare sa tournée.

  * À la livraison, paiement selon le statut : à percevoir ou exonéré.

  * Mise à jour status après livraison et paiement.

**Advanced Features & Edge Cases**

* Relance automatique en cas de non-réponse sous 24 h.

* Gestion des refus implicites (“timeout”), notification à l’agent.

* Journalisation fine des ouvertures de liens et réponses pour audit.

* Cas où client ne peut pas ouvrir/recevoir le lien : process de fallback ou réenvoi manuel.

* Multi-langue (FR/Wolof) sur l’interface client.

**UI/UX Highlights**

* Mobile-first pour tous : pages client ultra-légères (connexion inutile, UI directe).

* Contraste, lisibilité, et couleurs respectant RGAA.

* Interface agent sur desktop et tablette : encore plus rapide pour la saisie.

* Gestion d’erreur UX explicite (bad link, proposition périmée, creneau full…).

---

## Narrative

À Dakar, dans le tumulte quotidien de l’agence principale, Aminata accueille d’innombrables clients, jongle avec les appels et les demandes urgentes. Ce matin, elle reçoit l’arrivée d’une livraison pour Mamadou, un client habitué mais souvent en déplacement. En quelques secondes via l’interface, elle saisit toutes les informations de Mamadou : nom, téléphone, produit, consigne spéciale. À peine la commande validée, un SMS personnalisé part automatiquement — “Bonjour Mamadou, souhaitez-vous recevoir votre colis ? Cliquez ici !”.  

Mamadou, en réunion, reçoit la notification sur son téléphone. Il clique, découvre un écran clair : détail du colis, options “Accepter la livraison” ou “Refuser (et venir en agence)”. Il choisit “Accepter”, sélectionne le seul créneau du soir libre, précise son adresse, et valide. Pas besoin de payer tout de suite, il règle tranquillement en espèces à la livraison, comme il préfère.  

Grâce à ce système fluide, Aminata suit en temps réel la décision, programme le passage du livreur, et l’agence réduit ses colis non réclamés. Pour Mamadou, c’est une expérience souple, transparente, qui lui enlève un stress inutile. Et pour l’entreprise, c’est une boucle digitale qui économise temps, argent, et améliore la satisfaction de tous.

---

## Success Metrics

### User-Centric Metrics

* Taux d’ouverture des liens de proposition (objectif : ≥90%).

* Taux d’acceptation de proposition de livraison (objectif : ≥85%).

* Satisfaction clients (survey post-action, objectif : ≥8/10).

* Temps moyen entre envoi message et prise de décision (<24h).

### Business Metrics

* Diminution du taux de no-shows en agence (>30% dans 3 mois).

* Augmentation du nombre de livraisons confirmées (+20% après 3 mois).

* Taux optimalisation tournées/livraison (livraisons/groupes par tournée).

### Technical Metrics

* Temps moyen de génération du lien (<2s).

* Disponibilité système (SLA ≥99,5%).

* Taux de délivrance SMS/email (>96%).

* Nombre d’incidents rapportés par agents ou clients (<0,5% actions).

### Tracking Plan

* Nombre de commandes saisies par agent.

* Envois de messages (par canal).

* Ouverture de chaque lien (timestamp, device, localité).

* Sélection/refus de proposition (statut associé).

* Validation créneau et localisation par client.

* Paiement à la livraison (statut mis à jour).

* Aller-retours agent/livreur (actions post décision client).

---

## Technical Considerations

### Technical Needs

* **Base de données structurée** pour les entités : agences, agents, livreurs, clients, commandes, propositions, créneaux.

* **API REST** pour tous les échanges Front–Back (ex : POST commande, GET statut, PUT créneau).

* **Front-End web** pour chaque interface acteur : Agency, Livreur, Admin, Client (cette dernière mobile-first, publique et sans login).

* **Back-End** : orchestration flow, logique métier, envoi SMS/email (via intégrateur).

* **Génération sécurisée de liens** (hash unique + expiry + permission checking).

### Integration Points

* Intégration SMS (fournisseur SMS local, ex: Orange/SMSAPI).

* Intégration Email (SMTP ou API mandataire tierce, ex Mailgun).

* Authentification interne (pour agents/admins).

### Data Storage & Privacy

* Stockage sécurisé (data chiffrée en transit & au repos).

* Limitation des PII exposées sur lien client (hash, timeouts, aucune info sensible dans URL).

* Traçabilité et logs actionnables pour chaque action.

* Conformité RGPD (droit à l’oubli, journalisation des consentements).

### Scalability & Performance

* Architecture prête à supporter 10x le trafic actuel (prévision croissance dans 12 mois).

* Système de files pour la gestion de pics d’envois (SMS/Email).

* Load balancing API/Front pour répondre à pics de consultation.

### Potential Challenges

* Gestion des échecs d’envoi SMS/email (retry, alertes).

* Sécurité du lien client (éviter exploitation brute-force, liens à durée de vie limitée).

* Synchronisation temps réel des créneaux disponibles (éviter surréservation).

* UX contextuelle selon langues/fréquence mobilité des clients.

* Robustesse en cas de coupure réseau mobile lors de la livraison ou consultation.

---

## Milestones & Sequencing

### Project Estimate

* **Medium (3–4 semaines)**

### Team Size & Composition

* **3–4 personnes** :

  * 1 Product Manager / Product Owner (MOA + cadrage fonctionnel)

  * 1–2 Développeurs full-stack (API, Front/Back, DevOps)

  * 1 Designer UI/UX (assets, wireframes, prototypes)

### Suggested Phases

**Phase 1 : Architecture & Setup (1 Semaine)**

* Key Deliverables : Schéma DB, modèles entités, scaffolding API & Front, maquettes interfaces (Designer/Dev).

* Dependencies : Aucun.

**Phase 2 : Interfaces Core & Saisie Commande (1 Semaine)**

* Key Deliverables : Interface agent (CRUD commande), interface admin (agence/agents), génération liens.

* Dependencies : Setup architecture.

**Phase 3 : Flow de Proposition & Intégration Messaging (1 Semaine)**

* Key Deliverables : Génération/envoi liens SMS/email, page client décision, prise en charge créneaux & paiement.

* Dependencies : Interfaces core opérationnelles.

**Phase 4 : Testing & Déploiement (1 Semaine)**

* Key Deliverables : Tests bout-en-bout (flow, UI, intégrations SMS/email), corrections, passage en prod pilote.

* Dependencies : Phases précédentes abouties.

---