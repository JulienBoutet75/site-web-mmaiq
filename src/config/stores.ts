// Fiches officielles de l'application sur les stores.
// À renseigner (variables d'environnement Vite) dès que les URL sont confirmées :
// tant qu'elles sont vides, les boutons ouvrent un message « lien bientôt disponible »
// plutôt qu'un lien vers une application homonyme.
export const STORE_URLS = {
  ios: import.meta.env.VITE_APP_STORE_URL || "",
  android: import.meta.env.VITE_PLAY_STORE_URL || "",
} as const;

export type StorePlatform = keyof typeof STORE_URLS;
