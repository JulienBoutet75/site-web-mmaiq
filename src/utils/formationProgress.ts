/**
 * Progression de lecture des formations Academy.
 *
 * Le navigateur garde la progression pour un affichage immédiat, par
 * utilisateur et par formation :
 *   Clé   : `mmaiq.formation-progress.v1:<userId>:<formationId>`
 *   Valeur: JSON `number[]`, numéros (1, 2, 3…) des chapitres terminés,
 *           dans l’ordre `sort_order` de `formation_chapters`.
 * On stocke le numéro plutôt que l’id du chapitre : l’éditeur admin recrée les
 * lignes `formation_chapters` à chaque enregistrement (les ids changent).
 *
 * Si la table Supabase `formation_progress` existe (supabase_formation_progress.sql),
 * la progression y est aussi enregistrée et fusionnée (union) : elle suit alors
 * l’élève d’un appareil à l’autre. Sans la table, seul le navigateur est utilisé.
 */
import { supabase } from "../lib/supabase";

const KEY_PREFIX = "mmaiq.formation-progress.v1";
const TABLE = "formation_progress";

const storageKey = (userId: string, formationId: string) => `${KEY_PREFIX}:${userId}:${formationId}`;

// Table absente ou inaccessible : on n’insiste pas pendant la session.
let serverUnavailable = false;

function normalize(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  const numbers = values.filter((value): value is number => Number.isInteger(value) && value > 0);
  return [...new Set(numbers)].sort((a, b) => a - b);
}

function writeLocal(userId: string, formationId: string, chapters: number[]) {
  try {
    window.localStorage.setItem(storageKey(userId, formationId), JSON.stringify(chapters));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la progression reste en mémoire pour la session.
  }
}

async function pushRemote(userId: string, formationId: string, chapters: number[]) {
  if (serverUnavailable) return;
  const { error } = await supabase.from(TABLE).upsert(
    { user_id: userId, formation_id: formationId, completed_chapters: chapters, updated_at: new Date().toISOString() },
    { onConflict: "user_id,formation_id" },
  );
  if (error) serverUnavailable = true;
}

/** Numéros des chapitres terminés (triés, sans doublon). */
export function readCompletedChapters(userId: string, formationId: string): number[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId, formationId));
    return normalize(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

/** Marque un chapitre comme terminé et renvoie la liste à jour. */
export function markChapterCompleted(userId: string, formationId: string, chapterNumber: number): number[] {
  const next = normalize([...readCompletedChapters(userId, formationId), chapterNumber]);
  writeLocal(userId, formationId, next);
  void pushRemote(userId, formationId, next);
  return next;
}

/**
 * Fusionne la progression du navigateur et celle du serveur pour ces formations.
 * Renvoie `true` si la progression locale a changé (il faut alors relire).
 */
export async function syncCompletedChapters(userId: string, formationIds: string[]): Promise<boolean> {
  if (serverUnavailable || formationIds.length === 0) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .select("formation_id, completed_chapters")
    .eq("user_id", userId)
    .in("formation_id", formationIds);
  if (error || !data) {
    serverUnavailable = true;
    return false;
  }
  let changed = false;
  for (const formationId of formationIds) {
    const local = readCompletedChapters(userId, formationId);
    const remote = normalize(data.find((row) => row.formation_id === formationId)?.completed_chapters);
    const merged = normalize([...local, ...remote]);
    if (merged.length !== local.length) {
      writeLocal(userId, formationId, merged);
      changed = true;
    }
    if (merged.length !== remote.length) void pushRemote(userId, formationId, merged);
  }
  return changed;
}

/** Nombre de chapitres terminés parmi `total` (ignore les numéros hors programme). */
export function countCompleted(completed: number[], total: number) {
  return completed.filter((n) => n <= total).length;
}
