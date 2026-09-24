# Dossier `src/api` — couche d'accès à la base de données

Tous les liens (URLs) vers le backend sont centralisés ici. Aucun composant ne
doit contenir d'URL en dur.

| Fichier | Rôle |
| --- | --- |
| `config.ts` | Base URL (`VITE_API_BASE_URL`), timeout, retries, mode mock |
| `endpoints.ts` | Catalogue de **tous les liens** (auth, incidents, zones, itinéraires, admin, exports) |
| `client.ts` | Client HTTP unique : `api.get/post/patch/delete`, timeout, retry, `ApiError` |
| `incidents.api.ts` | Rapports terrain : liste, détail, création, vérification, synchro hors-ligne |
| `zones.api.ts` | Zones de santé, tronçons, itinéraires, scores |
| `auth.api.ts` | Connexion, inscription, profil, matrice des droits (page `/admin`) |
| `index.ts` | Ré-exports (`import { fetchIncidents } from "@/api"`) |

## Mode actuel

Sans `VITE_API_BASE_URL`, `API_MOCK_MODE = true` : les fonctions renvoient les
données locales (`src/lib/mock-data.ts`, `incidents-store`). L'application
fonctionne donc en front-only aujourd'hui.

## Brancher une vraie base de données

1. Définir `VITE_API_BASE_URL` (ex. `https://api.sitrep-nk.org/v1`).
2. Les mêmes fonctions appellent alors le backend, sans toucher aux écrans.
3. Ajouter toute nouvelle route dans `endpoints.ts` uniquement.

```ts
import { fetchIncidents, endpoints, api } from "@/api";

const incidents = await fetchIncidents({ zone: "zs-goma", minSev: 3 });
const zones = await api.get(endpoints.zones.list());
```
