# MMA IQ — Site web

Plateforme de performance MMA : application, coaching vidéo et équipement.
Stack : React 19 + Vite + Tailwind v4, backend Supabase, paiements Stripe,
serveur Express (`server.ts`).

## Lancer en local

**Prérequis :** Node.js

1. Installer les dépendances :
   `npm install`
2. Copier `.env.example` en `.env` et renseigner les valeurs (Supabase, Stripe).
3. Démarrer :
   `npm run dev`

L'app est servie sur http://localhost:3000.

## Scripts

- `npm run dev` — serveur de développement (Vite + Express)
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build
- `npm run lint` — vérification TypeScript (`tsc --noEmit`)
