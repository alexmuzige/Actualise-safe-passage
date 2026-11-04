# Dossier `src/api` — couche d'accès au serveur

La base de l'API est `https://safe-passage-navigator-1.onrender.com/api`.
`VITE_API_BASE_URL` peut désigner la racine du serveur ou se terminer par `/api`.
Les URL de routes sont centralisées dans `endpoints.ts`.

| Fichier | Rôle |
| --- | --- |
| `config.ts` | Base URL (`VITE_API_BASE_URL`), timeout, retries, mode mock |
| `endpoints.ts` | Routes publiées par le serveur |
| `client.ts` | Client HTTP : JSON, formulaires, cookies, timeout, reprises GET et `ApiError` |
| `auth.api.ts` | Connexion et réinitialisation du mot de passe |
| `actors.api.ts` | Recherche et gestion des acteurs |
| `users.api.ts` | Comptes, inscription, rôles et genres |
| `incidents.api.ts` | Lecture et création selon le contrat actuel du serveur |
| `permissions.api.ts` | Permissions et affectation aux rôles/utilisateurs |
| `analytics.api.ts` | Entraînement et opérations d'analyse publiées |
| `zones.api.ts` | Signale explicitement les routes de zones/itinéraires absentes |
| `index.ts` | Ré-exports (`import { fetchIncidents } from "@/api"`) |

## Routes présentes

Les chemins sont vérifiés par rapport à l'OpenAPI du serveur :

- Authentification : `POST /login`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Acteurs : `/actors/list`, `/actors/type`, `/actors/create`, `/actors/update/{id}`, `/actors/delete/{id}`
- Utilisateurs : `/user/list`, `/user/{id}`, `/user/create`, `/user/update/{id}`, `/user/delete/{id}`, `/user/roles`
- Incidents : `GET /incidents/stream`, `GET /incidents/{id}`, `POST /incidents/create`
- Permissions : `/permissions` et `/permissions/{id}`, synchronisation et affectation
- Analytics : `/analytics/train`, `/analytics/simulate-inference`, confirmation et correction de rapports

Les demandes non idempotentes ne sont pas automatiquement rejouées. Le client
gère les corps JSON et `application/x-www-form-urlencoded` selon le contrat serveur.

Après connexion, le client exige l'identifiant du compte dans la réponse de `/login`,
puis charge le compte avec `GET /user/{id}`. Le profil actif (nom, rôle et organisation)
vient de cet enregistrement serveur; les préférences opérationnelles sont conservées
localement et séparément pour chaque identifiant de compte. Les modifications du nom
passent par `PUT /user/update/{id}`. Si `/login` ne renvoie pas d'identifiant exploitable,
la connexion est refusée plutôt que d'afficher un profil local partagé ou incorrect.

## Routes encore nécessaires côté serveur

L'OpenAPI déployé ne publie pas d'API pour les zones/lieux, les tronçons,
itinéraires, exports, déconnexion, synchronisation ou vérification des incidents.
L'API de profils publiée déclare un paramètre `session` obligatoire de type objet
dans la query string, ce qui ne permet pas de l'appeler correctement depuis le client.

`POST /incidents/create` n'accepte que `type`, `risk_level`, `location_id` et
`description` en formulaire URL-encodé. Il ne publie ni les champs détaillés du
formulaire terrain, ni l'envoi de pièces jointes. Le formulaire de rapport refuse
donc de prétendre envoyer ces données au serveur. Il faut ajouter ces routes et
contrats au backend pour une intégration complète. Le client seul ne peut pas
créer des routes sur le serveur déployé.

```ts
import { endpoints, api, searchActors } from "@/api";

const actors = await searchActors({ q: "humanitaire" });
const users = await api.get(endpoints.users.list({ limit: 10 }));
```
