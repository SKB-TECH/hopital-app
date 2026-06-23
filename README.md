# Kongo Event Pro

Setup complet pour Kongo Event avec :

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui style
- next-intl multilangue : FR, EN, LN
- Logo intégré
- Couleurs configurées selon le logo
- Pages de base : accueil, événements, à propos, contact, login
- Composants : Header, Footer, Hero, Features, EventsPreview
- UI components : Button, Card, Input, Textarea, Badge

## Installation

```bash
yarn install
yarn dev
```

Puis ouvre :

```txt
http://localhost:3000/fr
```

## Commandes utiles

```bash
yarn typecheck
yarn build
```

## Ajouter un composant shadcn

```bash
npx shadcn@latest add dialog dropdown-menu sheet
```

## Structure

```txt
app/
  [locale]/
    page.tsx
    layout.tsx
    events/
    about/
    contact/
    auth/login/
components/
  layout/
  sections/
  shared/
  ui/
i18n/
messages/
config/
lib/
public/images/
```
# hopital-app
