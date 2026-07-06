# 🛡️ MMA IQ — Audit production-readiness

> **6 juillet 2026** · Méthode : 60 agents, 7 dimensions, chaque constat vérifié en contradiction.
> **51 constats confirmés, 2 écartés.**

## Verdict : ❌ pas prêt pour la prod tant que la Phase 0 n'est pas faite

Le site tourne et se connecte bien à Supabase, mais l'architecture **fait confiance au navigateur pour le prix et les droits d'accès**. En l'état : on peut payer une formation 0,01 €, télécharger tout le contenu payant gratuitement, prendre le contrôle de n'importe quel compte coach, et se promouvoir admin.

| Sévérité | Nombre |
|---|---|
| 🔴 Blockers | 7 |
| 🟠 Élevés | 8 |
| 🟡 Moyens | 11 |
| 🔵 Mineurs | 7 |

## 🎯 La cause racine (1 seule décision d'architecture)

L'app est une **SPA 100 % client** qui parle à Supabase avec la clé publique `anon` et décide du prix + de l'accès dans le navigateur. Tout ce qui vit dans le navigateur est lisible et falsifiable.

➡️ La majorité des blockers disparaissent avec **une seule correction structurelle** : une **couche serveur de confiance** (le serveur Express existant, ou des Edge Functions Supabase `service_role`) responsable du prix, du webhook Stripe, des URLs vidéo signées et de l'identité coach/admin — **puis durcir les RLS**.

## 🗺️ Feuille de route

- **Phase 0 — avant tout paiement réel :** les 7 blockers. Ne pas passer les clés Stripe `live` ni ouvrir les inscriptions avant.
- **Phase 1 — avant ouverture publique :** RGPD, durcissement API, Error Boundary, chemin d'exécution prod, socle SEO.
- **Phase 2 — fiabilité & maintenabilité :** RLS en migrations, hébergement/secrets, tests+lint+CI, TS strict, code-splitting.
- **Phase 3 — finitions :** 404, idempotence, TLS, nettoyage code mort.

---

## 🔴 BLOCKERS (Phase 0)

### B1 — Le prix du paiement est fixé par le client · effort M
Le serveur construit la session Stripe à partir du prix envoyé par le navigateur, sans le revérifier. Un `POST /api/create-checkout-session` avec `price:0.01` achète n'importe quoi pour quelques centimes.
- **Fix :** le serveur ne reçoit que des identifiants, relit `price_cents` depuis Supabase (service_role), construit lui-même `unit_amount`. Idéalement des Price IDs Stripe.
- **Preuve :** `server.ts:58` · `stripeService.ts:6-19` · `Course.tsx:341` · `ProductDetail.tsx:66`

### B2 — Aucun webhook Stripe : paiement jamais confirmé, achat jamais livré · effort L
Aucune route webhook, et rien n'écrit jamais dans `purchases`. Le client paie, est débité, arrive sur `/success`… mais la vidéo reste verrouillée. Argent encaissé, produit non livré → chargebacks.
- **Fix :** `POST /api/stripe/webhook` (express.raw + vérif signature `STRIPE_WEBHOOK_SECRET`), sur `checkout.session.completed` insérer la purchase via service_role. Débloquer l'accès **uniquement** sur cette base serveur.
- **Preuve :** `server.ts` (0 webhook) · `Success.tsx` statique · `Course.tsx:271` (lecture seule)

### B3 — Paywall 100 % côté client, code d'accès lisible en anon · effort L
Déverrouillage via flag `localStorage` + `access_code` stocké dans `formations.long_description`, lisible en clair par l'API anonyme (codes réels vus : `Q72EZX`, `6121OU`).
- **Fix :** sortir `access_code` des colonnes lisibles par anon ; valider l'achat côté serveur ; ne renvoyer l'URL vidéo (signée) qu'après validation.
- **Preuve :** `Course.tsx:266` (localStorage) · `Course.tsx:322` (comparaison côté navigateur)

### B4 — Vidéos payantes dans un bucket Storage public · effort M
Vérifié en direct : la clé anon liste tous les fichiers de `formations-videos`, et un `GET /object/public/…` sans auth renvoie les octets (HTTP 206). Tout le catalogue est téléchargeable gratuitement.
- **Fix :** bucket **privé** + URLs signées à courte durée, générées côté serveur après achat `completed` vérifié.
- **Preuve :** `storage/v1/object/public/formations-videos/…` · `supabase.ts:82`

### B5 — Clés d'accès coach lisibles en anon + login coach côté client · effort L
`coaches` est en `SELECT USING(true)` → la clé anon renvoie **toutes les `access_key` en clair**. Le login coach n'est qu'un SELECT par clé + session `localStorage`. N'importe qui se connecte comme n'importe quel coach.
- **Fix :** ne plus exposer `access_key` (vue/RPC/hash) ; vrai compte Supabase (JWT) ; `isCoach` basé sur JWT vérifié. **Régénérer toutes les clés.**
- **Preuve :** `fix_coaches_recursion.sql:12` · `Connexion.tsx:32-50` · `AuthContext.tsx:127`

### B6 — Escalade de privilèges → super_admin · effort S _(le plus rapide)_
La policy UPDATE sur `profiles` n'a ni `WITH CHECK` ni restriction de colonne → tout utilisateur authentifié met `role='super_admin'` sur sa propre ligne et prend le contrôle total. L'app fait elle-même cet UPDATE.
- **Fix :** `WITH CHECK` / trigger interdisant tout changement de `role` hors service_role ; retirer l'auto-élévation côté client.
- **Preuve :** `final_rls_fix.sql:81-82` · `Admin.tsx:98-104,232`

