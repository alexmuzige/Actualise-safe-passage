<div align="center">

# 🛡️ SITREP-NK

**Plateforme d’analyse de risque humanitaire pour les itinéraires du Nord-Kivu**

[![Stack](https://img.shields.io/badge/stack-TanStack%20Start%20v1-blue)](https://tanstack.com/start/latest)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite)](https://vitejs.dev)

</div>

> **SITREP-NK** centralise les rapports terrain, évalue les itinéraires et aide les équipes humanitaires à décider rapidement avant de partir.  
> Conçu pour des environnements à connectivité intermittente, avec un moteur de scoring temps réel et une cartographie opérationnelle.

---

## 📑 Table des matières

1. [Aperçu](#aperçu)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture](#architecture)
4. [Moteur de scoring](#moteur-de-scoring)
5. [Démarrage rapide](#démarrage-rapide)
6. [Structure du projet](#structure-du-projet)
7. [Roadmap](#roadmap)
8. [Licence](#licence)

---

## 🌍 Aperçu

SITREP-NK vise à répondre à un besoin concret des missions humanitaires en **République Démocratique du Congo** : connaître le niveau de risque d’un trajet avant de l’emprunter. La plateforme combine :

- un **réseau d’informateurs** qui saisissent des incidents structurés depuis le terrain ;
- un **tableau de bord opérationnel** avec KPI et alertes en temps réel ;
- un **moteur d’analyse** qui pondère chaque incident (gravité, catégorie, ancienneté) ;
- des **recommandations** claires : passage, déviation ou report.

---

## ✨ Fonctionnalités

### 🏠 Page d’accueil publique
- Présentation du projet, des capacités et du processus opérationnel.
- Accès direct aux pages **Login** et **Signup**.
- Preuve sociale avec des statistiques clés (rapports/semaine, aires de santé, temps de décision).

### 🔐 Authentification
- Pages **Login** et **Signup** avec design cohérent.
- Tunnel d’accès réservé aux organisations humanitaires accréditées.
- Prêt pour l’intégration d’un backend d’authentification (Lovable Cloud / Supabase).

### 📊 Tableau de bord (`/dashboard`)
- KPIs : rapports actifs, alertes des 72 dernières heures, tronçons à risque, zones concernées.
- Carte opérationnelle schématique du Nord-Kivu avec les incidents et leur niveau de risque.
- Liste des itinéraires classés par score avec recommandations.
- Flux terrain des rapports récents.

### 📝 Rapport terrain (`/rapport`)
- Formulaire structuré pour saisir un incident.
- Catégorisation : affrontement, embuscade, enlèvement, engin explosif, pillage, manifestation, barrage illégal, autre.
- Gestion de la gravité, de la localisation, des pièces jointes et du mode hors-ligne.
- Notifications `toast` après soumission.

### 📋 Suivi des incidents (`/incidents`)
- Liste filtrable et triable de tous les rapports.
- Statuts : vérifié, non vérifié, résolu.
- Export CSV des données.

### 🗺️ Analyse d’itinéraire (`/itineraires`)
- Détail par itinéraire et par tronçon.
- Calcul du score global et des scores par segment.
- Recommandation adaptée à chaque parcours.

### 🏥 Zones de santé (`/zones`)
- Tableau des zones de santé suivies.
- Score de risque agrégé par zone.
- Classement dynamique des zones les plus sensibles.

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19 + TanStack)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Landing     │  │  Auth Pages  │  │  Dashboard / App │  │
│  │  (publique)   │  │  /login     │  │  /dashboard      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State & Data Layer                         │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │  incidents-store.ts  │  │  mock-data.ts (seed + scoring)│  │
│  │  (Zustand-like hook) │  │  zones, segments, itinéraires  │  │
│  └──────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Scoring Engine                             │
│  score = Σ(severityWeight × categoryWeight × ageDecay)        │
│  classification : faible / modéré / élevé / critique        │
│  recommandation : passage / déviation / report                │
└─────────────────────────────────────────────────────────────┘
```

La stack technique est volontairement légère et moderne pour faciliter le déploiement sur un worker edge :

| Couche | Outil |
|--------|-------|
| Framework full-stack | [TanStack Start v1](https://tanstack.com/start) |
| UI | React 19 + TypeScript 5.8 |
| Styling | Tailwind CSS v4 + variables CSS (`oklch`) |
| Build | Vite 8 |
| Components | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Notifications | Sonner |
| Forms | React Hook Form + Zod |
| Package manager | Bun |

---

## 🧮 Moteur de scoring

Chaque incident est pondéré selon trois dimensions :

| Dimension | Description |
|-----------|-------------|
| **Gravité** | Échelle 1 à 5. Poids croissants : `0, 10, 22, 40, 62, 85`. |
| **Catégorie** | Multiplicateur : engin explosif (1.3), embuscade (1.25), affrontement (1.2), enlèvement (1.15), etc. |
| **Ancienneté** | Décroissance exponentielle sur 7 jours : `exp(-days / 7)`. |

### Score d’un tronçon

```typescript
segmentScore = Σ(severityWeight × categoryWeight × ageDecay)
```

### Score d’un itinéraire

```typescript
itineraryScore = maxSegmentScore × 0.65 + averageSegmentScore × 0.35
```

### Classification

| Score | Classe | Recommandation |
|-------|--------|----------------|
| 0 – 24 | Faible | Passage |
| 25 – 49 | Modéré | Passage avec vigilance |
| 50 – 69 | Élevé | Déviation |
| 70 – 100 | Critique | Report |

---

## 🚀 Démarrage rapide

### Prérequis

- [Bun](https://bun.sh) (recommandé) ou Node.js ≥ 20

### Installation

```bash
# Cloner le projet
git clone <repo-url>
cd sitrep-nk

# Installer les dépendances
bun install

# Lancer le serveur de développement
bun run dev
```

L’application est accessible sur [http://localhost:8080](http://localhost:8080).

### Build de production

```bash
bun run build
```

### Linter & formatage

```bash
bun run lint
bun run format
```

---

## 📁 Structure du projet

```text
.
├── public/                  # Assets statiques
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── app-layout.tsx   # Layout principal avec sidebar
│   │   ├── incident-row.tsx # Ligne d’incident
│   │   ├── risk-badge.tsx   # Badge de classification
│   │   └── risk-map.tsx     # Carte opérationnelle schématique
│   ├── hooks/               # Hooks personnalisés
│   ├── lib/                 # Logique métier
│   │   ├── incidents-store.ts   # Store des incidents (in-memory)
│   │   ├── mock-data.ts         # Données + moteur de scoring
│   │   └── utils.ts             # Utilitaires (cn, etc.)
│   ├── routes/              # Routage fichier TanStack Start
│   │   ├── __root.tsx       # Layout racine
│   │   ├── index.tsx        # Landing page
│   │   ├── login.tsx        # Connexion
│   │   ├── signup.tsx       # Inscription
│   │   ├── dashboard.tsx    # Tableau de bord
│   │   ├── rapport.tsx      # Saisie d’un rapport terrain
│   │   ├── incidents.tsx    # Liste des incidents
│   │   ├── itineraires.tsx  # Analyse d’itinéraire
│   │   └── zones.tsx        # Zones de santé
│   ├── router.tsx           # Configuration du router
│   ├── start.ts             # Configuration serveur
│   ├── styles.css           # Tokens de design + Tailwind v4
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🗺️ Données opérationnelles

Les zones de santé couvertes par le prototype :

- Goma, Sake, Masisi, Rutshuru, Kibirizi
- Kanyabayonga, Lubero, Beni, Walikale

Les principaux itinéraires suivis :

- Goma → Rutshuru → Kanyabayonga → Beni
- Goma → Sake → Masisi
- Masisi → Walikale
- Goma → Sake → Masisi → Walikale

> **Note** : les coordonnées utilisées sur la carte sont **schématiques** (grille 0-100) et ne remplacent pas un système SIG/GPS réel. Elles servent à la démonstration du moteur de scoring et de l’interface.

---

## 🔮 Roadmap

- [ ] Connecter un backend d’authentification (Lovable Cloud / Supabase)
- [ ] Persister les incidents en base de données PostgreSQL
- [ ] Upload et stockage sécurisé des pièces jointes
- [ ] Mode offline-first avec synchronisation différée
- [ ] Rôles granulaires : informateur, analyste, coordinateur
- [ ] Cartographie GPS réelle avec tuiles OpenStreetMap
- [ ] Alertes temps réel (push / SMS) pour les nouveaux incidents critiques
- [ ] Export multi-format (PDF, Excel, GeoJSON)
- [ ] API publique pour intégration tierce

---

## 🤝 Contribution

Les contributions sont les bienvenues. Pour proposer une évolution :

1. Ouvrir une issue pour discuter du besoin.
2. Créer une branche dédiée.
3. Soumettre une pull request avec des captures d’écran si elle touche à l’UI.

---

## 📜 Licence

Ce projet est distribué sous licence [MIT](./LICENSE).  
Développé dans un cadre humanitaire fictif pour la démonstration d’une plateforme d’aide à la décision.

---

<div align="center">

**SITREP-NK** · *La décision avant le départ.*

</div>
