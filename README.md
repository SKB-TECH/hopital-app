# Afia-Smart Hospital Frontend

Frontend Next.js du système hospitalier Afia-Smart.

## Démarrage local

```bash
pnpm install
pnpm dev
```

Application :

```txt
http://localhost:3000/fr
```

## Variables d’environnement

```env
NEXT_PUBLIC_APP_NAME=Afia-Smart
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api/proxy/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
HOSPITAL_API_URL=http://localhost:3000
```

En production :

```env
NEXT_PUBLIC_API_URL=/api/proxy/api/v1
NEXT_PUBLIC_API_BASE_URL=https://votre-api.com
HOSPITAL_API_URL=https://votre-api.com
NEXT_PUBLIC_APP_NAME=Afia-Smart
```

Le front appelle l’API via :

```txt
/api/proxy/api/v1/*
```

Le proxy Next.js transmet ensuite vers :

```txt
NEXT_PUBLIC_API_BASE_URL
```

ou :

```txt
HOSPITAL_API_URL
```

## Connexion

Compte seed par défaut :

```txt
admin@hospital.local
ChangeMe123!
```

À changer immédiatement en production.

## Modules

Le menu affiche uniquement les modules autorisés pour l’utilisateur connecté.

Les permissions sont gérées ici :

```txt
Administration & Sécurité
→ Utilisateurs
→ Nouveau / Modifier
→ Permissions modules
```

L’éditeur de permissions filtre automatiquement les modules selon les rôles sélectionnés.

Exemple :

```txt
RECEPTIONIST
→ Patients
→ Réception
→ Rendez-vous
→ Hospitalisation
→ Assurance
```

## Configuration SMS métier

```txt
Administration & Sécurité
→ Plan vaccination SMS
→ Règles CPN SMS
→ Conseils postpartum SMS
```

Si rien n’est configuré, le backend utilise son plan automatique par défaut.

## Build

```bash
pnpm build
pnpm start
```

## Dépannage

Si l’interface affiche :

```txt
Connexion au serveur indisponible
```

regarder le détail affiché :

```txt
HTTP 500 · GET · /route — Internal server error
```

Puis vérifier côté API :

```bash
pnpm migration:run
```

et les variables :

```env
NEXT_PUBLIC_API_BASE_URL
HOSPITAL_API_URL
DATABASE_URL
REDIS_URL
```

## Documentation complète

Le guide complet API + front + Railway + SMS + permissions est dans :

```txt
/Users/macbookair/work/hospital/README.md
```
