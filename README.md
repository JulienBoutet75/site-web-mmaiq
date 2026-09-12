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

## Réinitialisation du mot de passe

Le formulaire de connexion envoie un lien Supabase vers
`/connexion/nouveau-mot-de-passe` sur l'origine utilisée par le visiteur.
La page attend la session issue du lien, puis permet d'enregistrer le nouveau
mot de passe. Un lien invalide ou expiré renvoie vers la demande d'un nouveau lien.

Un relais local détecte également l'événement Supabase `PASSWORD_RECOVERY` et le
marqueur initial `type=recovery`. Si le callback arrive sur l'accueil via le
`SITE_URL`, le visiteur est redirigé une seule fois vers le formulaire après
l'initialisation de l'authentification. Le signal reste en mémoire et est consommé ;
aucun jeton n'est recopié dans l'URL et une simple connexion ne déclenche pas ce relais.

L'autorisation des URL exactes reste recommandée pour que les callbacks arrivent
directement au bon endroit. Dans Supabase, **Authentication → URL Configuration →
Redirect URLs**, autoriser les URL des environnements utilisés, notamment :

- `https://mmaiq.fr/connexion/nouveau-mot-de-passe`
- `http://localhost:3000/connexion/nouveau-mot-de-passe` pour le développement local

Ajouter également l'URL exacte d'un domaine de prévisualisation ou de `www` s'il
sert le site. Si le modèle d'email de récupération a été personnalisé, conserver
le lien de confirmation Supabase (`{{ .ConfirmationURL }}`) pour que le jeton
soit vérifié avant le retour sur cette page. Aucun paramètre distant n'est modifié
par le code de ce dépôt.

Documentation : [redirections Auth Supabase](https://supabase.com/docs/guides/auth/redirect-urls)
et [envoi du lien de récupération](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
