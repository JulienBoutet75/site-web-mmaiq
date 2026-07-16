// Attribution partenaire (salles/clubs) côté site, phase pré-lancement.
// Un lien mmaiq.fr/...?ref=CODE ou une landing /s/:slug dépose le code en
// localStorage ; il est ensuite injecté dans les leads (waitlist) pour
// attribuer les pré-inscriptions à une salle. Le pipeline de commissions
// (attributions/paiements/ledger) vivra dans lab-service, pas ici.

const STORAGE_KEY = "mmaiq_ref";

// 60 jours : l'acquisition naît physiquement en salle (affiche vue chaque
// semaine), le délai de réflexion est long.
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

const CODE_PATTERN = /^[A-Z0-9]{3,14}$/;

export interface StoredReferral {
  code: string;
  ts: number;
}

// Normalise une saisie utilisateur ("gracie lyon" → "GRACIELYON").
// Retourne null si le résultat ne ressemble pas à un code valide.
export function normalizeRefCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const code = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return CODE_PATTERN.test(code) ? code : null;
}

export function saveReferral(rawCode: string): string | null {
  const code = normalizeRefCode(rawCode);
  if (!code) return null;
  try {
    const stored: StoredReferral = { code, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage indisponible (navigation privée…) : attribution best-effort.
  }
  return code;
}

export function getReferral(): StoredReferral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredReferral;
    if (!stored?.code || !CODE_PATTERN.test(stored.code)) return null;
    if (Date.now() - stored.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
}