### B7 — Tunnel d'abonnement non fonctionnel · effort M
Les CTA des plans Pricing (5,99–19,99 €) sont des `<button>` **sans `onClick`**. Le modèle de revenus principal (abonnements) est impossible à souscrire.
- **Fix :** câbler chaque CTA à `createCheckoutSession` en mode `subscription` (Price IDs récurrents). Dépend de B1/B2.
- **Preuve :** `PricingSection.tsx:183-198`

---

## 🟠 ÉLEVÉS (Phase 1)

- **H1 — Emails de tous les users exposés en anon (RGPD)** · S — `profiles SELECT USING(true)` ; un curl anonyme dump tous les emails+rôles. Fix : SELECT limité à `auth.uid()=id OR admin`. `final_rls_fix.sql:78`
- **H2 — Écritures coach en anon (le token est ignoré)** · L — `insert/update/deleteData` ignorent `accessToken` → soit RLS bloque (dashboard cassé), soit `formation_chapters` (sans policy) accepte des écritures anonymes. `supabase.ts:145-184` · `CoachDashboard.tsx:373-399`
- **H3 — API Express sans auth/validation/rate-limit/CORS** · M — endpoint paiement ouvert, erreurs Stripe brutes renvoyées. Fix : JWT requis, validation zod→400, helmet, CORS, express-rate-limit. `server.ts:17,39,71`
- **H4 — Gating admin côté client + email admin en dur** · M — `isAdmin` dérivé d'un email en dur, `/admin` sans ProtectedRoute, repli RLS sur `user_metadata.email` (contrôlable). `AuthContext.tsx:125` · `App.tsx:51`
- **H5 — Aucune Error Boundary** · S — un throw au rendu = page blanche totale. Fix : Error Boundary racine + états loading/erreur/vide.
- **H6 — Clé Gemini dans le bundle client** · M — `vite.config.ts:11` inline la clé dans le JS public. _Actuellement neutralisé (clé vide, à ta demande)._ Reco : **retirer les 2 boutons IA** (fonction morte) + supprimer le `define`.
- **H7 — SEO quasi nul** · M–L — SPA sans SSR, un seul `title`, aucune meta/OG, `lang` incorrect. Fix court : react-helmet + sitemap/robots ; moyen : prerender (Vite SSG) ou SSR.
- **H8 — Aucun chemin d'exécution prod** · S — pas de script `start`, `NODE_ENV` jamais `production` → reste en mode dev même déployé. `package.json` · `server.ts:76`

---

## 🟡 MOYENS (Phase 2)

1. **Scripts SQL RLS contradictoires** à la racine, hors migrations, sans `ENABLE RLS` explicite → risque base déployée ≠ code. Consolider dans `supabase/migrations`.
2. **Sessions en `localStorage` sans expiration**, exposées au XSS.
3. **Stock produit ni vérifié ni décrémenté** côté serveur (survente).
4. **Gestion des secrets prod non définie** — `VITE_*` figées au build, `.env` non déployé.
5. **Aucune config de déploiement**, Node non épinglé (`engines`), dépendance native lourde `better-sqlite3` inutilisée.
6. **Bundle monolithique 1,66 Mo** (430 Ko gzip) sans code-splitting → `React.lazy` sur pages lourdes/admin.
7. **Port 3000 en dur**, pas de `process.env.PORT`.
8. **TS `strict`/`noImplicitAny` désactivés** (~116 `any`).
9. **Aucun test, ni lint/format, ni CI.**
10. **Gestion d'erreur incohérente** (throw vs null silencieux).
11. **`fetchData` réimplémente le parsing PostgREST à la main** (fragile, redondant).

## 🔵 MINEURS (Phase 3)

1. Clés Supabase committées + fallback « projet par défaut » + identité admin en dur (`supabase.ts:4-5`).
2. `/success` affiche succès sans vérifier la session Stripe + aucune route 404.
3. Pas de clé d'idempotence Stripe, devise/TVA non gérées.
4. `adminMode` par défaut à `super_admin` dans le contexte.
5. `generateBullets` dupliqué + modèle Gemini en dur douteux (`gemini-3-flash-preview`).
6. Serveur HTTP clair sans TLS/reverse proxy (à couvrir par l'hébergeur).
7. Dépendances mortes (`better-sqlite3`, `d3`, `@types/d3`) + `recolor.js` orphelin.

---

## ✅ Déjà fait aujourd'hui (reconnexion propre)

- Backend Supabase rebranché (6 tables OK), `.env` câblé client+serveur.
- Dépendances installées, `.env.example` complété.
- 8 imports `framer-motion` → `motion/react` corrigés.
- Validé : typecheck OK, build prod OK (2828 modules), dev sur `localhost:3000`.
- Gemini laissé désactivé (0 crédit).

## 🚫 Écartés par la vérification (2 faux positifs)

- « Mot de passe admin CMS en dur » → code mort, jamais monté ; juste à supprimer.
- « Écritures via anon sans revalidation serveur » → architecture Supabase normale ; le vrai risque est déjà couvert par B5/B6.

## ⚠️ Action immédiate hors code

Pendant l'audit, de vraies **clés coach et emails clients** ont été lus via l'API publique (c'est le blocker B5). **Régénère les `access_key` des coaches** par précaution.

---

## Ordre d'attaque recommandé (Phase 0)

**B6 → B1 → B2 → B4/B3 → B5 → B7** (du plus rapide/impactant au plus lourd).

Lot conseillé pour démarrer : **B1 + B2** (« paiement infalsifiable » : prix relu en base + webhook Stripe + écriture `purchases`) — rétablit un vrai tunnel d'achat fiable.
